import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseCredentials } from "@/lib/supabase/config";

function getServerClientOptions() {
  return {
    auth: {
      flowType: "pkce" as const,
    },
  };
}

export async function createServerSupabaseReadClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseCredentials();

  return createServerClient(url, publishableKey, {
    ...getServerClientOptions(),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
    },
  });
}

export async function createServerSupabaseActionClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseCredentials();

  return createServerClient(url, publishableKey, {
    ...getServerClientOptions(),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}

export function createRouteHandlerSupabaseClient(
  request: NextRequest,
  response: NextResponse,
) {
  const { url, publishableKey } = getSupabaseCredentials();
  const supabase = createServerClient(url, publishableKey, {
    ...getServerClientOptions(),
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  return { supabase, response };
}
