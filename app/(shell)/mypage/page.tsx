import { redirect } from "next/navigation";
import { signOutAction } from "@/app/auth/actions";
import { AppShell } from "@/components/app-shell";
import { buildAuthRedirect } from "@/lib/auth/flow";
import { hasSupabaseCredentials } from "@/lib/server/env";
import { createServerSupabaseReadClient } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

function formatProvider(provider: unknown) {
  switch (provider) {
    case "google":
      return "Google";
    case "kakao":
      return "Kakao";
    case "email":
      return "Email";
    default:
      return "미확인";
  }
}

function formatJoinedAt(value?: string | null) {
  if (!value) {
    return "가입일 미확인";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "long",
  }).format(new Date(value));
}

function readExactCount(query: { count: number | null }) {
  const { count } = query;
  return count ?? 0;
}

export default async function MyPage() {
  if (!hasSupabaseCredentials()) {
    return (
      <AppShell
        title="마이페이지"
        subtitle="Supabase 연결 전에도 auth 전용 레이아웃과 프로필 베이스 구조를 확인할 수 있습니다."
      >
        <section className="premium-card rounded-[32px] p-6">
          <p className="text-sm leading-7 text-on-surface-variant">
            현재 서버에 Supabase 환경변수가 없어 실제 세션을 불러오지 못합니다.
            `SUPABASE_URL`과 `SUPABASE_PUBLISHABLE_KEY`를 연결하면 로그인 이후 이
            화면에서 프로필 기본 정보를 조회할 수 있습니다.
          </p>
        </section>
      </AppShell>
    );
  }

  const supabase = await createServerSupabaseReadClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      buildAuthRedirect("/auth/login", {
        tone: "info",
        message: "프로필을 보려면 먼저 로그인해 주세요.",
        nextPath: "/mypage",
      }),
    );
  }

  const [profileResult, postCountResult, followerCountResult, followingCountResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, handle, bio, avatar_path, created_at")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("author_id", user.id),
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", user.id),
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", user.id),
    ]);

  const { data: profile, error: profileError } = profileResult;
  const postCount = readExactCount(postCountResult);
  const followerCount = readExactCount(followerCountResult);
  const followingCount = readExactCount(followingCountResult);

  const displayName =
    profile?.display_name ??
    (typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name
      : null) ??
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : null) ??
    "홀리카우 플레이어";

  const handle =
    profile?.handle ??
    (typeof user.user_metadata?.handle === "string"
      ? user.user_metadata.handle
      : null) ??
    user.email?.split("@")[0] ??
    "player";

  const joinedAt = formatJoinedAt(profile?.created_at ?? user.created_at);
  const provider = formatProvider(user.app_metadata?.provider);

  return (
    <AppShell
      title="마이페이지"
      subtitle="세션과 profiles 기본 레코드를 기준으로 읽는 프로필 베이스 화면입니다."
    >
      <section className="premium-card rounded-[32px] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-outline-variant/40 bg-surface-high text-2xl font-bold text-primary">
              {displayName.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold text-on-surface">
                {displayName}
              </p>
              <p className="mt-1 truncate text-sm text-on-surface-variant">
                @{handle}
              </p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                {profile?.bio ?? "핸드리뷰를 기록하고 토론하는 개인 공간을 준비했어요."}
              </p>
            </div>
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-full border border-outline-variant/40 bg-surface-low px-4 py-2 text-xs font-semibold tracking-[0.18em] text-on-surface-variant uppercase transition hover:text-on-surface"
            >
              로그아웃
            </button>
          </form>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: "게시글", value: String(postCount) },
            { label: "팔로워", value: String(followerCount) },
            { label: "팔로잉", value: String(followingCount) },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[20px] border border-outline-variant/30 bg-surface-high px-4 py-4 text-center"
            >
              <p className="text-lg font-semibold text-on-surface">{item.value}</p>
              <p className="mt-1 text-xs tracking-[0.18em] text-on-surface-variant uppercase">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 grid gap-4">
        <article className="rounded-[28px] border border-outline-variant/30 bg-surface-container px-5 py-5">
          <p className="text-xs font-semibold tracking-[0.22em] text-tertiary uppercase">
            Account Base
          </p>
          <dl className="mt-4 space-y-3 text-sm leading-6 text-on-surface-variant">
            <div className="flex items-start justify-between gap-4">
              <dt>이메일</dt>
              <dd className="text-right text-on-surface">{user.email ?? "미확인"}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt>가입 채널</dt>
              <dd className="text-right text-on-surface">{provider}</dd>
            </div>
            <div className="flex items-start justify-between gap-4">
              <dt>가입일</dt>
              <dd className="text-right text-on-surface">{joinedAt}</dd>
            </div>
          </dl>
        </article>

        {profileError ? (
          <article className="rounded-[24px] border border-[rgba(255,180,171,0.28)] bg-[rgba(255,180,171,0.08)] px-5 py-4 text-sm leading-6 text-[#ffd9d4]">
            `profiles` 조회 중 오류가 발생했습니다. migration 적용 여부와 RLS 정책을
            먼저 확인해 주세요.
          </article>
        ) : null}
      </section>
    </AppShell>
  );
}
