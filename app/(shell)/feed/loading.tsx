import { AppShell } from "@/components/app-shell";
import { FeedLoadingSkeleton } from "@/components/feed/feed-loading-skeleton";

export default function FeedLoading() {
  return (
    <AppShell
      title="The Ledger"
      subtitle="내 글과 팔로우한 플레이어의 게시글만 최신순으로 확인합니다."
    >
      <FeedLoadingSkeleton />
    </AppShell>
  );
}
