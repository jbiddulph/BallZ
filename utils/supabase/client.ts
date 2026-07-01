import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from "./env";

export const createClient = () => {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient(supabaseUrl as string, supabasePublishableKey as string);
};
