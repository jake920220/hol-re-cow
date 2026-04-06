import type { InputHTMLAttributes } from "react";
import Link from "next/link";
import {
  signInWithEmailAction,
  signInWithOAuthAction,
  signUpWithEmailAction,
} from "@/app/auth/actions";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import type { AuthNotice } from "@/lib/auth/flow";

type AuthViewProps = {
  mode: "login" | "signup";
  notice: AuthNotice | null;
  email: string;
  displayName: string;
  handle: string;
  nextPath: string;
  envReady: boolean;
};

const noticeClassName = {
  error:
    "border-[rgba(255,180,171,0.28)] bg-[rgba(255,180,171,0.08)] text-[#ffd9d4]",
  success:
    "border-[rgba(149,212,179,0.26)] bg-[rgba(149,212,179,0.08)] text-primary",
  info: "border-outline-variant/40 bg-surface-low text-on-surface-variant",
};

function Field({
  label,
  name,
  type = "text",
  placeholder,
  defaultValue,
  autoComplete,
  inputMode,
  helper,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder: string;
  defaultValue?: string;
  autoComplete?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  helper?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-on-surface">
        {label}
      </span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="auth-input w-full"
      />
      {helper ? (
        <span className="mt-2 block text-xs leading-5 text-on-surface-variant">
          {helper}
        </span>
      ) : null}
    </label>
  );
}

export function AuthView({
  mode,
  notice,
  email,
  displayName,
  handle,
  nextPath,
  envReady,
}: AuthViewProps) {
  const isSignup = mode === "signup";
  const emailAction = isSignup ? signUpWithEmailAction : signInWithEmailAction;

  return (
    <>
      <header className="pb-10 pt-2">
        <div className="auth-brand-chip">
          <span className="rounded-full bg-primary/14 px-3 py-1 text-[11px] font-semibold tracking-[0.24em] text-primary uppercase">
            Holre-cow
          </span>
        </div>
        <div className="mt-6 space-y-4">
          <p className="text-sm font-semibold tracking-[0.22em] text-tertiary uppercase">
            Private Lounge Entry
          </p>
          <div>
            <h1 className="text-[2rem] font-semibold leading-[1.25] text-on-surface">
              {isSignup ? "분석 기록을 시작할 프로필을 만들어요." : "조용한 리뷰 데스크로 다시 돌아오세요."}
            </h1>
            <p className="mt-4 text-sm leading-7 text-on-surface-variant">
              이메일 인증과 Google, Kakao 진입은 모두 서버 액션과 callback
              라우트에서 처리합니다. 공통 앱 셸은 auth 화면에서 분리된 채로
              유지됩니다.
            </p>
          </div>
        </div>
      </header>

      <section className="auth-card">
        <div className="auth-card-glow" aria-hidden="true" />
        <div className="relative">
          <nav className="auth-mode-switch" aria-label="인증 화면 전환">
            <Link
              href={`/auth/login${nextPath !== "/mypage" ? `?next=${encodeURIComponent(nextPath)}` : ""}`}
              className={`auth-mode-link ${!isSignup ? "auth-mode-link-active" : ""}`}
            >
              로그인
            </Link>
            <Link
              href={`/auth/signup${nextPath !== "/mypage" ? `?next=${encodeURIComponent(nextPath)}` : ""}`}
              className={`auth-mode-link ${isSignup ? "auth-mode-link-active" : ""}`}
            >
              회원가입
            </Link>
          </nav>

          <div className="mt-8 space-y-3">
            {!envReady ? (
              <div className="rounded-[20px] border border-outline-variant/40 bg-surface-low px-4 py-4 text-sm leading-6 text-on-surface-variant">
                현재 서버에 Supabase 환경변수가 없어 제출은 동작하지 않습니다.
                UI와 라우팅 구조는 검증할 수 있고, 실제 인증은 환경 연결 후 바로
                활성화됩니다.
              </div>
            ) : null}

            {notice ? (
              <div
                className={`rounded-[20px] border px-4 py-4 text-sm leading-6 ${noticeClassName[notice.tone]}`}
              >
                {notice.message}
              </div>
            ) : null}
          </div>

          <div className="mt-8 grid gap-3">
            {[
              { provider: "google", label: "Google로 계속하기", accent: "text-primary" },
              { provider: "kakao", label: "Kakao로 계속하기", accent: "text-tertiary" },
            ].map((item) => (
              <form key={item.provider} action={signInWithOAuthAction}>
                <input type="hidden" name="provider" value={item.provider} />
                <input type="hidden" name="mode" value={mode} />
                <input type="hidden" name="next" value={nextPath} />
                <AuthSubmitButton
                  pendingText={`${item.provider === "google" ? "Google" : "Kakao"} 로그인으로 이동 중...`}
                  className="auth-social-button"
                >
                  <span
                    className={`flex items-center gap-3 text-sm font-semibold ${item.accent}`}
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant/40 bg-surface-low text-base font-bold">
                      {item.provider === "google" ? "G" : "K"}
                    </span>
                    <span className="text-on-surface">{item.label}</span>
                  </span>
                  <span className="text-xs tracking-[0.18em] text-on-surface-variant uppercase">
                    Server
                  </span>
                </AuthSubmitButton>
              </form>
            ))}
          </div>

          <div className="auth-divider">
            <span>또는 이메일로 계속하기</span>
          </div>

          <form action={emailAction} className="mt-6 space-y-5">
            <input type="hidden" name="next" value={nextPath} />

            {isSignup ? (
              <>
                <Field
                  label="표시 이름"
                  name="displayName"
                  placeholder="예: 홀리카우 플레이어"
                  defaultValue={displayName}
                  autoComplete="nickname"
                />
                <Field
                  label="아이디"
                  name="handle"
                  placeholder="예: holrecow_grinder"
                  defaultValue={handle}
                  autoComplete="username"
                  helper="영문 소문자, 숫자, 밑줄만 사용하며 3~20자로 입력합니다."
                />
              </>
            ) : null}

            <Field
              label="이메일"
              name="email"
              type="email"
              placeholder="you@example.com"
              defaultValue={email}
              autoComplete="email"
              inputMode="email"
            />

            <Field
              label="비밀번호"
              name="password"
              type="password"
              placeholder={isSignup ? "8자 이상으로 입력해 주세요." : "비밀번호를 입력해 주세요."}
              autoComplete={isSignup ? "new-password" : "current-password"}
            />

            {isSignup ? (
              <Field
                label="비밀번호 확인"
                name="confirmPassword"
                type="password"
                placeholder="비밀번호를 한 번 더 입력해 주세요."
                autoComplete="new-password"
              />
            ) : null}

            <AuthSubmitButton
              pendingText={isSignup ? "가입 요청을 처리하는 중..." : "로그인 중..."}
              className="auth-primary-button w-full"
            >
              {isSignup ? "이메일로 회원가입" : "이메일로 로그인"}
            </AuthSubmitButton>
          </form>

          <div className="mt-8 rounded-[20px] border border-outline-variant/30 bg-surface-lowest/80 px-4 py-4 text-sm leading-6 text-on-surface-variant">
            {isSignup ? (
              <>
                가입과 동시에 `profiles` 기본 레코드가 생성되도록 설계했습니다.
                메일 인증을 완료하면 프로필 베이스 화면으로 이동합니다.
              </>
            ) : (
              <>
                세션 쿠키는 서버에서만 갱신되고, 이후 마이페이지에서 프로필 베이스
                상태를 확인할 수 있습니다.
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
