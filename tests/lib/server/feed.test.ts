import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));
vi.mock("@/lib/server/env", () => ({
  hasSupabaseCredentials: vi.fn(),
}));
vi.mock("@/lib/server/supabase", () => ({
  createServerSupabaseReadClient: vi.fn(),
}));

import { getFeedData } from "@/lib/server/feed";
import { hasSupabaseCredentials } from "@/lib/server/env";
import { createServerSupabaseReadClient } from "@/lib/server/supabase";

type QueryResult<T> = {
  data: T;
  error: { message: string } | null;
};

type TableState = {
  eqCalls: Array<[column: string, value: unknown]>;
  inCalls: Array<[column: string, values: unknown[]]>;
  orderCalls: Array<[column: string, options: unknown]>;
};

type FeedSupabaseOptions = {
  userId?: string | null;
  followsResult?: QueryResult<Array<{ following_id: string }>>;
  postsResult?: QueryResult<
    Array<{
      id: string;
      author_id: string;
      post_type: "hand_review" | "free_post";
      title: string | null;
      body: string;
      created_at: string;
    }>
  >;
  profilesResult?: QueryResult<
    Array<{
      id: string;
      display_name: string;
      handle: string;
    }>
  >;
};

function createTableState(): TableState {
  return {
    eqCalls: [],
    inCalls: [],
    orderCalls: [],
  };
}

function createQueryBuilder<T>(result: QueryResult<T>, state: TableState) {
  const builder = {
    select() {
      return builder;
    },
    eq(column: string, value: unknown) {
      state.eqCalls.push([column, value]);
      return builder;
    },
    in(column: string, values: unknown[]) {
      state.inCalls.push([column, [...values]]);
      return builder;
    },
    order(column: string, options: unknown) {
      state.orderCalls.push([column, options]);
      return builder;
    },
    then(onFulfilled?: (value: QueryResult<T>) => unknown, onRejected?: (reason: unknown) => unknown) {
      return Promise.resolve(result).then(onFulfilled, onRejected);
    },
  };

  return builder;
}

function createFeedSupabaseStub(options: FeedSupabaseOptions = {}) {
  const followsState = createTableState();
  const postsState = createTableState();
  const profilesState = createTableState();

  const tableEntries = {
    follows: createQueryBuilder(
      options.followsResult ?? {
        data: [],
        error: null,
      },
      followsState,
    ),
    posts: createQueryBuilder(
      options.postsResult ?? {
        data: [],
        error: null,
      },
      postsState,
    ),
    profiles: createQueryBuilder(
      options.profilesResult ?? {
        data: [],
        error: null,
      },
      profilesState,
    ),
  } as const;

  return {
    client: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: options.userId === null ? null : { id: options.userId ?? "user-1" },
          },
          error: null,
        }),
      },
      from: vi.fn((table: keyof typeof tableEntries) => tableEntries[table]),
    },
    states: {
      follows: followsState,
      posts: postsState,
      profiles: profilesState,
    },
  };
}

describe("getFeedData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns preview empty-no-following state without Supabase credentials", async () => {
    vi.mocked(hasSupabaseCredentials).mockReturnValue(false);

    await expect(getFeedData("empty-no-following")).resolves.toEqual({
      mode: "empty-no-following",
      isPreview: true,
    });
  });

  it("keeps the published/self+following feed contract for server data", async () => {
    vi.mocked(hasSupabaseCredentials).mockReturnValue(true);

    const supabase = createFeedSupabaseStub({
      followsResult: {
        data: [{ following_id: "user-2" }, { following_id: "user-3" }],
        error: null,
      },
      postsResult: {
        data: [
          {
            id: "post-1",
            author_id: "user-1",
            post_type: "free_post",
            title: null,
            body: "  세션 복기 메모를 남깁니다.  ",
            created_at: "2026-04-06T09:15:00+09:00",
          },
          {
            id: "post-2",
            author_id: "user-2",
            post_type: "hand_review",
            title: null,
            body: "딥스택 리버 콜다운 라인이 맞았는지 검토 부탁드립니다.",
            created_at: "2026-04-06T08:40:00+09:00",
          },
        ],
        error: null,
      },
      profilesResult: {
        data: [
          { id: "user-1", display_name: "준현님", handle: "junhyun" },
          { id: "user-2", display_name: "James", handle: "james" },
        ],
        error: null,
      },
    });

    vi.mocked(createServerSupabaseReadClient).mockResolvedValue(supabase.client as never);

    const data = await getFeedData();

    expect(supabase.states.posts.eqCalls).toEqual([["status", "published"]]);
    expect(supabase.states.posts.inCalls).toEqual([
      ["author_id", ["user-1", "user-2", "user-3"]],
    ]);
    expect(supabase.states.posts.orderCalls).toEqual([
      ["created_at", { ascending: false }],
    ]);

    expect(data).toEqual({
      mode: "ready",
      followingCount: 2,
      isPreview: false,
      items: [
        {
          id: "post-1",
          postType: "free_post",
          title: "세션 복기 메모를 남깁니다.",
          body: "세션 복기 메모를 남깁니다.",
          createdAt: "2026-04-06T09:15:00+09:00",
          author: {
            id: "user-1",
            displayName: "준현님",
            handle: "junhyun",
            initial: "준",
          },
          source: "self",
        },
        {
          id: "post-2",
          postType: "hand_review",
          title: "제목 없는 핸드리뷰",
          body: "딥스택 리버 콜다운 라인이 맞았는지 검토 부탁드립니다.",
          createdAt: "2026-04-06T08:40:00+09:00",
          author: {
            id: "user-2",
            displayName: "James",
            handle: "james",
            initial: "J",
          },
          source: "following",
        },
      ],
    });
  });

  it("returns empty-no-following when there are no follows and no posts", async () => {
    vi.mocked(hasSupabaseCredentials).mockReturnValue(true);

    const supabase = createFeedSupabaseStub();

    vi.mocked(createServerSupabaseReadClient).mockResolvedValue(supabase.client as never);

    await expect(getFeedData()).resolves.toEqual({
      mode: "empty-no-following",
      isPreview: false,
    });
  });

  it("returns empty-no-posts when follows exist but published posts do not", async () => {
    vi.mocked(hasSupabaseCredentials).mockReturnValue(true);

    const supabase = createFeedSupabaseStub({
      followsResult: {
        data: [{ following_id: "user-2" }],
        error: null,
      },
    });

    vi.mocked(createServerSupabaseReadClient).mockResolvedValue(supabase.client as never);

    await expect(getFeedData()).resolves.toEqual({
      mode: "empty-no-posts",
      followingCount: 1,
      isPreview: false,
    });
  });

  it("returns an error state when the posts query fails", async () => {
    vi.mocked(hasSupabaseCredentials).mockReturnValue(true);

    const supabase = createFeedSupabaseStub({
      postsResult: {
        data: [],
        error: { message: "database unavailable" },
      },
    });

    vi.mocked(createServerSupabaseReadClient).mockResolvedValue(supabase.client as never);

    await expect(getFeedData()).resolves.toEqual({
      mode: "error",
      message: "피드를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      isPreview: false,
    });
  });
});
