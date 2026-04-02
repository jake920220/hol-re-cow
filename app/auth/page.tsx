export default function AuthPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center px-6 py-10">
      <section className="relative overflow-hidden rounded-[36px] border border-outline-variant/30 bg-surface-container px-7 py-10 shadow-[0_28px_52px_rgba(0,0,0,0.28)]">
        <div className="absolute -top-20 right-[-20%] h-48 w-48 rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute bottom-[-15%] left-[-10%] h-40 w-40 rounded-full bg-tertiary/10 blur-3xl" />

        <div className="relative">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] border border-outline-variant/30 bg-surface-high text-2xl font-semibold text-tertiary shadow-[0_16px_32px_rgba(0,0,0,0.2)]">
            HC
          </div>
          <div className="mt-8 text-center">
            <h1 className="text-3xl font-semibold text-on-surface">홀리카우</h1>
            <p className="mt-3 text-sm leading-7 text-on-surface-variant">
              인증 화면은 공통 앱 셸 바깥에서 동작하는 독립 레이아웃으로
              유지합니다.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            <div className="rounded-[20px] border border-outline-variant/30 bg-surface-low px-4 py-4 text-sm text-on-surface-variant">
              이메일, Google, Kakao 인증은 다음 phase에서 서버 경계 기준으로
              구현합니다.
            </div>
            <button
              type="button"
              className="w-full rounded-[20px] bg-primary px-4 py-4 text-sm font-semibold text-[#143727] transition hover:brightness-105"
            >
              로그인 UI 준비됨
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
