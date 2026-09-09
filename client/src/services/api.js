import axios from 'axios';

// Automatically use Render backend in production or when VITE_API_URL is configured
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
  : (import.meta.env.PROD ? 'https://job-hunter-2k26.onrender.com/api' : '/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000, // 90s timeout for cold start on Render and Gemini processing
  headers: {
    'Accept': 'application/json'
  }
});

/**
 * Uploads candidate resume (.pdf or .docx) with upload progress callback
 * @param {File} file 
 * @param {Function} onProgress 
 */
export async function uploadResume(file, onProgress, email = null) {
  const formData = new FormData();
  formData.append('resume', file);
  if (email && typeof email === 'string' && email.includes('@')) {
    formData.append('email', email.trim());
  }

  const response = await api.post('/resume/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    },
  });

  return response.data;
}

/**
 * Retrieves calculated job matches for candidate
 * @param {string} userId (Mongo ID or email)
 */
export async function fetchJobMatches(userId) {
  const response = await api.get(`/matches/${encodeURIComponent(userId)}`);
  return response.data;
}

/**
 * Retrieves candidate profile
 * @param {string} userId 
 */
export async function fetchProfile(userId) {
  const response = await api.get(`/profile/${encodeURIComponent(userId)}`);
  return response.data;
}

/**
 * Retrieves raw job listings
 * @param {number} limit 
 */
export async function fetchJobs(limit = 50) {
  const response = await api.get(`/jobs?limit=${limit}`);
  return response.data;
}

/**
 * Checks API server health
 */
export async function checkHealth() {
  const response = await api.get('/health');
  return response.data;
}

/**
 * Manually triggers job aggregation pipeline for specific roles
 * @param {string[]} roles 
 */
export async function triggerJobAggregation(roles) {
  const response = await api.post('/jobs/aggregate', { roles });
  return response.data;
}

/**
 * Dispatches an immediate job alert email to the candidate
 * @param {string} email
 * @param {object} profile
 */
export async function triggerEmailAlert(email, profile = {}) {
  const response = await api.post('/alerts/send-alert', {
    email,
    name: profile.name,
    extractedSkills: profile.extractedSkills,
    experienceLevel: profile.experienceLevel,
    targetRoles: profile.targetRoles,
    matchThreshold: profile.matchThreshold || 50
  });
  return response.data;
}

/**
 * Updates candidate email in MongoDB
 * @param {string} oldEmail
 * @param {string} newEmail
 * @param {string} profileId
 */
export async function updateProfileEmail(oldEmail, newEmail, profileId) {
  const response = await api.put('/profile/email', { oldEmail, newEmail, profileId });
  return response.data;
}

export default api;
