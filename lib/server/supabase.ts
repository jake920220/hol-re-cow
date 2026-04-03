import "server-only";

import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/server/env";

export function createServerSupabaseClient() {
  return createClient(serverEnv.supabaseUrl, serverEnv.supabasePublishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
