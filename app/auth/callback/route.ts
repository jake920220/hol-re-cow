import { NextResponse, type NextRequest } from "next/server";
import { buildAuthRedirect, sanitizeNextPath } from "@/lib/auth/flow";
import { hasSupabaseCredentials } from "@/lib/server/env";
import { createRouteHandlerSupabaseClient } from "@/lib/server/supabase";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get("next"));

  if (!code || !hasSupabaseCredentials()) {
    return NextResponse.redirect(
      new URL(
        buildAuthRedirect("/auth/login", {
          tone: "error",
          message: "소셜 로그인 응답을 완료하지 못했습니다.",
          nextPath,
        }),
        request.url,
      ),
    );
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url));
  const { supabase } = createRouteHandlerSupabaseClient(request, response);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(
        buildAuthRedirect("/auth/login", {
          tone: "error",
          message: error.message,
          nextPath,
        }),
        request.url,
      ),
    );
  }

  return response;
}
