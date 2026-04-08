import "server-only";

import type { PostCreateAccessState } from "@/lib/post-create/contracts";
import { hasSupabaseCredentials } from "@/lib/server/env";
import { createServerSupabaseReadClient } from "@/lib/server/supabase";

export async function getPostCreateAccessState(): Promise<PostCreateAccessState> {
  if (!hasSupabaseCredentials()) {
    return {
      envReady: false,
      isAuthenticated: false,
    };
  }

  const supabase = await createServerSupabaseReadClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    envReady: true,
    isAuthenticated: Boolean(user),
  };
}
