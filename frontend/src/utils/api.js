import axios from 'axios';
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
export const api = axios.create({ baseURL: BASE_URL });
export async function generateQuestions(formData, onProgress) {
  return api.post('/api/generate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => { if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total)); }
  });
}
export async function getAnalytics() { return api.get('/api/analytics'); }
export async function submitFeedback(data) { return api.post('/api/feedback', data); }
export function getDownloadUrl(sessionId, format) { return `${BASE_URL}/api/download/${format}/${sessionId}`; }
