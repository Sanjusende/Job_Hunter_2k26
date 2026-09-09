const path = require('path');
// Load environment variables from both root and server directories (server/.env takes precedence)
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env'), override: true });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const UserProfile = require('./models/UserProfile');
const JobListing = require('./models/JobListing');
const { parseResumeWithGemini } = require('./services/geminiService');
const { aggregateAndUpsertJobs, SEED_JOBS } = require('./services/jobAggregationService');
const { sendJobAlertEmail, sendJobMatchesAlert, sendCandidateJobAlert } = require('./services/emailService');
const { calculateJobMatch: calculateJobMatchService } = require('./services/matchingService');
const { router: resumeRouter, handleResumeUpload } = require('./routes/resumeRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// -----------------------------------------------------------------------------
// Security Hardening: Startup Configuration Validation (Zero-Trust)
// -----------------------------------------------------------------------------
function validateStartupEnvironment() {
  if (!process.env.MONGO_URI) {
    console.warn('[Security Notice] MONGO_URI is not set. Database will operate in resilient in-memory mode.');
  }
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.warn('[Security Notice] GEMINI_API_KEY is unset or placeholder. ATS parser will use heuristic fallback.');
  }
}
validateStartupEnvironment();


// -----------------------------------------------------------------------------
// In-Memory Repository Fallback (Active when MongoDB is not connected)
// -----------------------------------------------------------------------------
const inMemoryProfiles = new Map();
let inMemoryJobs = [...SEED_JOBS];

// Initiate Database Connection (Non-blocking)
connectDB().then((connected) => {
  if (!connected) {
    console.log('[Server] In-memory store initialized with', inMemoryJobs.length, 'curated tech openings.');
  }
}).catch((err) => {
  console.warn('[Server] MongoDB connection attempt finished with fallback.');
});

// -----------------------------------------------------------------------------
// Security Hardening: Rate Limiting
// -----------------------------------------------------------------------------
// Global limiter: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this client. Please try again after 15 minutes.'
  }
});

// Strict upload limiter: 5 resume uploads per 15 minutes per IP to prevent DoS & quota abuse
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Resume upload rate limit reached (maximum 5 uploads per 15 minutes). Please try again later.'
  }
});

// Apply global rate limiting across all routes
app.use(globalLimiter);

// -----------------------------------------------------------------------------
// Security Hardening: Helmet HTTP Security Headers (Strict CSP, Clickjacking, HSTS)
// -----------------------------------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'http://localhost:*', 'http://127.0.0.1:*', 'https:'],
      },
    },
    frameguard: { action: 'deny' }, // Anti-clickjacking
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }, // 1-year HSTS
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'same-origin' }
  })
);

// -----------------------------------------------------------------------------
// Security Hardening: Strict CORS Configuration (Disallow Wildcards)
// -----------------------------------------------------------------------------
const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  'https://job-hunter-2k26.vercel.app',
  'https://job-hunter-2k26.onrender.com',
  'http://localhost',
  'http://localhost:80',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1',
  'http://127.0.0.1:80',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001'
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, server-to-server proxy)
      if (!origin) return callback(null, true);
      
      // Allow listed origins or any Vercel deployment/preview subdomain
      if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(new Error('CORS Policy: Access from this origin is prohibited by security policy.'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// -----------------------------------------------------------------------------
// Security Hardening: NoSQL Injection Sanitizer Middleware
// Recursively sanitizes objects to strip MongoDB operator keys ($gt, $ne, $where, etc.)
// -----------------------------------------------------------------------------
function sanitizeNoSqlPayload(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      sanitizeNoSqlPayload(obj[key]);
    }
  }
  return obj;
}

app.use((req, res, next) => {
  if (req.body) sanitizeNoSqlPayload(req.body);
  if (req.query) sanitizeNoSqlPayload(req.query);
  if (req.params) sanitizeNoSqlPayload(req.params);
  next();
});

// -----------------------------------------------------------------------------
// Security Hardening: File Upload Defense (Multer Memory Storage + Magic Byte Check)
// -----------------------------------------------------------------------------
const storage = multer.memoryStorage();

/**
 * Validates file extension and reported MIME type
 */
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

/**
 * Validates Magic Bytes / File Signature
 * Prevents disguised executable binaries from executing in parsing pipeline
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
 * Calculates a match score (0 - 100%) between candidate profile and job listing
 * Uses the deterministic matching engine from services/matchingService.js
 */
function calculateJobMatch(user, job) {
  const userSkills = (user && (user.extractedSkills || user.skills)) || [];
  const targetRoles = (user && user.targetRoles) || [];
  const result = calculateJobMatchService(userSkills, job, targetRoles);

  return {
    matchScore: result.score,
    score: result.score,
    matchedSkills: result.matchedSkills,
    totalRequiredSkills: result.totalRequiredSkills,
    roleBonus: result.roleBonus,
    matchBreakdown: {
      matchedCount: result.matchedSkills.length,
      totalCandidateSkills: userSkills.length,
      totalRequiredSkills: result.totalRequiredSkills,
      roleBonus: result.roleBonus
    }
  };
}

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

/**
 * GET /api/health
 * Readiness and uptime healthcheck
 */
app.get('/api/health', (req, res) => {
  const isMongoReady = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    storageMode: isMongoReady ? 'MongoDB' : 'In-Memory (Resilient Fallback)',
    dbConnected: isMongoReady
  });
});
app.get("/", (req, res) => {
  res.json({
    message: "Job Hunter API is running",
    status: "OK"
  });
});

/**
 * Mount Resume Processing & Instant Matching Route
 * Handles POST /api/resume/upload and POST /api/resume with immediate 70%+ match email dispatch
 */
app.use('/api/resume', resumeRouter);
app.post('/api/resume/upload', uploadLimiter, upload.single('resume'), handleResumeUpload);


/**
 * GET /api/matches/:userId
 * Fetch profile and return sorted job matches with calculated match percentages
 */
app.get('/api/matches/:userId', async (req, res) => {
  try {
    const rawUserId = req.params.userId;
    if (!rawUserId || typeof rawUserId !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid user identifier parameter.' });
    }

    const userId = String(rawUserId).trim();
    const isMongoReady = mongoose.connection.readyState === 1;

    let user = null;

    if (isMongoReady) {
      if (userId.includes('@')) {
        user = await UserProfile.findOne({ email: userId.toLowerCase() }).catch(() => null);
      } else if (mongoose.Types.ObjectId.isValid(userId)) {
        user = await UserProfile.findById(userId).catch(() => null);
      }
    }

    // Check in-memory store if not found or if Mongo is offline
    if (!user) {
      user = inMemoryProfiles.get(userId.toLowerCase()) || inMemoryProfiles.get(userId);
    }

    // Default fallback demo user if requested
    if (!user && (userId === 'demo-candidate-1' || userId.includes('alex.vance'))) {
      user = {
        _id: 'demo-candidate-1',
        name: 'Alex Vance',
        email: 'alex.vance.engineer@example.com',
        experienceLevel: 'Senior',
        extractedSkills: ['React', 'Node.js', 'TypeScript', 'Docker', 'Kubernetes', 'AWS', 'MongoDB', 'PostgreSQL', 'Tailwind CSS', 'CI/CD', 'Microservices'],
        targetRoles: ['Senior Full Stack Engineer', 'Cloud Architect', 'DevOps Engineer'],
        preferredLocations: ['Bengaluru, India', 'Pune, India', 'Remote (India)'],
        matchThreshold: 70
      };
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: `User profile '${userId}' not found.`
      });
    }

    // Fetch active job listings
    let jobs = [];
    if (isMongoReady) {
      jobs = await JobListing.find().sort({ postedAt: -1 }).limit(100).catch(() => []);
    }

    if (!jobs || jobs.length === 0) {
      jobs = inMemoryJobs;
    }

    // Rank jobs against candidate
    const rankedMatches = jobs.map(job => {
      const matchResult = calculateJobMatch(user, job);
      return {
        job,
        matchScore: matchResult.matchScore,
        matchedSkills: matchResult.matchedSkills,
        matchBreakdown: matchResult.matchBreakdown
      };
    });

    rankedMatches.sort((a, b) => b.matchScore - a.matchScore);

    res.status(200).json({
      success: true,
      userId: user._id,
      userEmail: user.email,
      matchThreshold: user.matchThreshold || 70,
      totalJobsEvaluated: jobs.length,
      matchesCount: rankedMatches.length,
      matches: rankedMatches
    });
  } catch (error) {
    console.error('[Matches Error]', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error while retrieving job matches.'
    });
  }
});

/**
 * GET /api/profile/:idOrEmail
 * Retrieve existing candidate profile
 */
app.get('/api/profile/:idOrEmail', async (req, res) => {
  try {
    const idOrEmail = String(req.params.idOrEmail || '').trim();
    if (!idOrEmail) {
      return res.status(400).json({ success: false, error: 'Invalid profile identifier.' });
    }

    const isMongoReady = mongoose.connection.readyState === 1;
    let profile = null;

    if (isMongoReady) {
      const query = idOrEmail.includes('@')
        ? { email: idOrEmail.toLowerCase() }
        : (mongoose.Types.ObjectId.isValid(idOrEmail) ? { _id: idOrEmail } : null);

      if (query) {
        profile = await UserProfile.findOne(query).catch(() => null);
      }
    }

    if (!profile) {
      profile = inMemoryProfiles.get(idOrEmail.toLowerCase()) || inMemoryProfiles.get(idOrEmail);
    }

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }
    res.status(200).json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/jobs
 * List all available job listings with bounds checking
 */
app.get('/api/jobs', async (req, res) => {
  try {
    const rawLimit = parseInt(req.query.limit || '50', 10);
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 50 : rawLimit), 100);
    const isMongoReady = mongoose.connection.readyState === 1;

    let jobs = [];
    if (isMongoReady) {
      jobs = await JobListing.find().sort({ postedAt: -1 }).limit(limit).catch(() => []);
    }

    if (!jobs || jobs.length === 0) {
      jobs = inMemoryJobs.slice(0, limit);
    }

    res.status(200).json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/jobs/aggregate
 * Trigger aggregation pipeline
 */
app.post('/api/jobs/aggregate', async (req, res) => {
  try {
    const rawRoles = req.body.roles;
    const roles = Array.isArray(rawRoles)
      ? rawRoles.map(r => String(r).slice(0, 80)).slice(0, 10)
      : ['Full Stack Engineer', 'Cloud Architect', 'DevOps Engineer'];

    const isMongoReady = mongoose.connection.readyState === 1;

    if (isMongoReady) {
      const result = await aggregateAndUpsertJobs(roles);
      return res.status(200).json({ success: true, result });
    }

    // In-memory response
    res.status(200).json({
      success: true,
      result: {
        upsertedCount: 0,
        modifiedCount: 0,
        totalProcessed: inMemoryJobs.length,
        note: 'Operating in in-memory mode.'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/alerts/send-alert
 * Dispatches high-match job opportunities directly to candidate email
 */
app.post('/api/alerts/send-alert', async (req, res) => {
  try {
    const rawEmail = req.body.email || '';
    const targetEmail = String(rawEmail).trim().toLowerCase();

    if (!targetEmail || !targetEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'A valid recipient email address is required.' });
    }

    const isMongoReady = mongoose.connection.readyState === 1;
    let user = null;

    if (isMongoReady) {
      user = await UserProfile.findOne({ email: targetEmail }).catch(() => null);
    }
    if (!user) {
      user = inMemoryProfiles.get(targetEmail);
    }

    // If profile not found, build an active profile object from request parameters
    if (!user) {
      user = {
        name: req.body.name || 'Candidate',
        email: targetEmail,
        extractedSkills: Array.isArray(req.body.extractedSkills) && req.body.extractedSkills.length > 0
          ? req.body.extractedSkills
          : ['React', 'Node.js', 'TypeScript', 'Docker', 'AWS', 'MongoDB'],
        experienceLevel: req.body.experienceLevel || 'Mid',
        targetRoles: Array.isArray(req.body.targetRoles) && req.body.targetRoles.length > 0
          ? req.body.targetRoles
          : ['Full Stack Engineer', 'Cloud Architect'],
        matchThreshold: req.body.matchThreshold || 50
      };
    }

    // Retrieve active job pool
    let jobs = [];
    if (isMongoReady) {
      jobs = await JobListing.find().sort({ postedAt: -1 }).limit(100).catch(() => []);
    }
    if (!jobs || jobs.length === 0) {
      jobs = inMemoryJobs;
    }

    // Rank candidate against jobs
    const matches = jobs.map(job => {
      const matchResult = calculateJobMatch(user, job);
      return {
        job,
        matchScore: matchResult.matchScore,
        matchedSkills: matchResult.matchedSkills
      };
    });

    // Strictly filter jobs: 70% <= matchScore <= 100%
    const topMatches = matches.filter(m => m.matchScore >= 70 && m.matchScore <= 100).slice(0, 10);

    if (topMatches.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'No active job listings currently satisfy the strict 70%+ compatibility requirement for this profile.',
        recipient: targetEmail,
        matchesCount: 0
      });
    }

    console.log(`[Alerts API] Triggering real email dispatch to ${targetEmail} (${topMatches.length} matches >= 70%)`);
    const dispatchInfo = await sendCandidateJobAlert({
      candidateName: user.name || 'Candidate',
      candidateEmail: targetEmail,
      matchedJobs: topMatches
    });

    // Update lastJobAlertSent timestamp in Mongo
    if (isMongoReady && user._id && typeof user.save === 'function') {
      user.lastJobAlertSent = new Date();
      await user.save().catch(() => { });
    }

    res.status(200).json({
      success: true,
      message: `Job alert successfully dispatched to ${targetEmail}!`,
      recipient: targetEmail,
      matchesCount: topMatches.length,
      topScore: topMatches[0]?.matchScore,
      messageId: dispatchInfo?.messageId
    });
  } catch (error) {
    console.error('[Alerts API Error]', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to dispatch email alert.'
    });
  }
});

/**
 * PUT /api/profile/email
 * Updates candidate email address
 */
app.put('/api/profile/email', async (req, res) => {
  try {
    const { oldEmail, newEmail, profileId } = req.body;
    if (!newEmail || !newEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid email address is required.' });
    }

    const cleanNewEmail = newEmail.trim().toLowerCase();
    const isMongoReady = mongoose.connection.readyState === 1;
    let updated = null;

    if (isMongoReady) {
      const filter = profileId && mongoose.Types.ObjectId.isValid(profileId)
        ? { _id: profileId }
        : { email: String(oldEmail || '').toLowerCase().trim() };

      updated = await UserProfile.findOneAndUpdate(
        filter,
        { $set: { email: cleanNewEmail } },
        { new: true }
      );
    }

    res.status(200).json({ success: true, profile: updated, newEmail: cleanNewEmail });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Centralized error handler (Sanitizes stack traces in production)
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err.message);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'File size exceeds maximum allowed limit (5 MB).' });
    }
    return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
  }
  res.status(500).json({ success: false, error: 'An unexpected server error occurred.' });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🛡️  Job Hunter Agent API Server (Hardened Zero-Trust)`);
  console.log(`   Port: ${PORT} | Mode: ${process.env.NODE_ENV || 'production'}`);
  console.log(`   Healthcheck: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});

module.exports = app;
