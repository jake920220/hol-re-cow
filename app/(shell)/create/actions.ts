"use server";

import { revalidatePath } from "next/cache";
import type { PostgrestError } from "@supabase/supabase-js";
import {
  getFreePostDraftError,
  getFreePostPublishErrors,
  getHandReviewDraftError,
  getHandReviewPublishErrors,
  initialFreePostActionState,
  initialHandReviewActionState,
  normalizeHandReviewCards,
  readFreePostValues,
  readHandReviewValues,
  readIntent,
  type FreePostActionState,
  type HandReviewActionState,
  type PostSaveStatus,
} from "@/lib/post-create/contracts";
import { hasSupabaseCredentials } from "@/lib/server/env";
import { createServerSupabaseActionClient } from "@/lib/server/supabase";

function createSubmissionId() {
  return Date.now();
}

function createWriteErrorMessage(error: PostgrestError | null) {
  if (!error) {
    return "게시글 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
  }

  if (error.code === "23503" || error.code === "42P01" || error.code === "42883") {
    return "DB 스키마가 아직 준비되지 않았습니다. migration 적용 여부를 확인해 주세요.";
  }

  if (error.code === "23514") {
    return "핸드리뷰 입력값을 다시 확인해 주세요.";
  }

  return "게시글 저장 중 오류가 발생했습니다. RLS와 migration 상태를 확인해 주세요.";
}

function buildFreePostSuccessState(
  savedAs: PostSaveStatus,
  message: string,
): FreePostActionState {
  return {
    ...initialFreePostActionState,
    status: "success",
    message,
    savedAs,
    submissionId: createSubmissionId(),
  };
}

function buildHandReviewSuccessState(
  savedAs: PostSaveStatus,
  message: string,
): HandReviewActionState {
  return {
    ...initialHandReviewActionState,
    status: "success",
    message,
    savedAs,
    submissionId: createSubmissionId(),
  };
}

export async function createFreePostAction(
  _previousState: FreePostActionState,
  formData: FormData,
): Promise<FreePostActionState> {
  const intent = readIntent(formData);
  const values = readFreePostValues(formData);

  if (!hasSupabaseCredentials()) {
    return {
      ...initialFreePostActionState,
      status: "error",
      message: "서버에 Supabase 환경변수가 없어 작성 요청을 처리할 수 없습니다.",
      submissionId: createSubmissionId(),
    };
  }

  const supabase = await createServerSupabaseActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ...initialFreePostActionState,
      status: "error",
      message: "로그인 후에만 게시글을 저장할 수 있습니다.",
      submissionId: createSubmissionId(),
    };
  }

  if (intent === "draft") {
    const draftError = getFreePostDraftError(values);

    if (draftError) {
      return {
        ...initialFreePostActionState,
        status: "error",
        message: draftError,
        submissionId: createSubmissionId(),
      };
    }
  }

  const publishErrors = getFreePostPublishErrors(values);
  if (intent === "publish" && Object.keys(publishErrors).length > 0) {
    return {
      ...initialFreePostActionState,
      status: "error",
      message: "필수 입력을 채운 뒤 게시해 주세요.",
      fieldErrors: publishErrors,
      submissionId: createSubmissionId(),
    };
  }

  const status: PostSaveStatus = intent === "draft" ? "draft" : "published";
  const { error } = await supabase.from("posts").insert({
    author_id: user.id,
    post_type: "free_post",
    status,
    title: values.title || null,
    body: values.body,
  });

  if (error) {
    return {
      ...initialFreePostActionState,
      status: "error",
      message: createWriteErrorMessage(error),
      submissionId: createSubmissionId(),
    };
  }

  revalidatePath("/create");
  revalidatePath("/create/free-post");
  revalidatePath("/feed");
  revalidatePath("/mypage");

  return buildFreePostSuccessState(
    status,
    status === "draft"
      ? "일반 글 초안을 저장했습니다. 이어서 다듬은 뒤 게시할 수 있어요."
      : "일반 글을 게시했습니다.",
  );
}

export async function createHandReviewAction(
  _previousState: HandReviewActionState,
  formData: FormData,
): Promise<HandReviewActionState> {
  const intent = readIntent(formData);
  const values = readHandReviewValues(formData);

  if (!hasSupabaseCredentials()) {
    return {
      ...initialHandReviewActionState,
      status: "error",
      message: "서버에 Supabase 환경변수가 없어 작성 요청을 처리할 수 없습니다.",
      submissionId: createSubmissionId(),
    };
  }

  const supabase = await createServerSupabaseActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ...initialHandReviewActionState,
      status: "error",
      message: "로그인 후에만 핸드리뷰를 저장할 수 있습니다.",
      submissionId: createSubmissionId(),
    };
  }

  if (intent === "draft") {
    const draftError = getHandReviewDraftError(values);

    if (draftError) {
      return {
        ...initialHandReviewActionState,
        status: "error",
        message: draftError,
        submissionId: createSubmissionId(),
      };
    }
  }

  const publishErrors = getHandReviewPublishErrors(values);
  if (intent === "publish" && Object.keys(publishErrors).length > 0) {
    return {
      ...initialHandReviewActionState,
      status: "error",
      message: "핵심 맥락을 채운 뒤 리뷰 요청을 게시해 주세요.",
      fieldErrors: publishErrors,
      submissionId: createSubmissionId(),
    };
  }

  const normalizedCards = normalizeHandReviewCards(values);
  const status: PostSaveStatus = intent === "draft" ? "draft" : "published";

  const generatedTitle = [values.heroPosition, normalizedCards.heroCards.join(" ")]
    .filter(Boolean)
    .join(" ");
  const title =
    values.title ||
    values.question ||
    (generatedTitle ? `${generatedTitle} 리뷰 요청` : "핸드리뷰 초안");

  const { error } = await supabase.rpc("create_hand_review_post", {
    input_status: status,
    input_title: title,
    input_body: values.body || values.question || values.actionSummary || title,
    input_game_type: values.gameType || null,
    input_stakes_label: values.stakesLabel || null,
    input_hero_position: values.heroPosition || null,
    input_hero_cards: normalizedCards.heroCards.length === 2 ? normalizedCards.heroCards : null,
    input_board_flop: normalizedCards.boardFlop.length > 0 ? normalizedCards.boardFlop : null,
    input_board_turn: normalizedCards.boardTurn,
    input_board_river: normalizedCards.boardRiver,
    input_action_summary: values.actionSummary || null,
    input_question: values.question || null,
    input_result_summary: values.resultSummary || null,
  });

  if (error) {
    return {
      ...initialHandReviewActionState,
      status: "error",
      message: createWriteErrorMessage(error),
      submissionId: createSubmissionId(),
    };
  }

  revalidatePath("/create");
  revalidatePath("/create/hand-review");
  revalidatePath("/feed");
  revalidatePath("/mypage");

  return buildHandReviewSuccessState(
    status,
    status === "draft"
      ? "핸드리뷰 초안을 저장했습니다. 액션 흐름을 다듬은 뒤 게시할 수 있어요."
      : "핸드리뷰를 게시했습니다.",
  );
}
