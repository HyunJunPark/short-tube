import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase Client Singleton
 *
 * Creates and manages a single Supabase client instance using service role authentication.
 * The service role bypasses Row Level Security (RLS) policies, allowing full database access.
 */

let supabaseClient: SupabaseClient | null = null;

/**
 * Get or create Supabase client instance
 * @returns SupabaseClient instance
 * @throws Error if SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables are not set
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL environment variable is not set');
  }

  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_KEY environment variable is not set');
  }

  supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('[Supabase] Client initialized successfully');

  return supabaseClient;
}

/**
 * Test Supabase connection
 * @returns Promise<boolean> true if connection successful
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const client = getSupabaseClient();

    // Try to query user_settings table
    const { data, error } = await client
      .from('user_settings')
      .select('id')
      .limit(1);

    if (error) {
      console.error('[Supabase] Connection test failed:', error.message);
      return false;
    }

    console.log('[Supabase] Connection test successful');
    return true;
  } catch (error) {
    console.error('[Supabase] Connection test error:', error);
    return false;
  }
}

/**
 * Reset Supabase client (useful for testing)
 */
export function resetSupabaseClient(): void {
  supabaseClient = null;
}
