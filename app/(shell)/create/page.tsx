import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getPostCreateAccessState } from "@/lib/post-create/server";

export const dynamic = "force-dynamic";

const options = [
  {
    href: "/create/hand-review",
    eyebrow: "Hand Review",
    title: "핸드리뷰 작성",
    description:
      "포지션, 핸드, 보드, 액션 흐름, 리뷰 질문을 구조화해 남기는 흐름입니다.",
    points: ["게임 타입과 포지션", "핸드와 보드 입력", "액션 흐름과 질문"],
  },
  {
    href: "/create/free-post",
    eyebrow: "Free Post",
    title: "일반 게시글 작성",
    description:
      "세션 후기, 전략 메모, 커뮤니티 대화를 제목과 본문 중심으로 바로 남깁니다.",
    points: ["간단한 제목", "자유 본문", "초안 또는 바로 게시"],
  },
] as const;

export default async function CreatePage() {
  const accessState = await getPostCreateAccessState();

  return (
    <AppShell
      title="게시글 작성"
      subtitle="hand_review 와 free_post 진입을 공통 앱 셸 안에서 분리하고, 저장은 모두 서버 경계에서만 처리합니다."
    >
      <section className="rounded-[32px] border border-outline-variant/30 bg-surface-container px-6 py-7 shadow-[0_24px_48px_rgba(0,0,0,0.24)]">
        <div className="text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-tertiary uppercase">
            Create Flow
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-on-surface">
            어떤 작성 흐름으로 들어갈까요?
          </h2>
          <p className="mt-3 text-sm leading-7 text-on-surface-variant">
            타입 선택은 즉시 구분되고, 각 화면의 CTA 상태는 필수 입력과 서버 경계를
            기준으로 달라집니다.
          </p>
        </div>

        {!accessState.envReady ? (
          <div className="mt-6 rounded-[24px] border border-[rgba(255,180,171,0.28)] bg-[rgba(255,180,171,0.08)] px-5 py-4 text-sm leading-6 text-[#ffd9d4]">
            현재 서버에 Supabase 환경변수가 없어 작성 버튼은 잠겨 있습니다. 화면 구조와
            검증 상태는 먼저 확인할 수 있습니다.
          </div>
        ) : null}

        {accessState.envReady && !accessState.isAuthenticated ? (
          <div className="mt-6 rounded-[24px] border border-outline-variant/40 bg-surface-low px-5 py-4 text-sm leading-6 text-on-surface-variant">
            로그인 전에도 작성 타입은 미리 볼 수 있지만, 실제 저장 요청은 로그인 이후
            서버 액션에서만 처리됩니다.
          </div>
        ) : null}

        <div className="mt-7 grid gap-4">
          {options.map((option) => (
            <Link
              key={option.href}
              href={option.href}
              className="group block rounded-[28px] border border-outline-variant/30 bg-[linear-gradient(180deg,rgba(32,31,31,0.96),rgba(16,16,16,0.96))] px-5 py-5 transition hover:border-primary/40 hover:shadow-[0_20px_44px_rgba(0,0,0,0.22)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold tracking-[0.22em] text-tertiary uppercase">
                    {option.eyebrow}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold text-on-surface">
                    {option.title}
                  </h3>
                </div>
                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                  바로 진입
                </span>
              </div>

              <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                {option.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {option.points.map((point) => (
                  <span
                    key={point}
                    className="rounded-full border border-outline-variant/40 bg-surface-low px-3 py-1 text-xs text-on-surface-variant"
                  >
                    {point}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
