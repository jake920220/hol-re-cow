import { AppShell } from "@/components/app-shell";

const options = [
  {
    title: "핸드리뷰 작성",
    description: "포지션, 보드, 액션 흐름을 구조화해서 리뷰를 요청하는 타입입니다.",
  },
  {
    title: "일반 게시물 작성",
    description: "세션 후기, 전략 메모, 커뮤니티 대화를 올리는 자유 글 타입입니다.",
  },
];

export default function CreatePage() {
  return (
    <AppShell
      title="게시글 작성"
      subtitle="작성 타입 선택과 공통 셸 레이아웃만 먼저 구현한 단계입니다."
    >
      <section className="rounded-[32px] border border-outline-variant/30 bg-surface-container px-6 py-7 shadow-[0_24px_48px_rgba(0,0,0,0.24)]">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold tracking-[0.28em] text-tertiary uppercase">
            Create Selection
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-on-surface">
            어떤 글을 올릴까요?
          </h2>
          <p className="mt-3 text-sm leading-7 text-on-surface-variant">
            Stitch 원본의 선택 모달을 앱 셸 안에 맞게 정리한 기본 구조입니다.
          </p>
        </div>
        <div className="space-y-4">
          {options.map((option) => (
            <button
              key={option.title}
              type="button"
              className="felt-panel block w-full rounded-[24px] border border-outline-variant/30 px-5 py-5 text-left transition hover:border-primary/40"
            >
              <h3 className="text-lg font-semibold text-on-surface">{option.title}</h3>
              <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                {option.description}
              </p>
            </button>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
