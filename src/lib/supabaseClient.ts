import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { browser } from '$app/environment';

if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

console.log('Initializing Supabase client with URL:', PUBLIC_SUPABASE_URL);
console.log('Using anon key:', PUBLIC_SUPABASE_ANON_KEY.substring(0, 10) + '...');

// Custom storage implementation that handles both cookies and localStorage
const customStorage = browser ? {
  getItem: (key: string) => {
    console.log('Getting item from storage:', key);
    
    // For auth token, check cookies first
    if (key.includes('auth-token')) {
      const cookies = document.cookie;
      const match = cookies.match(new RegExp(`${key}=([^;]+)`));
      if (match) {
        try {
          const value = decodeURIComponent(match[1]);
          console.log('Found auth token in cookies');
          return value;
        } catch (e) {
          console.error('Error parsing auth token from cookie:', e);
          return null;
        }
      }
    }
    
    // For code verifier, check cookies first
    if (key.includes('code-verifier')) {
      const cookies = document.cookie;
      const match = cookies.match(new RegExp(`${key}=([^;]+)`));
      if (match) {
        try {
          const value = decodeURIComponent(match[1]);
          console.log('Found code verifier in cookies');
          return value;
        } catch (e) {
          console.error('Error parsing code verifier from cookie:', e);
          return null;
        }
      }
    }
    
    // For other items, use localStorage
    const value = localStorage.getItem(key);
    console.log('Storage value:', value ? 'present' : 'missing');
    return value;
  },
  setItem: (key: string, value: string) => {
    console.log('Setting item in storage:', key, value ? 'present' : 'missing');
    
    // For auth token or code verifier, set in cookies
    if (key.includes('auth-token') || key.includes('code-verifier')) {
      const expires = new Date();
      expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const cookieOptions = [
        `expires=${expires.toUTCString()}`,
        'path=/',
        'SameSite=Lax',
        'Secure'
      ].join('; ');
      
      try {
        const encodedValue = encodeURIComponent(value);
        document.cookie = `${key}=${encodedValue}; ${cookieOptions}`;
        console.log(`Set ${key} in cookies`);
      } catch (e) {
        console.error('Error setting cookie:', e);
      }
    } else {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string) => {
    console.log('Removing item from storage:', key);
    
    // For auth token or code verifier, remove from cookies
    if (key.includes('auth-token') || key.includes('code-verifier')) {
      const cookieOptions = [
        'expires=Thu, 01 Jan 1970 00:00:00 GMT',
        'path=/',
        'SameSite=Lax',
        'Secure'
      ].join('; ');
      
      document.cookie = `${key}=; ${cookieOptions}`;
      console.log(`Removed ${key} from cookies`);
    } else {
      localStorage.removeItem(key);
    }
  }
} : undefined;

// Create the Supabase client with custom storage
export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: customStorage,
    debug: true
  }
});

// Initialize session from cookie if present
if (browser) {
  const cookies = document.cookie;
  const match = cookies.match(/sb-vnlqjqozuggbgvoyewwq-auth-token=([^;]+)/);
  if (match) {
    try {
      const session = JSON.parse(decodeURIComponent(match[1]));
      console.log('Initializing session from cookie');
      supabase.auth.setSession(session);
    } catch (e) {
      console.error('Error initializing session from cookie:', e);
    }
  }
} 