"use client";

import { AppShell } from "@/components/app-shell";

export default function FeedError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <AppShell
      title="The Ledger"
      subtitle="내 글과 팔로우한 플레이어의 게시글만 최신순으로 확인합니다."
    >
      <section className="mb-6 flex gap-7 border-b border-outline-variant/20 px-1">
        <button
          type="button"
          className="border-b-2 border-tertiary pb-4 text-[13px] font-semibold tracking-[0.22em] text-tertiary uppercase"
        >
          Feed
        </button>
        <button
          type="button"
          disabled
          className="pb-4 text-[13px] font-semibold tracking-[0.22em] text-on-surface-variant uppercase opacity-80"
        >
          Following
        </button>
      </section>

      <article className="premium-card rounded-[30px] px-6 py-7">
        <span className="inline-flex rounded-full border border-[rgba(255,180,171,0.22)] bg-[rgba(255,180,171,0.1)] px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-error uppercase">
          Feed Error
        </span>
        <h2 className="mt-4 text-[28px] font-semibold leading-[1.35] text-on-surface">
          예기치 않은 문제가 발생했습니다
        </h2>
        <p className="mt-3 text-sm leading-7 text-on-surface-variant">
          피드 화면을 다시 렌더링하는 중 오류가 발생했습니다. 같은 문제가 반복되면
          서버 로그와 Supabase 연결 상태를 함께 확인해 주세요.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="flex min-h-11 flex-1 items-center justify-center rounded-[16px] border border-primary/20 bg-primary px-4 py-3 text-sm font-semibold text-[#143727] transition hover:brightness-105"
          >
            다시 시도하기
          </button>
          <a
            href="/create"
            className="flex min-h-11 flex-1 items-center justify-center rounded-[16px] border border-outline-variant/30 bg-surface-low px-4 py-3 text-sm font-semibold text-on-surface"
          >
            작성 화면 보기
          </a>
        </div>
      </article>
    </AppShell>
  );
}
