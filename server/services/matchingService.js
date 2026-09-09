/**
 * Deterministic Matching Engine
 * Compares candidate skills against job requirements and computes precise match scores
 */

const COMMON_TECH_KEYWORDS = [
  'javascript', 'typescript', 'node.js', 'nodejs', 'react', 'react.js', 'reactjs', 'vue', 'angular',
  'python', 'django', 'fastapi', 'flask', 'java', 'spring', 'springboot', 'go', 'golang',
  'rust', 'c++', 'c#', '.net', 'dotnet', 'php', 'laravel', 'ruby', 'rails',
  'docker', 'kubernetes', 'k8s', 'aws', 'amazon web services', 'azure', 'gcp', 'google cloud',
  'mongodb', 'postgresql', 'postgres', 'mysql', 'sql', 'nosql', 'redis', 'elasticsearch',
  'graphql', 'rest', 'restful', 'api', 'microservices', 'ci/cd', 'devops', 'terraform',
  'ansible', 'jenkins', 'git', 'github', 'gitlab', 'linux', 'unix', 'tailwind', 'tailwindcss',
  'next.js', 'nextjs', 'express', 'express.js', 'html', 'css', 'sass', 'redux', 'kafka',
  'rabbitmq', 'spark', 'hadoop', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch'
];

/**
 * Normalizes skill strings: trim, lowercase, and clean
 * @param {string} skill
 * @returns {string}
 */
function normalizeSkill(skill) {
  return String(skill || '')
    .trim()
    .toLowerCase()
    .replace(/^[-•*#\s]+/, '')
    .trim();
}

/**
 * Extracts distinct technical requirements present in a job listing
 * @param {string} jobText
 * @returns {string[]}
 */
function extractJobRequiredSkills(jobText) {
  const text = (jobText || '').toLowerCase();
  const detected = new Set();

  for (const keyword of COMMON_TECH_KEYWORDS) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
    if (regex.test(text)) {
      detected.add(keyword);
    }
  }

  return Array.from(detected);
}

/**
 * Calculates deterministic match percentage between candidate skills and job requirements
 *
 * Requirements:
 * 1. Normalize candidate skills: trim, lowercase, tokenize.
 * 2. Extract required terms from job.title and job.description.
 * 3. Calculate matched skills count and total required skills.
 * 4. Score formula:
 *    Score = min(100, round((Direct Matched Skills Count / max(Total Required Skills, 4)) * 100))
 * 5. Bonus points (+15%) if candidate's targetRoles matches words in job.title.
 * 6. Return { score: Number, matchedSkills: [String] }.
 *
 * @param {Array<string>|object} candidateSkills - Array of skills OR candidate profile object
 * @param {object} job - JobListing record
 * @param {Array<string>} [targetRoles] - Optional array of candidate target roles
 * @returns {{ score: number, matchScore: number, matchedSkills: string[], totalRequiredSkills: number }}
 */
function calculateJobMatch(candidateSkills, job, targetRoles = []) {
  if (!job) {
    return { score: 0, matchScore: 0, matchedSkills: [], totalRequiredSkills: 0 };
  }

  // 1. Normalize Candidate Skills and Target Roles
  let rawSkills = [];
  let roles = Array.isArray(targetRoles) ? [...targetRoles] : [];

  if (Array.isArray(candidateSkills)) {
    rawSkills = candidateSkills;
  } else if (typeof candidateSkills === 'object' && candidateSkills !== null) {
    rawSkills = candidateSkills.skills || candidateSkills.extractedSkills || [];
    if (Array.isArray(candidateSkills.targetRoles) && roles.length === 0) {
      roles = candidateSkills.targetRoles;
    }
  }

  // Tokenize & normalize candidate skills: trim, lowercase, unique
  const normalizedCandidateSkills = Array.from(
    new Set(
      rawSkills
        .flatMap(s => {
          if (typeof s !== 'string') return [];
          const cleaned = normalizeSkill(s);
          if (!cleaned) return [];
          // Tokenize comma or slash separated skill lists
          if (cleaned.includes('/') || cleaned.includes(',')) {
            return cleaned.split(/[/,]/).map(t => normalizeSkill(t)).filter(Boolean);
          }
          return [cleaned];
        })
        .filter(s => s.length > 0)
    )
  );

  // 2. Prepare Job Content
  const jobTitle = String(job.title || '').trim().toLowerCase();
  const jobDescription = String(job.description || '').trim().toLowerCase();
  const jobCompany = String(job.company || '').trim().toLowerCase();
  const combinedJobText = `${jobTitle} ${jobDescription} ${jobCompany}`;

  // 3. Extract required terms from job.title and job.description
  const jobRequiredSkills = extractJobRequiredSkills(`${jobTitle} ${jobDescription}`);
  const totalRequiredSkills = jobRequiredSkills.length;

  // 4. Calculate Direct Matched Skills Count
  const directMatchedSkills = [];

  for (const skill of normalizedCandidateSkills) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');

    if (regex.test(combinedJobText)) {
      directMatchedSkills.push(skill);
    }
  }

  // 5. Match Score Formula:
  // Score = min(100, round((Direct Matched Skills Count / max(Total Required Skills, 4)) * 100))
  const denominator = Math.max(totalRequiredSkills, 4);
  const rawBaseScore = Math.round((directMatchedSkills.length / denominator) * 100);
  let baseScore = Math.min(100, Math.max(0, rawBaseScore));

  // 6. Role Affinity Bonus (+15%) if candidate's targetRoles matches words in job.title
  let hasRoleBonus = false;
  for (const role of roles) {
    if (!role || typeof role !== 'string') continue;
    const cleanRole = role.toLowerCase().trim();
    if (!cleanRole) continue;

    // Full role title match
    if (jobTitle.includes(cleanRole)) {
      hasRoleBonus = true;
      break;
    }

    // Word token match (words with length > 3, e.g. "stack", "frontend", "backend", "architect", "engineer", "devops")
    const tokens = cleanRole.split(/\s+/).filter(t => t.length > 3);
    if (tokens.some(token => jobTitle.includes(token))) {
      hasRoleBonus = true;
      break;
    }
  }

  const roleBonusPoints = hasRoleBonus ? 15 : 0;
  const finalScore = Math.min(100, Math.max(0, baseScore + roleBonusPoints));

  return {
    score: finalScore,
    matchScore: finalScore, // Backward-compatible alias
    matchedSkills: directMatchedSkills,
    totalRequiredSkills,
    roleBonus: hasRoleBonus
  };
}

module.exports = {
  calculateJobMatch,
  extractJobRequiredSkills,
  normalizeSkill
};
