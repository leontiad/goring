export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const endpoints = {
    score: `${API_URL}/api/score`,
    compare: `${API_URL}/api/compare`
}; 