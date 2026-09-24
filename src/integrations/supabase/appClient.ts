import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './appTypes';
import { createGuestMockClient } from './guestMockClient';

// Main Production Supabase Database (Loaded strictly from environment variables)
// Supports both VITE_MAIN_SUPABASE_* and standard VITE_SUPABASE_*
const MAIN_SUPABASE_URL = (
  import.meta.env.VITE_MAIN_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  ''
).trim();
const MAIN_SUPABASE_PUBLISHABLE_KEY = (
  import.meta.env.VITE_MAIN_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();

export const isMainDatabaseConfigured = Boolean(
  MAIN_SUPABASE_URL && MAIN_SUPABASE_PUBLISHABLE_KEY
);

// Fallback to placeholder if environment variables are not set (e.g. during build / initial setup)
export const mainSupabase = createClient<Database>(
  MAIN_SUPABASE_URL || 'https://placeholder.supabase.co',
  MAIN_SUPABASE_PUBLISHABLE_KEY || 'placeholder-anon-key'
);

// Guest Supabase Database (Configured via VITE_GUEST_SUPABASE_URL)
const GUEST_SUPABASE_URL = (import.meta.env.VITE_GUEST_SUPABASE_URL || '').trim();
const GUEST_SUPABASE_PUBLISHABLE_KEY = (
  import.meta.env.VITE_GUEST_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_GUEST_SUPABASE_ANON_KEY ||
  ''
).trim();

export const isGuestDatabaseConfigured = Boolean(
  GUEST_SUPABASE_URL && GUEST_SUPABASE_PUBLISHABLE_KEY
);

// Instantiate real guest Supabase client if configured, otherwise use rich local fallback
export const guestSupabase: SupabaseClient<Database> = isGuestDatabaseConfigured
  ? createClient<Database>(GUEST_SUPABASE_URL, GUEST_SUPABASE_PUBLISHABLE_KEY)
  : (createGuestMockClient() as any);

/**
 * Checks whether the current application context is running in Guest Mode.
 */
export const getIsGuestMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.location.pathname.startsWith('/guest') ||
    window.location.pathname.startsWith('/app/guest') ||
    sessionStorage.getItem('app_mode') === 'guest'
  );
};

/**
 * Explicitly sets the guest mode flag in session storage.
 */
export const setGuestMode = (isGuest: boolean) => {
  if (typeof window === 'undefined') return;
  if (isGuest) {
    sessionStorage.setItem('app_mode', 'guest');
  } else {
    sessionStorage.removeItem('app_mode');
  }
};

/**
 * Returns the active Supabase client based on the current context.
 */
export const getActiveSupabaseClient = (): SupabaseClient<Database> => {
  if (getIsGuestMode()) {
    return guestSupabase;
  }
  return mainSupabase;
};

/**
 * Dynamic Proxy client used throughout the application.
 * Transparently forwards all queries, auth calls, and storage requests to:
 * - `guestSupabase` when in Guest Mode (/app/guest)
 * - `mainSupabase` when in Owner Mode (/app)
 *
 * This guarantees single-codebase reflection: any UI change or query added in main
 * immediately works in guest mode with zero code duplication!
 */
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop, receiver) {
    const activeClient = getActiveSupabaseClient();
    const value = Reflect.get(activeClient, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(activeClient);
    }
    return value;
  },
});
