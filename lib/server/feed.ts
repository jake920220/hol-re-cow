import "server-only";

import { redirect } from "next/navigation";
import { buildAuthRedirect } from "@/lib/auth/flow";
import { hasSupabaseCredentials } from "@/lib/server/env";
import { createServerSupabaseReadClient } from "@/lib/server/supabase";

export type FeedPostType = "hand_review" | "free_post";
export type FeedSource = "self" | "following";

export type FeedAuthor = {
  id: string;
  displayName: string;
  handle: string;
  initial: string;
};

export type FeedItem = {
  id: string;
  postType: FeedPostType;
  title: string;
  body: string;
  createdAt: string;
  author: FeedAuthor;
  source: FeedSource;
};

export type FeedData =
  | {
      mode: "ready";
      items: FeedItem[];
      followingCount: number;
      isPreview: boolean;
    }
  | {
      mode: "unavailable";
      message: string;
      isPreview: boolean;
    }
  | {
      mode: "empty-no-following";
      isPreview: boolean;
    }
  | {
      mode: "empty-no-posts";
      followingCount: number;
      isPreview: boolean;
    }
  | {
      mode: "error";
      message: string;
      isPreview: boolean;
    };

type PreviewMode =
  | "default"
  | "empty-no-following"
  | "empty-no-posts"
  | "error"
  | "loading";

type FeedPostRow = {
  id: string;
  author_id: string;
  post_type: FeedPostType;
  title: string | null;
  body: string;
  created_at: string;
};

type FeedProfileRow = {
  id: string;
  display_name: string;
  handle: string;
};

const PREVIEW_ITEMS: FeedItem[] = [
  {
    id: "preview-hand-review-self",
    postType: "hand_review",
    title: "리버 4벳 블러프 라인 검토",
    body:
      "딥스택 상황에서 턴까지 체크-콜 후 리버 오버벳을 받은 스팟입니다. 블로커 구성과 폴드 빈도를 같이 보고 싶어요.",
    createdAt: "2026-04-06T09:15:00+09:00",
    author: {
      id: "preview-self",
      displayName: "준현님",
      handle: "junhyun",
      initial: "준",
    },
    source: "self",
  },
  {
    id: "preview-free-post-following",
    postType: "free_post",
    title: "이번 주 세션 복기 루틴 정리",
    body:
      "세션 후 세 개의 핵심 스팟만 다시 적는 방식으로 바꾸니 복기 밀도가 좋아졌습니다. 루틴을 단순화하니 피로감도 확실히 줄었어요.",
    createdAt: "2026-04-06T07:40:00+09:00",
    author: {
      id: "preview-following",
      displayName: "James Donovan",
      handle: "jamesdonovan",
      initial: "J",
    },
    source: "following",
  },
];

const PREVIEW_MODES = new Set<PreviewMode>([
  "default",
  "empty-no-following",
  "empty-no-posts",
  "error",
  "loading",
]);

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function resolvePreviewMode(value?: string | null): PreviewMode | null {
  if (!value) {
    return null;
  }

  return PREVIEW_MODES.has(value as PreviewMode)
    ? (value as PreviewMode)
    : null;
}

function buildAuthor(profile: FeedProfileRow | null, fallbackId: string) {
  const displayName = profile?.display_name?.trim() || "홀리카우 플레이어";
  const handle = profile?.handle?.trim() || "player";

  return {
    id: profile?.id ?? fallbackId,
    displayName,
    handle,
    initial: displayName.slice(0, 1) || "H",
  };
}

function buildFeedTitle(post: FeedPostRow) {
  const title = post.title?.trim();

  if (title) {
    return title;
  }

  if (post.post_type === "hand_review") {
    return "제목 없는 핸드리뷰";
  }

  const excerpt = post.body.trim().slice(0, 34);

  return excerpt ? `${excerpt}${post.body.trim().length > 34 ? "..." : ""}` : "제목 없는 글";
}

function mapFeedItem(post: FeedPostRow, author: FeedAuthor, currentUserId: string): FeedItem {
  return {
    id: post.id,
    postType: post.post_type,
    title: buildFeedTitle(post),
    body: post.body.trim(),
    createdAt: post.created_at,
    author,
    source: post.author_id === currentUserId ? "self" : "following",
  };
}

function buildQueryErrorMessage() {
  return "피드를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

function buildUnavailableMessage() {
  return "현재 서버에 Supabase 환경변수가 없어 실제 피드를 조회할 수 없습니다. `SUPABASE_URL`과 `SUPABASE_PUBLISHABLE_KEY`를 연결하면 내 글과 팔로우한 플레이어의 published 글을 최신순으로 확인할 수 있습니다.";
}

export async function getFeedData(previewValue?: string | null): Promise<FeedData> {
  const previewMode = resolvePreviewMode(previewValue);

  if (!hasSupabaseCredentials()) {
    if (previewMode === "loading") {
      await wait(1200);
    }

    if (previewMode === "empty-no-following") {
      return {
        mode: "empty-no-following",
        isPreview: true,
      };
    }

    if (previewMode === "empty-no-posts") {
      return {
        mode: "empty-no-posts",
        followingCount: 3,
        isPreview: true,
      };
    }

    if (previewMode === "error") {
      return {
        mode: "error",
        message: "Supabase 연결이 없어 프리뷰 전용 오류 상태를 표시하고 있습니다.",
        isPreview: true,
      };
    }

    if (!previewMode) {
      return {
        mode: "unavailable",
        message: buildUnavailableMessage(),
        isPreview: false,
      };
    }

    return {
      mode: "ready",
      items: PREVIEW_ITEMS,
      followingCount: 1,
      isPreview: true,
    };
  }

  const supabase = await createServerSupabaseReadClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return {
      mode: "error",
      message: "세션을 확인하지 못했습니다. 다시 로그인하거나 잠시 후 다시 시도해 주세요.",
      isPreview: false,
    };
  }

  if (!user) {
    redirect(
      buildAuthRedirect("/auth/login", {
        tone: "info",
        message: "피드를 보려면 먼저 로그인해 주세요.",
        nextPath: "/feed",
      }),
    );
  }

  const { data: follows, error: followsError } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  if (followsError) {
    return {
      mode: "error",
      message: buildQueryErrorMessage(),
      isPreview: false,
    };
  }

  const followingIds = (follows ?? []).map((follow) => follow.following_id);
  const authorIds = [user.id, ...followingIds];

  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("id, author_id, post_type, title, body, created_at")
    .eq("status", "published")
    .in("author_id", authorIds)
    .order("created_at", { ascending: false });

  if (postsError) {
    return {
      mode: "error",
      message: buildQueryErrorMessage(),
      isPreview: false,
    };
  }

  const feedPosts = (posts ?? []) as FeedPostRow[];

  if (feedPosts.length === 0) {
    if (followingIds.length === 0) {
      return {
        mode: "empty-no-following",
        isPreview: false,
      };
    }

    return {
      mode: "empty-no-posts",
      followingCount: followingIds.length,
      isPreview: false,
    };
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name, handle")
    .in(
      "id",
      Array.from(new Set(feedPosts.map((post) => post.author_id))),
    );

  if (profilesError) {
    return {
      mode: "error",
      message: buildQueryErrorMessage(),
      isPreview: false,
    };
  }

  const profileMap = new Map(
    ((profiles ?? []) as FeedProfileRow[]).map((profile) => [profile.id, profile]),
  );

  return {
    mode: "ready",
    items: feedPosts.map((post) =>
      mapFeedItem(post, buildAuthor(profileMap.get(post.author_id) ?? null, post.author_id), user.id),
    ),
    followingCount: followingIds.length,
    isPreview: false,
  };
}
