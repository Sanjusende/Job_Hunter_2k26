const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env'), override: true });

const cron = require('node-cron');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const UserProfile = require('./models/UserProfile');
const JobListing = require('./models/JobListing');
const { aggregateAndUpsertJobs, SEED_JOBS } = require('./services/jobAggregationService');
const { calculateJobMatch } = require('./services/matchingService');
const { sendCandidateJobAlert } = require('./services/emailService');

let isPipelineRunning = false;
let scheduledTask = null;

/**
 * Main Candidate-Specific Matching & Email Dispatch Pipeline
 */
async function runMatchingPipeline() {
  if (isPipelineRunning) {
    console.log('[Worker] Previous pipeline execution is still in progress. Skipping cycle.');
    return;
  }

  isPipelineRunning = true;
  const startTime = Date.now();
  console.log(`\n[Worker] ========================================================`);
  console.log(`[Worker] Autonomous Pipeline Triggered at ${new Date().toISOString()}`);
  console.log(`[Worker] ========================================================`);

  try {
    const isMongoReady = mongoose.connection.readyState === 1;

    // 1. Query all candidates from UserProfile
    let candidates = [];
    if (isMongoReady) {
      candidates = await UserProfile.find({}).catch(() => []);
    }

    if (candidates.length === 0) {
      console.log('[Worker] No candidate profiles found in UserProfile.');
      return;
    }

    console.log(`[Worker] Active candidate profiles evaluated: ${candidates.length}`);

    // Step A: Aggregate fresh jobs for all candidates' target roles
    const roleSet = new Set(['Full Stack Developer', 'DevOps Engineer', 'Cloud Architect']);
    for (const c of candidates) {
      if (Array.isArray(c.targetRoles)) {
        c.targetRoles.forEach(r => {
          if (r && r.trim()) roleSet.add(r.trim());
        });
      }
    }
    const targetRoles = Array.from(roleSet).slice(0, 8);
    console.log(`[Worker] Aggregating jobs for target roles:`, targetRoles);

    if (isMongoReady) {
      await aggregateAndUpsertJobs(targetRoles).catch(err => console.warn('[Worker] Aggregation warning:', err.message));
    }

    // Step B: Fetch active JobListing records from MongoDB
    let activeJobs = [];
    if (isMongoReady) {
      activeJobs = await JobListing.find({}).sort({ postedAt: -1 }).limit(250).catch(() => []);
    }
    if (activeJobs.length === 0) {
      activeJobs = SEED_JOBS;
    }

    console.log(`[Worker] Active job listing pool size: ${activeJobs.length}`);

    let totalDispatches = 0;

    // 2. Process each individual candidate
    for (const candidate of candidates) {
      const candidateEmail = String(candidate.email || '').trim().toLowerCase();
      const candidateSkills = (Array.isArray(candidate.extractedSkills) && candidate.extractedSkills.length > 0)
        ? candidate.extractedSkills
        : (Array.isArray(candidate.skills) ? candidate.skills : []);

      // Check if candidate has a valid email and non-empty extractedSkills
      if (!candidateEmail || !candidateEmail.includes('@') || candidateSkills.length === 0) {
        console.log(`[Worker] Skipping candidate ${candidate.name || 'Unknown'}: Missing valid email or extracted skills.`);
        continue;
      }

      // Run each job through calculateJobMatch(candidate.extractedSkills, job)
      const evaluatedJobs = activeJobs.map(job => {
        const match = calculateJobMatch(candidateSkills, job, candidate.targetRoles);
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
          matchedSkills: match.matchedSkills
        };
      });

      // Strictly filter jobs: 70% <= matchScore <= 100%
      const qualifiedJobs = evaluatedJobs
        .filter(j => j.matchScore >= 70 && j.matchScore <= 100)
        .sort((a, b) => b.matchScore - a.matchScore) // Highest score first
        .slice(0, 10); // Top 10 matches max per email

      // Dispatch or skip
      if (qualifiedJobs.length > 0) {
        try {
          await sendCandidateJobAlert({
            candidateName: candidate.name || 'Candidate',
            candidateEmail: candidate.email,
            matchedJobs: qualifiedJobs
          });

          // Update user record: user.lastJobAlertSent = new Date()
          if (isMongoReady && typeof candidate.save === 'function') {
            candidate.lastJobAlertSent = new Date();
            await candidate.save().catch(() => {});
          }

          console.log(`[Worker] Dispatched ${qualifiedJobs.length} jobs to candidate: ${candidate.email}`);
          totalDispatches++;
        } catch (err) {
          console.error(`[Worker] Failed dispatching to candidate ${candidate.email}:`, err.message);
        }
      } else {
        console.log(`[Worker] No 70%+ match found for candidate ${candidate.email}. Skipping email dispatch.`);
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Worker] Pipeline cycle completed in ${elapsed}s. Total candidate emails sent: ${totalDispatches}`);
  } catch (error) {
    console.error('[Worker] Fatal error during pipeline execution:', error);
  } finally {
    isPipelineRunning = false;
  }
}

/**
 * Bootstrap Background Daemon
 */
async function startWorker() {
  console.log('=======================================================');
  console.log('🤖 Job Hunter Autonomous Background Cron Worker Starting');
  console.log(`Process PID: ${process.pid}`);
  console.log('=======================================================');

  await connectDB().catch(() => {});

  const cronSchedule = process.env.CRON_SCHEDULE || '0 */6 * * *';
  console.log(`[Worker] Registering cron schedule: "${cronSchedule}"`);

  if (!cron.validate(cronSchedule)) {
    console.error(`[Worker] Invalid cron expression: "${cronSchedule}". Defaulting to "0 */6 * * *"`);
  }

  scheduledTask = cron.schedule(cron.validate(cronSchedule) ? cronSchedule : '0 */6 * * *', () => {
    console.log('[Worker] Scheduled cron trigger fired.');
    runMatchingPipeline();
  });

  // Initial warm-up cycle
  setTimeout(() => {
    console.log('[Worker] Running initial pipeline warm-up cycle...');
    runMatchingPipeline();
  }, 3000);
}

// -----------------------------------------------------------------------------
// Graceful Shutdown Handlers
// -----------------------------------------------------------------------------
async function handleShutdown(signal) {
  console.log(`\n[Worker] Received ${signal}. Initiating graceful shutdown...`);
  
  if (scheduledTask) {
    scheduledTask.stop();
  }

  if (isPipelineRunning) {
    let waitCount = 0;
    while (isPipelineRunning && waitCount < 10) {
      await new Promise(res => setTimeout(res, 1000));
      waitCount++;
    }
  }

  console.log('[Worker] Background worker shut down cleanly.');
  process.exit(0);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// If executed directly
if (require.main === module) {
  startWorker().catch(err => {
    console.error('[Worker] Failed to launch worker:', err);
    process.exit(1);
  });
}

module.exports = {
  runMatchingPipeline,
  startWorker
};
