import { createClient as createBasicClient } from '@supabase/supabase-js';

// --- Admin Client ---
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// Should only be used in server-side code (Route Handlers, Server Actions)
// ***Never expose the service role key to the browser!***

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase URL or Service Role Key for admin client');
  }

  // Use the basic client with the service role key for elevated privileges
  return createBasicClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
