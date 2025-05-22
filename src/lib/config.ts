export const API_URL = import.meta.env.VITE_API_URL || 'https://goring-hg3o.shuttle.app';

export const endpoints = {
    score: `${API_URL}/api/score`,
    compare: `${API_URL}/api/compare`
}; 