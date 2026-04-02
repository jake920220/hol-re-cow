import { AppShell } from "@/components/app-shell";

const posts = [
  {
    type: "핸드리뷰",
    title: "리버 4벳 블러프 라인 검토",
    body: "딥스택 상황에서 턴까지 체크-콜 후 리버 오버벳을 받은 스팟입니다. 내 블로커 구성이 충분한지와 상대의 폴드 빈도를 같이 보고 싶어요.",
    meta: "하이 스테이크 분석 · 2시간 전",
  },
  {
    type: "자유글",
    title: "이번 주 세션 복기 루틴 정리",
    body: "플랍부터 리버까지 모든 결정을 적기보다, 세션 후에 세 개의 핵심 스팟만 골라 기록하는 방식으로 바꾸니 복기 밀도가 좋아졌습니다.",
    meta: "커뮤니티 글 · 5시간 전",
  },
];

export default function FeedPage() {
  return (
    <AppShell
      title="커뮤니티 피드"
      subtitle="팔로우한 유저와 내 게시글을 최신순으로 확인하는 기본 셸입니다."
    >
      <section className="mb-6 flex gap-6 border-b border-outline-variant/20 px-2">
        <button className="border-b-2 border-tertiary pb-4 text-sm font-semibold tracking-[0.22em] text-tertiary uppercase">
          Feed
        </button>
        <button className="pb-4 text-sm font-semibold tracking-[0.22em] text-on-surface-variant uppercase">
          Following
        </button>
      </section>

      <section className="space-y-5">
        {posts.map((post) => (
          <article key={post.title} className="premium-card rounded-[28px] p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="rounded-full bg-surface-high px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-tertiary uppercase">
                {post.type}
              </span>
              <span className="text-xs text-on-surface-variant">{post.meta}</span>
            </div>
            <h2 className="text-xl font-semibold leading-8 text-on-surface">
              {post.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-on-surface-variant">
              {post.body}
            </p>
          </article>
        ))}
      </section>
    </AppShell>
  );
}
