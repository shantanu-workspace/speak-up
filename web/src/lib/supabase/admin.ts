import { createClient } from "@supabase/supabase-js";


//this file is supposed to : create a Supabase client with admin privileges using the service role key. This client should be used for server-side operations that require elevated permissions, such as managing users or accessing sensitive data. The createAdminClient function initializes the Supabase client with the service role key and disables automatic token refresh and session persistence for security reasons.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
