import { AppShell } from "@/components/app-shell";

export default function MyPage() {
  return (
    <AppShell
      title="마이페이지"
      subtitle="프로필과 활동 요약의 레이아웃 우선순위를 먼저 고정한 셸입니다."
    >
      <section className="premium-card rounded-[32px] p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-outline-variant/40 bg-surface-high text-2xl font-bold text-primary">
            H
          </div>
          <div>
            <p className="text-xl font-semibold text-on-surface">홀리카우 유저</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              핸드리뷰를 기록하고 토론하는 개인 공간
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: "게시글", value: "12" },
            { label: "팔로워", value: "48" },
            { label: "팔로잉", value: "31" },
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
    </AppShell>
  );
}
