import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";


// This file is designed to create a Supabase client for server-side operations in a Next.js application. The createClient function initializes the Supabase client using the public URL and anonymous key, similar to the client-side version, but it also integrates with Next.js's cookie handling to manage authentication tokens securely on the server. This setup allows for seamless server-side interactions with Supabase while maintaining security best practices by leveraging cookies for session management.
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
