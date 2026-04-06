import "server-only";

import { headers } from "next/headers";
import { getSiteUrl } from "@/lib/supabase/config";

export async function getRequestOrigin() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");

  if (origin) {
    return origin;
  }

  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? null;
  const protocol =
    headerStore.get("x-forwarded-proto") ??
    (host?.includes("localhost") ? "http" : "https");

  if (host) {
    return `${protocol}://${host}`;
  }

  return getSiteUrl() ?? "http://localhost:3000";
}
