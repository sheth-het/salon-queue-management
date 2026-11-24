import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if valid production or local credentials exist (not default placeholder)
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id') &&
  !supabaseUrl.includes('demo-salon-queue') &&
  (supabaseUrl.startsWith('https://') || supabaseUrl.startsWith('http://localhost') || supabaseUrl.startsWith('http://127.0.0.1'))
);

// Singleton Supabase Client
// Uses anon public key - safe for frontend browser environments
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

/**
 * Helper to test Supabase connection status
 */
export async function checkSupabaseConnection() {
  if (!supabase) {
    return { connected: false, message: 'Supabase credentials not configured (running in local reactive mode)' };
  }
  try {
    const { data, error } = await supabase.from('salon_settings').select('id, salon_name').limit(1);
    if (error) throw error;
    return { connected: true, data };
  } catch (err) {
    console.warn('Supabase connection check failed:', err.message);
    return { connected: false, message: err.message };
  }
}
