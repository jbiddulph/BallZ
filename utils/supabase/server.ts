import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublishableKey, supabaseUrl } from "./env";

export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl as string, supabasePublishableKey as string, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot set cookies. Middleware refreshes sessions.
        }
      }
    }
  });
};
