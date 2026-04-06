import "server-only";

import {
  getSiteUrl,
  getSupabaseCredentials,
  hasSupabaseCredentials,
} from "@/lib/supabase/config";

export const serverEnv = {
  get supabaseUrl() {
    return getSupabaseCredentials().url;
  },
  get supabasePublishableKey() {
    return getSupabaseCredentials().publishableKey;
  },
  get siteUrl() {
    return getSiteUrl();
  },
};

export { hasSupabaseCredentials };
