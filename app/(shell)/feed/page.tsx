import { AppShell } from "@/components/app-shell";
import { FeedContent } from "@/components/feed/feed-content";
import { buildFeedContentData } from "@/lib/feed/feed-content-data";
import { getFeedData } from "@/lib/server/feed";

export const dynamic = "force-dynamic";

function readPreviewParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams?: Promise<{ preview?: string | string[] }>;
}) {
  const params = (await searchParams) ?? {};
  const data = buildFeedContentData(
    await getFeedData(readPreviewParam(params.preview)),
  );

  return (
    <AppShell
      title="The Ledger"
      subtitle="내 글과 팔로우한 플레이어의 게시글만 최신순으로 확인합니다."
    >
      <FeedContent data={data} />
    </AppShell>
  );
}
