function SkeletonCard({ withPanel }: { withPanel: boolean }) {
  return (
    <article className="premium-card animate-pulse rounded-[30px] px-5 py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-[12px] bg-surface-high" />
          <div className="space-y-2">
            <div className="h-4 w-28 rounded-full bg-surface-high" />
            <div className="h-3 w-24 rounded-full bg-surface-low" />
          </div>
        </div>
        <div className="h-8 w-16 rounded-[12px] bg-surface-low" />
      </div>

      <div className="mt-5 space-y-3">
        <div className="h-8 w-4/5 rounded-full bg-surface-high" />
        <div className="h-8 w-3/5 rounded-full bg-surface-high" />
      </div>

      {withPanel ? (
        <div className="mt-5 rounded-[22px] border border-outline-variant/20 bg-surface-lowest px-4 py-4">
          <div className="h-4 w-24 rounded-full bg-surface-low" />
          <div className="mt-4 h-4 w-full rounded-full bg-surface-low" />
          <div className="mt-3 h-4 w-5/6 rounded-full bg-surface-low" />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="h-16 rounded-[16px] bg-surface-low" />
            <div className="h-16 rounded-[16px] bg-surface-low" />
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-[22px] border border-outline-variant/20 bg-surface-lowest px-4 py-4">
          <div className="h-4 w-28 rounded-full bg-surface-low" />
          <div className="mt-4 h-4 w-full rounded-full bg-surface-low" />
          <div className="mt-3 h-4 w-4/5 rounded-full bg-surface-low" />
          <div className="mt-3 h-4 w-3/5 rounded-full bg-surface-low" />
        </div>
      )}
    </article>
  );
}

export function FeedLoadingSkeleton() {
  return (
    <>
      <section className="mb-6 flex gap-7 border-b border-outline-variant/20 px-1 pb-px">
        <div className="h-9 w-14 animate-pulse rounded-full bg-surface-high" />
        <div className="h-9 w-24 animate-pulse rounded-full bg-surface-low" />
      </section>

      <section className="space-y-4">
        <SkeletonCard withPanel />
        <SkeletonCard withPanel={false} />
      </section>
    </>
  );
}
