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

/**
 * Update Supabase client auth session with fresh tokens
 * Call this after token refresh to keep Supabase real-time channels authenticated
 *
 * Note: Even though we use custom JWT auth and persistSession=false,
 * updating the session helps Supabase real-time maintain authenticated connections
 *
 * @param accessToken - The fresh access token
 * @param refreshToken - The fresh refresh token
 */
export const updateSupabaseAuth = async (
  accessToken: string,
  refreshToken: string
): Promise<void> => {
  try {
    console.log('[Supabase] Updating auth session with fresh tokens');

    // Update Supabase auth session
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      logger.warn('Failed to update Supabase auth session', error);
      console.warn('[Supabase] Failed to update auth session:', error);
    } else {
      console.log('[Supabase] Auth session updated successfully');
      logger.info('Supabase auth session updated');
    }
  } catch (error) {
    logger.error('Error updating Supabase auth session', error instanceof Error ? error : new Error(String(error)));
    console.error('[Supabase] Error updating auth session:', error);
  }
};
