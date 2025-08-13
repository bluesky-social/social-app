// Centralized API URL for gndrembed

const LOCAL_API_URL = 'http://localhost:3000'; // Change port if needed
const PUBLIC_API_URL = 'https://public.api.bsky.app';

export function getApiUrl() {
  // Use environment variable if set
  if (typeof process !== 'undefined' && process.env && process.env.API_URL) {
    return process.env.API_URL;
  }
  // If running in browser, try to detect local API
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return LOCAL_API_URL;
    }
  }
  // Fallback to public API
  return PUBLIC_API_URL;
}

export const API_URL = getApiUrl();

