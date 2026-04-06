import { AuthView } from "@/components/auth/auth-view";
import { parseAuthPageState } from "@/lib/auth/flow";
import { hasSupabaseCredentials } from "@/lib/server/env";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SignupPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const state = parseAuthPageState(await searchParams);

  return <AuthView mode="signup" envReady={hasSupabaseCredentials()} {...state} />;
}
