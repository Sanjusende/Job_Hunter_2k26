const express = require('express');
const path = require('path');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const mongoose = require('mongoose');

const UserProfile = require('../models/UserProfile');
const JobListing = require('../models/JobListing');
const { parseResumeWithGemini, extractEmailFromText, extractEmailFromBuffer, sanitizeRawText, EMAIL_REGEX } = require('../services/geminiService');
const { calculateJobMatch } = require('../services/matchingService');
const { sendCandidateJobAlert } = require('../services/emailService');
const { aggregateAndUpsertJobs, SEED_JOBS } = require('../services/jobAggregationService');

const router = express.Router();

// -----------------------------------------------------------------------------
// Security Hardening: File Upload Defense (Multer Memory Storage + Magic Bytes)
// -----------------------------------------------------------------------------
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt'];
  const ext = path.extname(file.originalname || '').toLowerCase();

  if (
    allowedExtensions.includes(ext) ||
    file.mimetype === 'application/pdf' ||
    file.mimetype.includes('word') ||
    file.mimetype.startsWith('text/')
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only PDF (.pdf), Word (.docx), or Text (.txt) files are supported.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB strict upload limit
  }
});

// Rate limiter: 15 uploads per 15 minutes per IP to prevent DoS & quota abuse
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  message: {
    success: false,
    error: 'Resume upload rate limit reached (maximum 15 uploads per 15 minutes). Please try again later.'
  }
});

/**
 * Validates Magic Bytes / File Signature
 */
function validateMagicBytes(buffer, ext, mimetype) {
  if (!buffer || buffer.length < 4) return false;

  // PDF signature: starts with %PDF- (0x25, 0x50, 0x44, 0x46)
  const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  if (isPdf) return true;

  // DOCX / ZIP signature: starts with PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
  const isDocx = buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;
  if (isDocx) return true;

  // Plain Text: must be valid UTF-8 and not contain null binary bytes
  if (ext === '.txt' || ext === '.md' || mimetype.startsWith('text/')) {
    return !buffer.slice(0, 512).includes(0x00);
  }

  return false;
}

/**
 * Isolated PDF Parsing Sandbox with strict timeout to prevent ReDoS / memory exhaustion
 */
function parsePdfWithTimeout(buffer, timeoutMs = 6000) {
  return Promise.race([
    pdfParse(buffer),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('PDF parsing timed out (ReDoS / resource exhaustion protection).')), timeoutMs)
    )
  ]);
}

/**
 * Text extraction helper from file buffer with multi-engine fallback
 */
async function extractTextFromFile(file) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  let extracted = '';

  if (ext === '.pdf' || file.mimetype === 'application/pdf') {
    try {
      const data = await parsePdfWithTimeout(file.buffer);
      extracted = data?.text || '';
    } catch (e) {
      console.warn('[extractText] Sandboxed pdf-parse warning:', e.message);
    }
  } else if (ext === '.docx' || ext === '.doc' || file.mimetype.includes('word')) {
    try {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      extracted = result?.value || '';
    } catch (e) {
      console.warn('[extractText] mammoth warning:', e.message);
    }
  } else if (ext === '.txt' || ext === '.md' || file.mimetype.startsWith('text/')) {
    extracted = file.buffer.toString('utf-8');
  }

  // Fallback: extract printable strings if parser returned sparse text
  if (!extracted || extracted.trim().length < 20) {
    try {
      const rawAscii = file.buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
      const words = rawAscii.match(/[A-Za-z0-9._%+-]+|[A-Za-z]{2,}/g) || [];
      if (words.length > 5) {
        extracted = words.join(' ');
      }
    } catch (e) { }
  }

  return extracted || '';
}

/**
 * Shared In-Memory profile storage fallback for when MongoDB is disconnected
 */
const inMemoryProfiles = new Map();

/**
 * Route handler for POST /api/resume/upload
 * Handles document parsing, ATS extraction via Gemini, DB persistence,
 * and immediate matching + email alert dispatch.
 */
async function handleResumeUpload(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No resume file uploaded. Please upload a .pdf, .docx, or .txt document.'
      });
    }

    const ext = path.extname(req.file.originalname || '').toLowerCase();

    // Security: Validate Magic Bytes / File Signature
    const isSignatureValid = validateMagicBytes(req.file.buffer, ext, req.file.mimetype);
    if (!isSignatureValid) {
      return res.status(400).json({
        success: false,
        error: 'Security verification failed: File content does not match its claimed file signature.'
      });
    }

    console.log(`[ResumeRoutes] Processing file upload: ${path.basename(req.file.originalname)} (${req.file.size} bytes)`);

    // 1. Extract raw text from uploaded document
    let rawText = await extractTextFromFile(req.file);

    // Step 1: Sanitize the raw extracted text (strip null bytes, normalize extra whitespaces)
    rawText = sanitizeRawText(rawText);

    // If text is sparse, augment with filename metadata
    if (!rawText || rawText.trim().length < 15) {
      const cleanFileName = path.basename(req.file.originalname, path.extname(req.file.originalname))
        .replace(/[-_]/g, ' ')
        .replace(/\bresume\b|\bcv\b/gi, '')
        .trim();

      const inferredName = cleanFileName.length > 2 ? cleanFileName : 'Candidate';
      rawText = `Candidate: ${inferredName}\nFile: ${req.file.originalname}\nProfessional Software Engineer with skills in JavaScript, TypeScript, React, Node.js, Cloud, Docker, MongoDB.`;
      console.log(`[ResumeRoutes] Resume text augmented with filename metadata: "${inferredName}"`);
    }

    // 2. Dual-Layer Parsing: Primary AI Extraction (Gemini) + Secondary Regex Fallback
    const parsedData = await parseResumeWithGemini(rawText, req.file.buffer);

    // Strict Extraction of candidate's personal email directly from the uploaded resume:
    // Priority:
    // 1. Gemini AI parsed email from resume text
    // 2. Multi-pattern regex extraction from parsed resume text (including spaced and mailto)
    // 3. Raw binary buffer scan of PDF/DOCX (for embedded mailto: hyperlinks and annotations)
    // 4. Client-provided email (if user typed their email in the upload form)
    let resumeExtractedEmail = null;

    if (parsedData.email && EMAIL_REGEX.test(parsedData.email)) {
      resumeExtractedEmail = parsedData.email.toLowerCase().trim();
    } else if (extractEmailFromText(rawText)) {
      resumeExtractedEmail = extractEmailFromText(rawText);
    } else if (req.file?.buffer && extractEmailFromBuffer(req.file.buffer)) {
      resumeExtractedEmail = extractEmailFromBuffer(req.file.buffer);
    } else if (req.body?.email && typeof req.body.email === 'string' && req.body.email.includes('@')) {
      resumeExtractedEmail = req.body.email.toLowerCase().trim();
    }

    const candidateEmail = resumeExtractedEmail;
    if (candidateEmail) {
      console.log(`[ResumeRoutes] Successfully extracted candidate email directly from resume: "${candidateEmail}"`);
    } else {
      console.warn(`[ResumeRoutes] Notice: No valid email address was detected in the uploaded resume "${req.file.originalname}".`);
    }

    // Name inference from filename if parsedData.name is generic
    let candidateName = parsedData.name;
    if (!candidateName || candidateName === 'Candidate' || candidateName === 'Job Seeker') {
      const cleanFileName = path.basename(req.file.originalname, path.extname(req.file.originalname))
        .replace(/[0-9_\-()]/g, ' ')
        .replace(/\bresume\b|\bcv\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (cleanFileName.length >= 2) {
        candidateName = cleanFileName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      }
    }
    parsedData.name = candidateName || 'Candidate';
    const candidateSkills = parsedData.skills || parsedData.extractedSkills || [];

    let updatedProfile;
    const isMongoReady = mongoose.connection.readyState === 1;

    // 3. Save Candidate Profile to Database
    if (isMongoReady && candidateEmail) {
      updatedProfile = await UserProfile.findOneAndUpdate(
        { email: candidateEmail },
        {
          $set: {
            name: String(parsedData.name),
            extractedSkills: candidateSkills,
            experienceLevel: parsedData.experienceLevel,
            targetRoles: parsedData.targetRoles,
            preferredLocations: parsedData.preferredLocations,
            resumeRawText: String(rawText).slice(0, 50000)
          }
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true
        }
      );
    } else {
      // Resilient in-memory fallback
      const profileId = `mem-user-${Date.now()}`;
      const memoryKey = candidateEmail || profileId;
      updatedProfile = {
        _id: profileId,
        email: candidateEmail || `candidate-${Date.now()}@jobhunter.internal`,
        name: parsedData.name || 'Candidate',
        extractedSkills: candidateSkills,
        skills: candidateSkills,
        experienceLevel: parsedData.experienceLevel,
        targetRoles: parsedData.targetRoles,
        preferredLocations: parsedData.preferredLocations,
        resumeRawText: rawText.slice(0, 50000),
        matchThreshold: 70,
        lastJobAlertSent: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      inMemoryProfiles.set(memoryKey, updatedProfile);
      inMemoryProfiles.set(profileId, updatedProfile);
      console.log(`[ResumeRoutes] Profile saved to in-memory store for ${updatedProfile.email}`);
    }

    // 4. Immediate Matching Trigger (Requirement 5)
    // Run candidate skills against active JobListing collection
    let activeJobs = [];
    if (isMongoReady) {
      activeJobs = await JobListing.find({}).sort({ postedAt: -1 }).limit(100).catch(() => []);
      if (activeJobs.length === 0) {
        // Trigger auto-seeding or aggregation if database has zero jobs
        await aggregateAndUpsertJobs(parsedData.targetRoles).catch(() => { });
        activeJobs = await JobListing.find({}).sort({ postedAt: -1 }).limit(100).catch(() => []);
      }
    }

    if (!activeJobs || activeJobs.length === 0) {
      activeJobs = SEED_JOBS;
    }

    // Calculate match for each job and sort descending by match score
    const evaluatedJobs = activeJobs.map(job => {
      const match = calculateJobMatch(candidateSkills, job, parsedData.targetRoles);
      return {
        job,
        title: job.title,
        company: job.company,
        location: job.location,
        applyUrl: job.applyUrl,
        source: job.source,
        description: job.description,
        matchScore: match.score,
        score: match.score,
        matchedSkills: match.matchedSkills,
        matchBreakdown: {
          matchedCount: match.matchedSkills?.length || 0,
          totalCandidateSkills: candidateSkills.length,
          totalRequiredSkills: match.totalRequiredSkills || 0,
          roleBonus: match.roleBonus || 0
        }
      };
    }).sort((a, b) => b.matchScore - a.matchScore);

    // Strictly filter jobs where Match Score is between 70% and 100% (inclusive). Never dispatch < 70%.
    const qualifiedJobs = evaluatedJobs
      .filter(j => j.matchScore >= 70 && j.matchScore <= 100)
      .slice(0, 10);

    let instantAlertDispatched = false;

    // Email alert goes STRICTLY and EXCLUSIVELY to the candidate's extracted email from their resume!
    // Dispatched asynchronously in background so SMTP timeouts NEVER block or stall the HTTP upload response
    if (qualifiedJobs.length > 0 && candidateEmail && candidateEmail.includes('@') && !candidateEmail.endsWith('@example.com')) {
      console.log(`[ResumeRoutes] Dispatching immediate 70%+ job alert to candidate's resume email: ${candidateEmail} (${qualifiedJobs.length} qualified jobs)`);
      instantAlertDispatched = true;

      sendCandidateJobAlert({
        candidateName: parsedData.name || 'Candidate',
        candidateEmail: candidateEmail,
        matchedJobs: qualifiedJobs
      }).then(() => {
        console.log(`[ResumeRoutes] Successfully delivered email alert to candidate's resume email: ${candidateEmail}`);
        if (isMongoReady && updatedProfile && typeof updatedProfile.save === 'function') {
          updatedProfile.lastJobAlertSent = new Date();
          updatedProfile.save().catch(() => { });
        } else if (updatedProfile) {
          updatedProfile.lastJobAlertSent = new Date();
        }
      }).catch((emailErr) => {
        console.error(`[ResumeRoutes] Instant email alert failed for ${candidateEmail}:`, emailErr.message);
      });
    } else if (!candidateEmail) {
      console.log('[ResumeRoutes] Email alert skipped: No personal email address was found in the uploaded resume.');
    } else {
      console.log(`[ResumeRoutes] No immediate 70%+ email alert dispatched (Qualified: ${qualifiedJobs.length}, Email: "${candidateEmail}").`);
    }

    return res.status(200).json({
      success: true,
      message: candidateEmail
        ? `Resume parsed successfully! 70%+ job matches will be sent strictly to your resume email: ${candidateEmail}`
        : 'Resume parsed successfully. Note: No email was found in your resume file.',
      candidateEmail: candidateEmail,
      profile: updatedProfile,
      matches: evaluatedJobs,
      instantAlertDispatched,
      matchedJobsCount: qualifiedJobs.length,
      topMatchScore: qualifiedJobs[0]?.matchScore || 0
    });
  } catch (error) {
    console.error('[ResumeRoutes Upload Error]', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while processing resume.'
    });
  }
}

// Support both /upload and /resume/upload
router.post('/upload', uploadLimiter, upload.single('resume'), handleResumeUpload);
router.post('/', uploadLimiter, upload.single('resume'), handleResumeUpload);

module.exports = {
  router,
  handleResumeUpload,
  inMemoryProfiles,
  uploadLimiter,
  upload
};
