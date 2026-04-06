import { NextResponse, type NextRequest } from "next/server";
import { buildAuthRedirect, sanitizeNextPath } from "@/lib/auth/flow";
import { hasSupabaseCredentials } from "@/lib/server/env";
import { createRouteHandlerSupabaseClient } from "@/lib/server/supabase";

type EmailOtpType =
  | "signup"
  | "invite"
  | "magiclink"
  | "recovery"
  | "email_change"
  | "email";

const EMAIL_OTP_TYPES = new Set([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get("next"));

  if (!tokenHash || !type || !EMAIL_OTP_TYPES.has(type) || !hasSupabaseCredentials()) {
    return NextResponse.redirect(
      new URL(
        buildAuthRedirect("/auth/signup", {
          tone: "error",
          message: "메일 인증 링크가 유효하지 않습니다. 다시 가입을 시도해 주세요.",
          nextPath,
        }),
        request.url,
      ),
    );
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url));
  const { supabase } = createRouteHandlerSupabaseClient(request, response);
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as EmailOtpType,
  });

  if (error) {
    return NextResponse.redirect(
      new URL(
        buildAuthRedirect("/auth/signup", {
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
