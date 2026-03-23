import { createBrowserClient } from "@supabase/ssr";

// This file is intended to create a Supabase client for browser-side operations. The createClient function initializes the Supabase client using the public URL and anonymous key, which are safe to expose on the client side. This client can be used for typical interactions with Supabase, such as fetching data or managing user sessions, without requiring elevated permissions.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
