/**
 * Supabase Client Configuration
 * Real-time enabled for conversations and messages
 */

import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/env';
import { logger } from './logger';

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  auth: {
    autoRefreshToken: true,
    persistSession: false, // We use our own JWT auth
  },
});

// Helper to check Supabase connection
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('conversations').select('id').limit(1);
    if (error) {
      logger.error('Supabase connection test failed', error);
      return false;
    }
    logger.success('Supabase connection successful');
    return true;
  } catch (error) {
    logger.error('Supabase connection test error', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
};
