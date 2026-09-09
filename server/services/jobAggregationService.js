const axios = require('axios');
const JobListing = require('../models/JobListing');

/**
 * Standardized Indian Tech Hub Cities and Regions
 */
const INDIAN_TECH_HUBS = [
  'Bengaluru', 'Pune', 'Hyderabad', 'Noida', 'Gurugram',
  'Mumbai', 'Indore', 'Chennai', 'Delhi NCR', 'Remote (India)'
];

const INDIAN_CITY_KEYWORDS = [
  'bengaluru', 'bangalore', 'pune', 'hyderabad', 'noida',
  'gurugram', 'gurgaon', 'mumbai', 'indore', 'chennai',
  'delhi', 'kolkata', 'ahmedabad', 'kochi', 'coimbatore',
  'chandigarh', 'jaipur', 'trivandrum', 'india', 'remote'
];

/**
 * Validates whether a job posting is based in India or Remote (India)
 */
function isIndianLocation(countryCode, locationString, description = '') {
  if (countryCode && countryCode.toUpperCase() === 'IN') return true;
  
  const text = `${locationString || ''} ${description || ''}`.toLowerCase();
  return INDIAN_CITY_KEYWORDS.some(city => text.includes(city));
}

/**
 * High-fidelity curated jobs dataset strictly localized to Indian Tech Hubs
 */
const SEED_JOBS = [
  {
    jobId: 'in-job-1',
    title: 'Senior Full Stack Engineer (React / Node / AWS)',
    company: 'PhonePe Technologies',
    location: 'Bengaluru, Karnataka (Hybrid)',
    description: 'Looking for a Senior Full Stack Engineer experienced with React, Node.js, TypeScript, Docker, Kubernetes, and AWS microservices. Experience with MongoDB, distributed caching, and high-concurrency payment gateways required.',
    source: 'LinkedIn India',
    applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Senior+Full+Stack+Engineer+React+Node+Bengaluru',
    salary: '₹24,00,000 - ₹38,00,000 / yr',
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 6)
  },
  {
    jobId: 'in-job-2',
    title: 'DevOps & Cloud Platform Engineer',
    company: 'CRED Financial',
    location: 'Bengaluru, Karnataka (Remote)',
    description: 'Join our infrastructure engineering group to scale Kubernetes clusters on AWS and GCP, build robust Terraform modules, and maintain zero-downtime CI/CD pipelines. Strong Linux, Docker, and Python/Bash scripting skills required.',
    source: 'Indeed India',
    applyUrl: 'https://in.indeed.com/jobs?q=DevOps+Engineer+Kubernetes+AWS+Bengaluru',
    salary: '₹22,00,000 - ₹35,00,000 / yr',
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 14)
  },
  {
    jobId: 'in-job-3',
    title: 'Staff Frontend Architect (React / Next.js)',
    company: 'Swiggy Tech Labs',
    location: 'Hyderabad, Telangana (Hybrid)',
    description: 'Seeking a seasoned Frontend Architect proficient in React, Next.js, Vite, Tailwind CSS, TypeScript, and state management. You will architect enterprise design systems, lead Core Web Vitals optimization, and mentor engineers.',
    source: 'LinkedIn India',
    applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Frontend+Architect+React+Hyderabad',
    salary: '₹30,00,000 - ₹48,00,000 / yr',
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 18)
  },
  {
    jobId: 'in-job-4',
    title: 'Backend Systems Engineer (Node.js / Distributed Systems)',
    company: 'Razorpay Software',
    location: 'Pune, Maharashtra (Hybrid)',
    description: 'Design and deploy mission-critical banking microservices with Node.js, Express, Kafka, Redis, MongoDB, and PostgreSQL. Architect low-latency APIs, optimize query indexing, and implement ISO-compliant security workflows.',
    source: 'Naukri',
    applyUrl: 'https://www.naukri.com/node-js-jobs-in-pune',
    salary: '₹20,00,000 - ₹32,00,000 / yr',
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 22)
  },
  {
    jobId: 'in-job-5',
    title: 'Lead Cloud Infrastructure Architect',
    company: 'Tata Consultancy Services (Digital Cloud)',
    location: 'Gurugram, Haryana / Delhi NCR',
    description: 'Lead enterprise cloud transformations with deep AWS, Azure, and Kubernetes expertise. Responsibilities include container orchestration, Terraform infrastructure as code, cloud cost governance, and SOC2/ISO compliance.',
    source: 'LinkedIn India',
    applyUrl: 'https://www.linkedin.com/jobs/search/?keywords=Lead+Cloud+Architect+Gurugram+Delhi+NCR',
    salary: '₹32,00,000 - ₹50,00,000 / yr',
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 30)
  },
  {
    jobId: 'in-job-6',
    title: 'Full Stack JavaScript Developer (Mid-Senior)',
    company: 'Zomato Engineering',
    location: 'Noida, Uttar Pradesh (Hybrid/Remote)',
    description: 'We are hiring a Full Stack Developer to build high-scale web platforms using React, Node.js, Express, Tailwind CSS, and MongoDB. Experience with GraphQL, automated testing (Jest), and Docker is a strong plus.',
    source: 'Indeed India',
    applyUrl: 'https://in.indeed.com/jobs?q=Full+Stack+Developer+Noida+Delhi',
    salary: '₹16,00,000 - ₹26,00,000 / yr',
    postedAt: new Date(Date.now() - 1000 * 60 * 60 * 10)
  }
];

let jsearchAvailable = true;

/**
 * Fetch jobs strictly localized to the Indian Job Market from RapidAPI (JSearch)
 * @param {string} role
 * @returns {Promise<Array>}
 */
async function fetchFromJSearch(role = 'Full Stack Developer') {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey || apiKey === 'your_rapidapi_key_here' || !jsearchAvailable) {
    return [];
  }

  // Strictly append 'in India' to target the Indian Job Market
  const localizedQuery = `${role} in India`;

  try {
    const options = {
      method: 'GET',
      url: 'https://jsearch.p.rapidapi.com/search',
      params: {
        query: localizedQuery,
        country: 'in', // Force India country filter
        page: '1',
        num_pages: '1',
        date_posted: 'all'
      },
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': process.env.RAPIDAPI_HOST || 'jsearch.p.rapidapi.com'
      },
      timeout: 10000
    };

    const response = await axios.request(options);
    const jobs = response.data?.data || [];

    // Filter strictly for India listings
    const filteredJobs = jobs.filter(j => {
      const country = (j.job_country || '').toUpperCase();
      if (country === 'IN') return true;
      const fullLoc = `${j.job_city || ''} ${j.job_state || ''} ${j.job_country || ''}`.toLowerCase();
      return INDIAN_CITY_KEYWORDS.some(k => fullLoc.includes(k));
    });

    return filteredJobs.map(j => {
      const locParts = [j.job_city, j.job_state, 'India'].filter(Boolean);
      const formattedLocation = locParts.length > 1 ? locParts.join(', ') : 'Bengaluru, India';

      return {
        jobId: `jsearch-${j.job_id || Math.random().toString(36).substr(2, 9)}`,
        title: j.job_title || `${role} (India)`,
        company: j.employer_name || 'Hiring Company',
        location: formattedLocation,
        description: j.job_description || '',
        source: 'JSearch India',
        applyUrl: j.job_apply_link || j.job_google_link || `https://www.google.com/search?q=${encodeURIComponent(j.job_title + ' ' + (j.employer_name || '') + ' jobs India')}&ibp=htl;jobs`,
        salary: j.job_min_salary && j.job_max_salary 
          ? `₹${Math.round(j.job_min_salary).toLocaleString('en-IN')} - ₹${Math.round(j.job_max_salary).toLocaleString('en-IN')} / yr` 
          : null,
        postedAt: j.job_posted_at_datetime_utc ? new Date(j.job_posted_at_datetime_utc) : new Date()
      };
    });
  } catch (error) {
    if (error.response?.status === 404 || error.response?.status === 403) {
      if (jsearchAvailable) {
        console.log('[JobAggregation] JSearch RapidAPI subscription inactive; relying primarily on Adzuna India pipeline.');
        jsearchAvailable = false;
      }
    } else {
      console.warn(`[JobAggregation] JSearch notice for "${localizedQuery}":`, error.response?.data?.message || error.message);
    }
    return [];
  }
}

/**
 * Fetch jobs strictly localized to India from Adzuna API
 * @param {string} role
 * @returns {Promise<Array>}
 */
async function fetchFromAdzuna(role = 'Software Engineer') {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  // Default country parameter to 'in' (India)
  const country = process.env.ADZUNA_COUNTRY || 'in';

  if (!appId || !appKey || appId === 'your_adzuna_app_id') {
    return [];
  }

  try {
    const targetCountry = (country && country.trim()) ? country.trim().toLowerCase() : 'in';
    const url = `https://api.adzuna.com/v1/api/jobs/${targetCountry}/search/1`;
    const response = await axios.get(url, {
      params: {
        app_id: appId.trim(),
        app_key: appKey.trim(),
        what: role,
        where: 'India',
        results_per_page: 15
      },
      headers: {
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    const results = response.data?.results || [];
    console.log(`[JobAggregation] Adzuna India retrieved ${results.length} jobs for "${role}"`);
    return results.map(item => ({
      jobId: `adzuna-in-${item.id}`,
      title: item.title?.replace(/<\/?[^>]+(>|$)/g, '') || `${role} (India)`,
      company: item.company?.display_name || 'Hiring Company',
      location: item.location?.display_name ? `${item.location.display_name}, India` : 'Bengaluru, India',
      description: item.description?.replace(/<\/?[^>]+(>|$)/g, '') || '',
      source: 'Adzuna India',
      applyUrl: item.redirect_url || `https://www.google.com/search?q=${encodeURIComponent(item.title + ' jobs India')}&ibp=htl;jobs`,
      salary: (item.salary_min && item.salary_max) 
        ? `₹${Math.round(item.salary_min).toLocaleString('en-IN')} - ₹${Math.round(item.salary_max).toLocaleString('en-IN')} / yr` 
        : null,
      postedAt: item.created ? new Date(item.created) : new Date()
    }));
  } catch (error) {
    console.warn(`[JobAggregation] Adzuna India request notice for "${role}":`, error.response?.data?.message || error.message);
    return [];
  }
}

/**
 * Aggregate jobs for target roles and upsert into database
 * @param {string[]} targetRoles
 * @returns {Promise<{ upsertedCount: number, modifiedCount: number, totalProcessed: number }>}
 */
async function aggregateAndUpsertJobs(targetRoles = ['Full Stack Developer', 'Cloud Architect', 'DevOps Engineer']) {
  console.log(`[JobAggregation] Initiating India-localized job aggregation for roles: ${targetRoles.join(', ')}`);
  
  let collectedJobs = [];

  for (const role of targetRoles) {
    const [jsearchJobs, adzunaJobs] = await Promise.all([
      fetchFromJSearch(role),
      fetchFromAdzuna(role)
    ]);
    collectedJobs.push(...jsearchJobs, ...adzunaJobs);
  }

  // Always blend with high-quality Indian Tech Hub curated jobs
  collectedJobs.push(...SEED_JOBS);

  // Deduplicate by jobId in memory
  const uniqueJobsMap = new Map();
  for (const job of collectedJobs) {
    if (!uniqueJobsMap.has(job.jobId)) {
      uniqueJobsMap.set(job.jobId, job);
    }
  }
  const uniqueJobs = Array.from(uniqueJobsMap.values());

  // Execute bulkWrite with upsert: true
  const bulkOps = uniqueJobs.map(job => ({
    updateOne: {
      filter: { jobId: job.jobId },
      update: {
        $set: {
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description,
          source: job.source,
          applyUrl: job.applyUrl,
          salary: job.salary,
          postedAt: job.postedAt
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      upsert: true
    }
  }));

  try {
    const result = await JobListing.bulkWrite(bulkOps);
    console.log(`[JobAggregation] bulkWrite complete for India jobs: ${result.upsertedCount} inserted, ${result.modifiedCount} updated.`);

    return {
      upsertedCount: result.upsertedCount,
      modifiedCount: result.modifiedCount,
      totalProcessed: uniqueJobs.length
    };
  } catch (dbErr) {
    console.warn('[JobAggregation] Database upsert notice:', dbErr.message);
    return { upsertedCount: 0, modifiedCount: 0, totalProcessed: uniqueJobs.length };
  }
}

module.exports = {
  aggregateAndUpsertJobs,
  fetchFromJSearch,
  fetchFromAdzuna,
  SEED_JOBS,
  INDIAN_TECH_HUBS
};
