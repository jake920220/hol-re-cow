import Link from "next/link";
import type { FeedData, FeedItem } from "@/lib/server/feed";

function truncateText(value: string, length: number) {
  const normalized = value.trim().replace(/\s+/g, " ");

  if (normalized.length <= length) {
    return normalized;
  }

  return `${normalized.slice(0, length).trimEnd()}...`;
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  const now = Date.now();

  if (Number.isNaN(timestamp)) {
    return "방금";
  }

  const minutes = Math.max(1, Math.floor((now - timestamp) / 60000));

  if (minutes < 60) {
    return `${minutes}분 전`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}시간 전`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}일 전`;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
  }).format(new Date(value));
}

function FeedToggle() {
  return (
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
  );
}

function PreviewBanner() {
  return (
    <article className="mb-5 rounded-[20px] border border-outline-variant/30 bg-surface-container px-4 py-4">
      <p className="text-[11px] font-semibold tracking-[0.2em] text-tertiary uppercase">
        Preview Mode
      </p>
      <p className="mt-2 text-sm leading-6 text-on-surface-variant">
        Supabase 환경변수가 없어 피드 UI 프리뷰 데이터를 표시하고 있습니다.
      </p>
    </article>
  );
}

function AuthorRow({ item }: { item: FeedItem }) {
  const sourceLabel = item.source === "self" ? "내 글" : "팔로우";
  const sourceClassName =
    item.source === "self"
      ? "border-primary/25 bg-primary-container/35 text-primary"
      : "border-outline-variant/35 bg-surface-low text-on-surface-variant";

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-outline-variant/25 bg-surface-high text-sm font-semibold text-tertiary">
          {item.author.initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-on-surface">
            {item.author.displayName}
          </p>
          <p className="mt-1 truncate text-[11px] tracking-[0.16em] text-on-surface-variant uppercase">
            @{item.author.handle} · {formatRelativeTime(item.createdAt)}
          </p>
        </div>
      </div>

      <span
        className={`shrink-0 rounded-[12px] border px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase ${sourceClassName}`}
      >
        {sourceLabel}
      </span>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "accent";
}) {
  return (
    <div className="rounded-[16px] border border-white/6 bg-black/20 px-4 py-3">
      <p className="text-[10px] font-medium tracking-[0.16em] text-on-surface-variant uppercase">
        {label}
      </p>
      <p
        className={`mt-2 text-sm font-semibold ${
          tone === "accent" ? "text-tertiary" : "text-on-surface"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function HandReviewCard({ item }: { item: FeedItem }) {
  return (
    <article className="premium-card rounded-[30px] px-5 py-5">
      <AuthorRow item={item} />

      <h2 className="mt-5 text-[28px] font-semibold leading-[1.35] text-on-surface">
        {item.title}
      </h2>

      <section className="felt-panel mt-5 rounded-[22px] border border-outline-variant/25 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full border border-primary/20 bg-primary-container/40 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-primary uppercase">
            Hand Review
          </span>
          <span className="text-[10px] tracking-[0.18em] text-on-surface-variant uppercase">
            Published
          </span>
        </div>

        <p className="mt-4 text-[10px] font-semibold tracking-[0.18em] text-on-surface-variant uppercase">
          리뷰 질문
        </p>
        <p className="mt-2 text-sm leading-7 text-on-surface">
          {truncateText(item.body, 132)}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <SummaryTile label="작성자" value={`@${item.author.handle}`} />
          <SummaryTile label="피드 규칙" value="최신순" tone="accent" />
        </div>
      </section>

      <div className="mt-4 flex items-center justify-between gap-4 border-t border-outline-variant/15 pt-4">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-tertiary uppercase">
          핸드리뷰
        </span>
        <p className="text-xs leading-6 text-on-surface-variant">
          {item.source === "self"
            ? "내가 올린 리뷰 글입니다."
            : "팔로우한 플레이어의 리뷰 글입니다."}
        </p>
      </div>
    </article>
  );
}

function FreePostCard({ item }: { item: FeedItem }) {
  return (
    <article className="premium-card rounded-[30px] px-5 py-5">
      <AuthorRow item={item} />

      <div className="mt-5 rounded-[22px] border border-outline-variant/25 bg-[linear-gradient(180deg,rgba(42,42,42,0.42),rgba(18,18,18,0.4))] px-4 py-4">
        <p className="text-[10px] font-semibold tracking-[0.18em] text-primary uppercase">
          Community Note
        </p>
        <h2 className="mt-3 text-[24px] font-semibold leading-[1.4] text-tertiary">
          {item.title}
        </h2>
        <p className="mt-4 text-sm leading-7 text-on-surface-variant">
          {truncateText(item.body, 156)}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <span className="rounded-full border border-outline-variant/30 bg-surface-low px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-on-surface-variant uppercase">
          자유글
        </span>
        <p className="text-xs leading-6 text-on-surface-variant">
          {item.source === "self"
            ? "내가 작성한 커뮤니티 글입니다."
            : "팔로우한 플레이어의 커뮤니티 글입니다."}
        </p>
      </div>
    </article>
  );
}

function StateActions({
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}) {
  return (
    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
      <Link
        href={primaryHref}
        className="flex min-h-11 flex-1 items-center justify-center rounded-[16px] border border-primary/20 bg-primary px-4 py-3 text-sm font-semibold text-[#143727] transition hover:brightness-105"
      >
        {primaryLabel}
      </Link>
      <Link
        href={secondaryHref}
        className="flex min-h-11 flex-1 items-center justify-center rounded-[16px] border border-outline-variant/30 bg-surface-low px-4 py-3 text-sm font-semibold text-on-surface"
      >
        {secondaryLabel}
      </Link>
    </div>
  );
}

function FeedStateCard({
  badge,
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  tone = "default",
}: {
  badge: string;
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  tone?: "default" | "error";
}) {
  const badgeClassName =
    tone === "error"
      ? "border-[rgba(255,180,171,0.22)] bg-[rgba(255,180,171,0.1)] text-error"
      : "border-outline-variant/30 bg-surface-low text-tertiary";

  return (
    <article className="premium-card rounded-[30px] px-6 py-7">
      <span
        className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase ${badgeClassName}`}
      >
        {badge}
      </span>
      <h2 className="mt-4 text-[28px] font-semibold leading-[1.35] text-on-surface">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-7 text-on-surface-variant">{description}</p>
      <StateActions
        primaryHref={primaryHref}
        primaryLabel={primaryLabel}
        secondaryHref={secondaryHref}
        secondaryLabel={secondaryLabel}
      />
    </article>
  );
}

export function FeedContent({ data }: { data: FeedData }) {
  return (
    <>
      {data.isPreview ? <PreviewBanner /> : null}
      <FeedToggle />

      {data.mode === "ready" ? (
        <>
          {data.followingCount === 0 ? (
            <article className="mb-5 rounded-[20px] border border-outline-variant/30 bg-surface-container px-4 py-4">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
                Own Posts Only
              </p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                팔로우한 플레이어가 아직 없어 지금은 내 게시글만 최신순으로 보여주고 있습니다.
              </p>
            </article>
          ) : null}

          <section className="space-y-4">
            {data.items.map((item) =>
              item.postType === "hand_review" ? (
                <HandReviewCard key={item.id} item={item} />
              ) : (
                <FreePostCard key={item.id} item={item} />
              ),
            )}
          </section>
        </>
      ) : null}

      {data.mode === "empty-no-following" ? (
        <FeedStateCard
          badge="Empty Feed"
          title="아직 팔로우한 플레이어가 없어요"
          description="기본 피드는 내 글과 팔로우한 플레이어의 게시글만 묶어서 보여줍니다. 먼저 내 첫 글을 올리거나 마이페이지에서 팔로우 관계를 준비해 주세요."
          primaryHref="/create"
          primaryLabel="첫 글 작성하기"
          secondaryHref="/mypage"
          secondaryLabel="마이페이지 보기"
        />
      ) : null}

      {data.mode === "empty-no-posts" ? (
        <FeedStateCard
          badge="No Posts"
          title="피드에 올라온 게시글이 아직 없어요"
          description={`현재 팔로우한 플레이어 ${data.followingCount}명의 published 글과 내 글을 확인했지만 아직 표시할 게시글이 없습니다.`}
          primaryHref="/create"
          primaryLabel="새 글 작성하기"
          secondaryHref="/feed"
          secondaryLabel="다시 확인하기"
        />
      ) : null}

      {data.mode === "error" ? (
        <FeedStateCard
          badge="Feed Error"
          title="피드를 불러오지 못했습니다"
          description={data.message}
          primaryHref="/feed"
          primaryLabel="다시 시도하기"
          secondaryHref="/create"
          secondaryLabel="작성 화면 보기"
          tone="error"
        />
      ) : null}
    </>
  );
}
