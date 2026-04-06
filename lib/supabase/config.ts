const SUPABASE_URL_NAMES = ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"] as const;
const SUPABASE_PUBLISHABLE_KEY_NAMES = [
  "SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
] as const;
const SITE_URL_NAMES = ["SITE_URL", "NEXT_PUBLIC_SITE_URL"] as const;

function readFirstEnv(names: readonly string[]) {
  for (const name of names) {
    const value = process.env[name];

    if (value) {
      return value;
    }
  }

  return null;
}

function requireEnv(names: readonly string[]) {
  const value = readFirstEnv(names);

  if (!value) {
    throw new Error(`${names.join(" 또는 ")} 환경변수가 필요합니다.`);
  }

  return value;
}

export function hasSupabaseCredentials() {
  return Boolean(
    readFirstEnv(SUPABASE_URL_NAMES) &&
      readFirstEnv(SUPABASE_PUBLISHABLE_KEY_NAMES),
  );
}

export function getSupabaseCredentials() {
  return {
    url: requireEnv(SUPABASE_URL_NAMES),
    publishableKey: requireEnv(SUPABASE_PUBLISHABLE_KEY_NAMES),
  };
}

export function getSiteUrl() {
  return readFirstEnv(SITE_URL_NAMES);
}
