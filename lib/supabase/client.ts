import { createBrowserClient } from '@supabase/ssr';

// --- Client Component Client ---
// Needs NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
// Does *not* need cookies()

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase URL or Anon Key for client component client');
  }

  // Create a singleton Supabase client for the browser
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
