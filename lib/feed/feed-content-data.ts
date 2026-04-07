import type { FeedData, FeedItem } from "@/lib/server/feed";

export type FeedContentItem = FeedItem & {
  createdAtLabel: string;
};

export type FeedContentData =
  | {
      mode: "ready";
      items: FeedContentItem[];
      followingCount: number;
      isPreview: boolean;
    }
  | Exclude<FeedData, { mode: "ready" }>;

const FEED_DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  month: "numeric",
  day: "numeric",
  timeZone: "Asia/Seoul",
});

export function formatFeedCreatedAtLabel(
  value: string,
  now: number | Date = new Date(),
) {
  const timestamp = new Date(value).getTime();
  const nowTime = typeof now === "number" ? now : now.getTime();

  if (Number.isNaN(timestamp)) {
    return "방금";
  }

  const minutes = Math.max(1, Math.floor((nowTime - timestamp) / 60000));

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

  return FEED_DATE_FORMATTER.format(new Date(value));
}

export function buildFeedContentData(
  data: FeedData,
  now: number | Date = new Date(),
): FeedContentData {
  if (data.mode !== "ready") {
    return data;
  }

  return {
    ...data,
    items: data.items.map((item) => ({
      ...item,
      createdAtLabel: formatFeedCreatedAtLabel(item.createdAt, now),
    })),
  };
}
