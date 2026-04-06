"use server";

import { redirect } from "next/navigation";
import { buildAuthRedirect, sanitizeNextPath } from "@/lib/auth/flow";
import { hasSupabaseCredentials } from "@/lib/server/env";
import { getRequestOrigin } from "@/lib/server/request";
import { createServerSupabaseActionClient } from "@/lib/server/supabase";

type AuthProvider = "google" | "kakao";

const HANDLE_PATTERN = /^[a-z0-9_]{3,20}$/;
const OAUTH_PROVIDERS = new Set<AuthProvider>(["google", "kakao"]);

function isAuthProvider(value: string): value is AuthProvider {
  return OAUTH_PROVIDERS.has(value as AuthProvider);
}

function readValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readEmail(formData: FormData) {
  return readValue(formData, "email").toLowerCase();
}

function readNextPath(formData: FormData) {
  return sanitizeNextPath(readValue(formData, "next"));
}

function getAuthPath(mode: string) {
  return mode === "signup" ? "/auth/signup" : "/auth/login";
}

function getProviderLabel(provider: string) {
  return provider === "kakao" ? "Kakao" : "Google";
}

export async function signInWithEmailAction(formData: FormData) {
  const email = readEmail(formData);
  const password = readValue(formData, "password");
  const nextPath = readNextPath(formData);

  if (!email || !password) {
    redirect(
      buildAuthRedirect("/auth/login", {
        tone: "error",
        message: "이메일과 비밀번호를 모두 입력해 주세요.",
        email,
        nextPath,
      }),
    );
  }

  if (!hasSupabaseCredentials()) {
    redirect(
      buildAuthRedirect("/auth/login", {
        tone: "error",
        message: "Supabase 환경변수가 없어 로그인 요청을 처리할 수 없습니다.",
        email,
        nextPath,
      }),
    );
  }

  const supabase = await createServerSupabaseActionClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(
      buildAuthRedirect("/auth/login", {
        tone: "error",
        message: error.message,
        email,
        nextPath,
      }),
    );
  }

  redirect(nextPath);
}

export async function signUpWithEmailAction(formData: FormData) {
  const displayName = readValue(formData, "displayName");
  const handle = readValue(formData, "handle").toLowerCase();
  const email = readEmail(formData);
  const password = readValue(formData, "password");
  const confirmPassword = readValue(formData, "confirmPassword");
  const nextPath = readNextPath(formData);

  if (!displayName || !handle || !email || !password || !confirmPassword) {
    redirect(
      buildAuthRedirect("/auth/signup", {
        tone: "error",
        message: "필수 입력값을 모두 채워 주세요.",
        email,
        displayName,
        handle,
        nextPath,
      }),
    );
  }

  if (!HANDLE_PATTERN.test(handle)) {
    redirect(
      buildAuthRedirect("/auth/signup", {
        tone: "error",
        message: "아이디는 영문 소문자, 숫자, 밑줄만 사용해 3~20자로 입력해 주세요.",
        email,
        displayName,
        handle,
        nextPath,
      }),
    );
  }

  if (password.length < 8) {
    redirect(
      buildAuthRedirect("/auth/signup", {
        tone: "error",
        message: "비밀번호는 최소 8자 이상으로 설정해 주세요.",
        email,
        displayName,
        handle,
        nextPath,
      }),
    );
  }

  if (password !== confirmPassword) {
    redirect(
      buildAuthRedirect("/auth/signup", {
        tone: "error",
        message: "비밀번호 확인이 일치하지 않습니다.",
        email,
        displayName,
        handle,
        nextPath,
      }),
    );
  }

  if (!hasSupabaseCredentials()) {
    redirect(
      buildAuthRedirect("/auth/signup", {
        tone: "error",
        message: "Supabase 환경변수가 없어 회원가입 요청을 처리할 수 없습니다.",
        email,
        displayName,
        handle,
        nextPath,
      }),
    );
  }

  const origin = await getRequestOrigin();
  const confirmUrl = new URL("/auth/confirm", origin);
  confirmUrl.searchParams.set("next", nextPath);

  const supabase = await createServerSupabaseActionClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: confirmUrl.toString(),
      data: {
        display_name: displayName,
        handle,
      },
    },
  });

  if (error) {
    redirect(
      buildAuthRedirect("/auth/signup", {
        tone: "error",
        message: error.message,
        email,
        displayName,
        handle,
        nextPath,
      }),
    );
  }

  if (data.session) {
    redirect(nextPath);
  }

  redirect(
    buildAuthRedirect("/auth/signup", {
      tone: "success",
      message: "가입 확인 메일을 보냈어요. 메일 인증을 마치면 바로 프로필로 이동할 수 있습니다.",
      email,
      nextPath,
    }),
  );
}

export async function signInWithOAuthAction(formData: FormData) {
  const provider = readValue(formData, "provider");
  const mode = readValue(formData, "mode");
  const nextPath = readNextPath(formData);
  const authPath = getAuthPath(mode);

  if (!isAuthProvider(provider)) {
    redirect(
      buildAuthRedirect(authPath, {
        tone: "error",
        message: "지원하지 않는 소셜 로그인 방식입니다.",
        nextPath,
      }),
    );
  }

  if (!hasSupabaseCredentials()) {
    redirect(
      buildAuthRedirect(authPath, {
        tone: "error",
        message: "Supabase 환경변수가 없어 소셜 로그인 요청을 처리할 수 없습니다.",
        nextPath,
      }),
    );
  }

  const origin = await getRequestOrigin();
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", nextPath);

  const supabase = await createServerSupabaseActionClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl.toString(),
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    redirect(
      buildAuthRedirect(authPath, {
        tone: "error",
        message:
          error?.message ??
          `${getProviderLabel(provider)} 로그인 페이지로 이동하지 못했습니다.`,
        nextPath,
      }),
    );
  }

  redirect(data.url);
}

export async function signOutAction() {
  if (hasSupabaseCredentials()) {
    const supabase = await createServerSupabaseActionClient();
    await supabase.auth.signOut();
  }

  redirect(
    buildAuthRedirect("/auth/login", {
      tone: "success",
      message: "안전하게 로그아웃되었습니다.",
      nextPath: "/mypage",
    }),
  );
}
