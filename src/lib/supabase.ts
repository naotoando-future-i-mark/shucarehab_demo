import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const memoryStorage = new Map<string, string>();

let storageAvailable = true;
try {
  const test = '__storage_test__';
  window.localStorage.setItem(test, test);
  window.localStorage.removeItem(test);
} catch (e) {
  console.warn('localStorage is not available, using in-memory storage');
  storageAvailable = false;
}

const customStorageAdapter = {
  getItem: (key: string) => {
    if (storageAvailable) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {
        console.warn('localStorage.getItem failed, falling back to memory:', e);
        storageAvailable = false;
      }
    }
    return memoryStorage.get(key) || null;
  },
  setItem: (key: string, value: string) => {
    if (storageAvailable) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch (e) {
        console.warn('localStorage.setItem failed, falling back to memory:', e);
        storageAvailable = false;
      }
    }
    memoryStorage.set(key, value);
  },
  removeItem: (key: string) => {
    if (storageAvailable) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch (e) {
        console.warn('localStorage.removeItem failed, falling back to memory:', e);
        storageAvailable = false;
      }
    }
    memoryStorage.delete(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: customStorageAdapter,
    storageKey: 'shukarehub-auth-token',
    flowType: 'pkce',
  },
});

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return user;
};

export const getCurrentUserId = async () => {
  const user = await getCurrentUser();
  return user?.id || null;
};
