import { describe, expect, it } from "vitest";
import {
  buildFeedContentData,
  formatFeedCreatedAtLabel,
} from "@/lib/feed/feed-content-data";

describe("feed content time labels", () => {
  it("formats relative labels on the server-ready payload", () => {
    const data = buildFeedContentData(
      {
        mode: "ready",
        followingCount: 1,
        isPreview: false,
        items: [
          {
            id: "post-1",
            postType: "free_post",
            title: "세션 메모",
            body: "본문",
            createdAt: "2026-04-06T09:15:00+09:00",
            author: {
              id: "user-1",
              displayName: "준현님",
              handle: "junhyun",
              initial: "준",
            },
            source: "self",
          },
        ],
      },
      new Date("2026-04-06T12:50:00+09:00"),
    );

    expect(data).toEqual({
      mode: "ready",
      followingCount: 1,
      isPreview: false,
      items: [
        {
          id: "post-1",
          postType: "free_post",
          title: "세션 메모",
          body: "본문",
          createdAt: "2026-04-06T09:15:00+09:00",
          createdAtLabel: "3시간 전",
          author: {
            id: "user-1",
            displayName: "준현님",
            handle: "junhyun",
            initial: "준",
          },
          source: "self",
        },
      ],
    });
  });

  it("falls back to calendar labels after one week", () => {
    expect(
      formatFeedCreatedAtLabel(
        "2026-03-20T09:15:00+09:00",
        new Date("2026-04-06T12:50:00+09:00"),
      ),
    ).toBe("3. 20.");
  });
});
