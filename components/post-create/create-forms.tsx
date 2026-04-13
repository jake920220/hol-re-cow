"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { buildAuthRedirect } from "@/lib/auth/flow";
import {
  emptyFreePostValues,
  emptyHandReviewValues,
  freePostFieldLabels,
  getFreePostPublishErrors,
  getHandReviewDraftErrors,
  getHandReviewPublishErrors,
  handReviewFieldLabels,
  handReviewGameTypeOptions,
  hasFreePostDraftContent,
  hasHandReviewDraftContent,
  heroPositionOptions,
  initialFreePostActionState,
  initialHandReviewActionState,
  normalizeFreePostValues,
  normalizeHandReviewValues,
  type FieldErrors,
  type FreePostActionState,
  type FreePostField,
  type FreePostValues,
  type HandReviewActionState,
  type HandReviewField,
  type HandReviewValues,
  type PostCreateAccessState,
  type PostCreateIntent,
} from "@/lib/post-create/contracts";

type FreePostAction = (
  state: FreePostActionState,
  formData: FormData,
) => Promise<FreePostActionState>;

type HandReviewAction = (
  state: HandReviewActionState,
  formData: FormData,
) => Promise<HandReviewActionState>;

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.22em] text-tertiary uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-xl font-semibold text-on-surface">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-on-surface-variant">{description}</p>
    </div>
  );
}

function Notice({
  tone,
  children,
}: {
  tone: "error" | "success" | "info";
  children: ReactNode;
}) {
  const toneClassName = {
    error:
      "border-[rgba(255,180,171,0.28)] bg-[rgba(255,180,171,0.08)] text-[#ffd9d4]",
    success:
      "border-[rgba(149,212,179,0.26)] bg-[rgba(149,212,179,0.08)] text-primary",
    info: "border-outline-variant/40 bg-surface-low text-on-surface-variant",
  } as const;

  return (
    <div className={`rounded-[20px] border px-4 py-4 text-sm leading-6 ${toneClassName[tone]}`}>
      {children}
    </div>
  );
}

function FieldShell({
  label,
  name,
  helper,
  error,
  children,
}: {
  label: string;
  name: string;
  helper?: string;
  error?: string;
  children: ReactNode;
}) {
  const descriptionId = `${name}-description`;

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-on-surface">{label}</span>
      {children}
      {error ? (
        <span id={descriptionId} className="mt-2 block text-xs leading-5 text-[#ffd9d4]">
          {error}
        </span>
      ) : helper ? (
        <span id={descriptionId} className="mt-2 block text-xs leading-5 text-on-surface-variant">
          {helper}
        </span>
      ) : null}
    </label>
  );
}

function TextInput({
  label,
  name,
  value,
  placeholder,
  helper,
  error,
  onChange,
  onBlur,
  inputMode,
}: {
  label: string;
  name: string;
  value: string;
  placeholder: string;
  helper?: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <FieldShell label={label} name={name} helper={helper} error={error}>
      <input
        name={name}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className={`post-create-input ${error ? "post-create-input-error" : ""}`}
      />
    </FieldShell>
  );
}

function TextareaInput({
  label,
  name,
  value,
  placeholder,
  helper,
  error,
  onChange,
  onBlur,
  rows = 5,
}: {
  label: string;
  name: string;
  value: string;
  placeholder: string;
  helper?: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  rows?: number;
}) {
  return (
    <FieldShell label={label} name={name} helper={helper} error={error}>
      <textarea
        name={name}
        value={value}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className={`post-create-input post-create-textarea ${error ? "post-create-input-error" : ""}`}
      />
    </FieldShell>
  );
}

function SelectInput({
  label,
  name,
  value,
  error,
  helper,
  onChange,
  onBlur,
  options,
}: {
  label: string;
  name: string;
  value: string;
  error?: string;
  helper?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <FieldShell label={label} name={name} helper={helper} error={error}>
      <select
        name={name}
        value={value}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className={`post-create-input post-create-select ${error ? "post-create-input-error" : ""}`}
      >
        <option value="">선택해 주세요</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

function getFieldError<T extends string>(
  field: T,
  touched: Partial<Record<T, boolean>>,
  clientErrors: FieldErrors<T>,
  serverErrors: FieldErrors<T>,
  dirtySubmissionIds: Partial<Record<T, number>>,
  submissionId: number,
) {
  if (serverErrors[field] && dirtySubmissionIds[field] !== submissionId) {
    return serverErrors[field];
  }

  if (touched[field]) {
    return clientErrors[field];
  }

  return undefined;
}

function hasDirtyChangesSinceSubmission<T extends string>(
  dirtySubmissionIds: Partial<Record<T, number>>,
  submissionId: number,
) {
  if (submissionId === 0) {
    return false;
  }

  return Object.values(dirtySubmissionIds).some((value) => value === submissionId);
}

function SubmitButton({
  intent,
  pendingText,
  variant,
  children,
  disabled,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  intent: PostCreateIntent;
  pendingText: string;
  variant: "primary" | "secondary";
}) {
  const { pending, data } = useFormStatus();
  const submittedIntent = data?.get("intent");
  const currentIntent = typeof submittedIntent === "string" ? submittedIntent : null;
  const isPending = pending && currentIntent === intent;

  return (
    <button
      type="submit"
      name="intent"
      value={intent}
      disabled={disabled || pending}
      aria-disabled={disabled || pending}
      className={`post-create-submit-button ${
        variant === "primary"
          ? "post-create-submit-button-primary"
          : "post-create-submit-button-secondary"
      } ${className ?? ""}`}
      {...props}
    >
      {isPending ? pendingText : children}
    </button>
  );
}

function StatusCard({
  label,
  description,
  blockers,
}: {
  label: string;
  description: string;
  blockers: string[];
}) {
  return (
    <section className="rounded-[24px] border border-outline-variant/30 bg-surface-low px-5 py-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold tracking-[0.18em] text-tertiary uppercase">
          CTA 상태
        </p>
        <span className="rounded-full border border-outline-variant/40 bg-surface-high px-3 py-1 text-xs font-semibold text-on-surface">
          {label}
        </span>
      </div>
      <p className="mt-3 text-sm leading-7 text-on-surface-variant">{description}</p>
      {blockers.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {blockers.map((blocker) => (
            <span
              key={blocker}
              className="rounded-full border border-outline-variant/40 bg-surface-lowest px-3 py-1 text-xs text-on-surface-variant"
            >
              {blocker}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function FormFrame({
  currentPath,
  accessState,
  intro,
  children,
}: {
  currentPath: string;
  accessState: PostCreateAccessState;
  intro: string;
  children: ReactNode;
}) {
  const loginHref = buildAuthRedirect("/auth/login", {
    nextPath: currentPath,
  });

  return (
    <div className="space-y-5 pb-[calc(env(safe-area-inset-bottom)+172px)]">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/create"
          className="rounded-full border border-outline-variant/40 bg-surface-low px-4 py-2 text-xs font-semibold tracking-[0.18em] text-on-surface-variant uppercase transition hover:text-on-surface"
        >
          작성 타입 다시 선택
        </Link>
        {!accessState.isAuthenticated && accessState.envReady ? (
          <Link
            href={loginHref}
            className="rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-primary uppercase transition hover:border-primary/50"
          >
            로그인 후 계속
          </Link>
        ) : null}
      </div>

      <Notice tone="info">{intro}</Notice>

      {!accessState.envReady ? (
        <Notice tone="error">
          현재 서버에 Supabase 환경변수가 없어 작성 버튼을 잠가두었습니다. UI 흐름과
          필드 검증은 확인할 수 있지만 실제 저장은 환경 연결 이후에만 가능합니다.
        </Notice>
      ) : null}

      {accessState.envReady && !accessState.isAuthenticated ? (
        <Notice tone="info">
          작성은 로그인 이후 서버 액션에서만 처리됩니다. 필드 구조를 먼저 확인하고,
          로그인한 뒤 초안 저장 또는 게시를 진행해 주세요.
        </Notice>
      ) : null}

      {children}
    </div>
  );
}

export function FreePostForm({
  action,
  accessState,
  currentPath,
}: {
  action: FreePostAction;
  accessState: PostCreateAccessState;
  currentPath: string;
}) {
  const [state, formAction] = useActionState(action, initialFreePostActionState);
  const [values, setValues] = useState<FreePostValues>(emptyFreePostValues);
  const [touched, setTouched] = useState<Partial<Record<FreePostField, boolean>>>({});
  const [dirtySubmissionIds, setDirtySubmissionIds] = useState<
    Partial<Record<FreePostField, number>>
  >({});
  const normalizedValues = normalizeFreePostValues(values);
  const hasChangesSinceLastSubmission = hasDirtyChangesSinceSubmission(
    dirtySubmissionIds,
    state.submissionId,
  );

  const clientErrors = getFreePostPublishErrors(normalizedValues);
  const hasDraftContent = hasFreePostDraftContent(normalizedValues);
  const submissionLocked =
    state.status === "success" && !hasChangesSinceLastSubmission;
  const canDraft =
    accessState.envReady &&
    accessState.isAuthenticated &&
    hasDraftContent &&
    !submissionLocked;
  const canPublish =
    accessState.envReady &&
    accessState.isAuthenticated &&
    Object.keys(clientErrors).length === 0 &&
    !submissionLocked;

  const updateField = (field: FreePostField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setDirtySubmissionIds((current) => ({ ...current, [field]: state.submissionId }));
  };

  let statusLabel = "작성 불가";
  let statusDescription = "제목 또는 본문을 입력하면 초안 저장 버튼이 열립니다.";
  let blockers: string[] = ["제목 또는 본문"];

  if (!accessState.envReady) {
    statusDescription = "서버 연결 전이라 버튼이 잠겨 있습니다.";
    blockers = ["서버 연결 필요"];
  } else if (!accessState.isAuthenticated) {
    statusLabel = "로그인 필요";
    statusDescription = "로그인 후 서버 액션에서만 저장할 수 있습니다.";
    blockers = ["로그인 필요"];
  } else if (submissionLocked) {
    statusLabel = state.savedAs === "published" ? "게시 완료" : "초안 저장 완료";
    statusDescription =
      "같은 내용의 중복 저장을 막기 위해 버튼을 잠가두었습니다. 내용을 수정하면 다시 저장할 수 있습니다.";
    blockers = ["내용 수정 후 재저장 가능"];
  } else if (canPublish) {
    statusLabel = "제출 가능";
    statusDescription = "제목과 본문이 모두 준비되었습니다. 바로 게시하거나 초안으로 저장할 수 있어요.";
    blockers = [];
  } else if (hasDraftContent) {
    statusLabel = "초안 가능";
    statusDescription = "내용은 시작됐지만 게시에 필요한 필수 입력이 아직 남아 있습니다.";
    blockers = Object.keys(clientErrors).map(
      (field) => freePostFieldLabels[field as FreePostField],
    );
  }

  return (
    <FormFrame
      currentPath={currentPath}
      accessState={accessState}
      intro="자유글은 제목과 본문 중심의 단순한 흐름으로 유지하고, 저장 요청은 모두 서버 액션에서만 처리합니다."
    >
      <StatusCard
        label={statusLabel}
        description={statusDescription}
        blockers={blockers}
      />

      {state.message &&
      !(state.status === "success" && hasChangesSinceLastSubmission) ? (
        <Notice tone={state.status === "success" ? "success" : "error"}>
          {state.message}
        </Notice>
      ) : null}

      <form action={formAction} className="space-y-5">
        <section className="rounded-[28px] border border-outline-variant/30 bg-surface-container px-5 py-5">
          <SectionHeader
            eyebrow="Free Post"
            title="세션 후기나 전략 메모를 바로 남겨요"
            description="핸드리뷰보다 텍스트 읽기 흐름을 우선하고, 필수 입력은 제목과 본문 두 곳으로만 좁혔습니다."
          />

          <div className="mt-6 space-y-5">
            <TextInput
              label="제목"
              name="title"
              value={values.title}
              placeholder="예: 이번 주 세션 복기에서 바꾼 루틴"
              onChange={(value) => updateField("title", value)}
              onBlur={() => setTouched((current) => ({ ...current, title: true }))}
              error={getFieldError(
                "title",
                touched,
                clientErrors,
                state.fieldErrors,
                dirtySubmissionIds,
                state.submissionId,
              )}
            />

            <TextareaInput
              label="본문"
              name="body"
              value={values.body}
              rows={8}
              placeholder="세션 후기, 전략 메모, 커뮤니티 대화를 자유롭게 적어 주세요."
              onChange={(value) => updateField("body", value)}
              onBlur={() => setTouched((current) => ({ ...current, body: true }))}
              error={getFieldError(
                "body",
                touched,
                clientErrors,
                state.fieldErrors,
                dirtySubmissionIds,
                state.submissionId,
              )}
              helper="게시 버튼은 제목과 본문이 모두 있어야 열립니다."
            />
          </div>
        </section>

        <div className="post-create-cta-panel">
          <div className="rounded-[28px] border border-outline-variant/30 bg-surface/95 p-4 shadow-[0_-18px_40px_rgba(0,0,0,0.26)] backdrop-blur-md">
            <p className="text-xs font-semibold tracking-[0.18em] text-on-surface-variant uppercase">
              저장은 서버 액션에서만 처리됩니다.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <SubmitButton
                intent="draft"
                variant="secondary"
                pendingText="초안 저장 중..."
                disabled={!canDraft}
              >
                초안 저장
              </SubmitButton>
              <SubmitButton
                intent="publish"
                variant="primary"
                pendingText="게시 중..."
                disabled={!canPublish}
              >
                게시하기
              </SubmitButton>
            </div>
          </div>
        </div>
      </form>
    </FormFrame>
  );
}

export function HandReviewForm({
  action,
  accessState,
  currentPath,
}: {
  action: HandReviewAction;
  accessState: PostCreateAccessState;
  currentPath: string;
}) {
  const [state, formAction] = useActionState(action, initialHandReviewActionState);
  const [values, setValues] = useState<HandReviewValues>(emptyHandReviewValues);
  const [touched, setTouched] = useState<Partial<Record<HandReviewField, boolean>>>(
    {},
  );
  const [dirtySubmissionIds, setDirtySubmissionIds] = useState<
    Partial<Record<HandReviewField, number>>
  >({});
  const normalizedValues = normalizeHandReviewValues(values);
  const hasChangesSinceLastSubmission = hasDirtyChangesSinceSubmission(
    dirtySubmissionIds,
    state.submissionId,
  );

  const clientErrors = getHandReviewPublishErrors(normalizedValues);
  const draftErrors = getHandReviewDraftErrors(normalizedValues);
  const hasDraftContent = hasHandReviewDraftContent(normalizedValues);
  const submissionLocked =
    state.status === "success" && !hasChangesSinceLastSubmission;
  const canDraft =
    accessState.envReady &&
    accessState.isAuthenticated &&
    hasDraftContent &&
    Object.keys(draftErrors).length === 0 &&
    !submissionLocked;
  const canPublish =
    accessState.envReady &&
    accessState.isAuthenticated &&
    Object.keys(clientErrors).length === 0 &&
    !submissionLocked;

  const updateField = (field: HandReviewField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setDirtySubmissionIds((current) => ({ ...current, [field]: state.submissionId }));
  };

  let statusLabel = "작성 불가";
  let statusDescription = "한 칸이라도 입력하면 초안 저장 버튼이 열립니다.";
  let blockers: string[] = ["핵심 맥락 입력 필요"];

  if (!accessState.envReady) {
    statusDescription = "서버 연결 전이라 버튼이 잠겨 있습니다.";
    blockers = ["서버 연결 필요"];
  } else if (!accessState.isAuthenticated) {
    statusLabel = "로그인 필요";
    statusDescription = "로그인 후 서버 액션에서만 저장할 수 있습니다.";
    blockers = ["로그인 필요"];
  } else if (submissionLocked) {
    statusLabel = state.savedAs === "published" ? "리뷰 게시 완료" : "초안 저장 완료";
    statusDescription =
      "같은 핸드리뷰를 다시 저장하지 않도록 버튼을 잠가두었습니다. 내용을 수정하면 다음 저장이 다시 열립니다.";
    blockers = ["내용 수정 후 재저장 가능"];
  } else if (canPublish) {
    statusLabel = "제출 가능";
    statusDescription = "핸드의 핵심 맥락이 모두 준비되었습니다. 바로 게시하거나 초안으로 남길 수 있어요.";
    blockers = [];
  } else if (hasDraftContent) {
    statusLabel = "초안 가능";
    if (Object.keys(draftErrors).length > 0) {
      statusLabel = "작성 불가";
      statusDescription = "초안을 저장하기 전에 카드 형식과 보드 순서를 먼저 정리해 주세요.";
      blockers = Object.keys(draftErrors).map(
        (field) => handReviewFieldLabels[field as HandReviewField],
      );
    } else {
      statusDescription =
        "리뷰 요청을 시작했지만 게시에 필요한 필수 입력이 아직 남아 있습니다.";
      blockers = Object.keys(clientErrors).map(
        (field) => handReviewFieldLabels[field as HandReviewField],
      );
    }
  }

  return (
    <FormFrame
      currentPath={currentPath}
      accessState={accessState}
      intro="핸드리뷰는 구조화 입력과 자유 서술을 함께 다룹니다. posts와 hand_reviews 쓰기는 모두 서버 액션 안에서만 수행합니다."
    >
      <StatusCard
        label={statusLabel}
        description={statusDescription}
        blockers={blockers}
      />

      {state.message &&
      !(state.status === "success" && hasChangesSinceLastSubmission) ? (
        <Notice tone={state.status === "success" ? "success" : "error"}>
          {state.message}
        </Notice>
      ) : null}

      <form action={formAction} className="space-y-5">
        <section className="rounded-[28px] border border-outline-variant/30 bg-surface-container px-5 py-5">
          <SectionHeader
            eyebrow="Hand Review"
            title="핸드의 맥락을 먼저 잠그고 질문을 남겨요"
            description="게임 정보, 내 포지션, 핸드와 보드, 액션 흐름, 리뷰 질문을 한 화면 안에서 정리합니다."
          />

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <TextInput
              label="리뷰 제목"
              name="title"
              value={values.title}
              placeholder="예: 딥스택 4벳 팟 리버 결정을 검토하고 싶어요"
              onChange={(value) => updateField("title", value)}
              onBlur={() => setTouched((current) => ({ ...current, title: true }))}
              error={getFieldError(
                "title",
                touched,
                clientErrors,
                state.fieldErrors,
                dirtySubmissionIds,
                state.submissionId,
              )}
              helper="비워두면 포지션과 핸드를 기반으로 서버에서 기본 제목을 만듭니다."
            />

            <SelectInput
              label="게임 타입"
              name="gameType"
              value={values.gameType}
              options={handReviewGameTypeOptions.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              onChange={(value) => updateField("gameType", value)}
              onBlur={() => setTouched((current) => ({ ...current, gameType: true }))}
              error={getFieldError(
                "gameType",
                touched,
                clientErrors,
                state.fieldErrors,
                dirtySubmissionIds,
                state.submissionId,
              )}
            />

            <TextInput
              label="스테이크"
              name="stakesLabel"
              value={values.stakesLabel}
              placeholder="예: NL50 / 1-2"
              onChange={(value) => updateField("stakesLabel", value)}
              onBlur={() => setTouched((current) => ({ ...current, stakesLabel: true }))}
              error={getFieldError(
                "stakesLabel",
                touched,
                clientErrors,
                state.fieldErrors,
                dirtySubmissionIds,
                state.submissionId,
              )}
            />

            <SelectInput
              label="내 포지션"
              name="heroPosition"
              value={values.heroPosition}
              options={heroPositionOptions.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
              onChange={(value) => updateField("heroPosition", value)}
              onBlur={() => setTouched((current) => ({ ...current, heroPosition: true }))}
              error={getFieldError(
                "heroPosition",
                touched,
                clientErrors,
                state.fieldErrors,
                dirtySubmissionIds,
                state.submissionId,
              )}
            />
          </div>

          <div className="mt-5 space-y-5">
            <TextInput
              label="내 핸드"
              name="heroCards"
              value={values.heroCards}
              placeholder="예: Ah Kd"
              onChange={(value) => updateField("heroCards", value)}
              onBlur={() => setTouched((current) => ({ ...current, heroCards: true }))}
              error={getFieldError(
                "heroCards",
                touched,
                clientErrors,
                state.fieldErrors,
                dirtySubmissionIds,
                state.submissionId,
              )}
              helper="카드는 공백 또는 쉼표로 구분해 두 장 입력합니다."
            />

            <div className="grid gap-5 md:grid-cols-3">
              <TextInput
                label="플랍 보드"
                name="boardFlop"
                value={values.boardFlop}
                placeholder="예: Jc Ts 2d"
                onChange={(value) => updateField("boardFlop", value)}
                onBlur={() => setTouched((current) => ({ ...current, boardFlop: true }))}
                error={getFieldError(
                  "boardFlop",
                  touched,
                  clientErrors,
                  state.fieldErrors,
                  dirtySubmissionIds,
                  state.submissionId,
                )}
              />

              <TextInput
                label="턴 보드"
                name="boardTurn"
                value={values.boardTurn}
                placeholder="예: 8h"
                onChange={(value) => updateField("boardTurn", value)}
                onBlur={() => setTouched((current) => ({ ...current, boardTurn: true }))}
                error={getFieldError(
                  "boardTurn",
                  touched,
                  clientErrors,
                  state.fieldErrors,
                  dirtySubmissionIds,
                  state.submissionId,
                )}
              />

              <TextInput
                label="리버 보드"
                name="boardRiver"
                value={values.boardRiver}
                placeholder="예: Ac"
                onChange={(value) => updateField("boardRiver", value)}
                onBlur={() => setTouched((current) => ({ ...current, boardRiver: true }))}
                error={getFieldError(
                  "boardRiver",
                  touched,
                  clientErrors,
                  state.fieldErrors,
                  dirtySubmissionIds,
                  state.submissionId,
                )}
              />
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-outline-variant/30 bg-surface-container px-5 py-5">
          <SectionHeader
            eyebrow="Narrative"
            title="액션과 질문을 가까운 곳에서 정리해요"
            description="리뷰어가 바로 읽을 수 있도록 액션 흐름과 질문을 필드 근처에서 검증합니다."
          />

          <div className="mt-6 space-y-5">
            <TextareaInput
              label="액션 흐름"
              name="actionSummary"
              value={values.actionSummary}
              rows={6}
              placeholder="프리플랍, 플랍, 턴, 리버 액션을 간단히 순서대로 적어 주세요."
              onChange={(value) => updateField("actionSummary", value)}
              onBlur={() => setTouched((current) => ({ ...current, actionSummary: true }))}
              error={getFieldError(
                "actionSummary",
                touched,
                clientErrors,
                state.fieldErrors,
                dirtySubmissionIds,
                state.submissionId,
              )}
            />

            <TextareaInput
              label="리뷰 질문"
              name="question"
              value={values.question}
              rows={5}
              placeholder="무엇을 가장 검토받고 싶은지 한두 문장으로 적어 주세요."
              onChange={(value) => updateField("question", value)}
              onBlur={() => setTouched((current) => ({ ...current, question: true }))}
              error={getFieldError(
                "question",
                touched,
                clientErrors,
                state.fieldErrors,
                dirtySubmissionIds,
                state.submissionId,
              )}
            />

            <TextareaInput
              label="상황 설명"
              name="body"
              value={values.body}
              rows={5}
              placeholder="테이블 이미지, 상대 성향, 스택 흐름처럼 자유 서술이 필요한 맥락을 적어 주세요."
              onChange={(value) => updateField("body", value)}
              onBlur={() => setTouched((current) => ({ ...current, body: true }))}
              error={getFieldError(
                "body",
                touched,
                clientErrors,
                state.fieldErrors,
                dirtySubmissionIds,
                state.submissionId,
              )}
              helper="선택 입력입니다. 비워두면 리뷰 질문을 본문으로 함께 저장합니다."
            />

            <TextareaInput
              label="결과 요약"
              name="resultSummary"
              value={values.resultSummary}
              rows={4}
              placeholder="쇼다운, 폴드, 결과가 이미 나온 경우에만 적어 주세요."
              onChange={(value) => updateField("resultSummary", value)}
              onBlur={() => setTouched((current) => ({ ...current, resultSummary: true }))}
              error={getFieldError(
                "resultSummary",
                touched,
                clientErrors,
                state.fieldErrors,
                dirtySubmissionIds,
                state.submissionId,
              )}
            />
          </div>
        </section>

        <div className="post-create-cta-panel">
          <div className="rounded-[28px] border border-outline-variant/30 bg-surface/95 p-4 shadow-[0_-18px_40px_rgba(0,0,0,0.26)] backdrop-blur-md">
            <p className="text-xs font-semibold tracking-[0.18em] text-on-surface-variant uppercase">
              posts 와 hand_reviews 저장을 모두 서버 액션에서 처리합니다.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <SubmitButton
                intent="draft"
                variant="secondary"
                pendingText="초안 저장 중..."
                disabled={!canDraft}
              >
                초안 저장
              </SubmitButton>
              <SubmitButton
                intent="publish"
                variant="primary"
                pendingText="게시 중..."
                disabled={!canPublish}
              >
                리뷰 게시
              </SubmitButton>
            </div>
          </div>
        </div>
      </form>
    </FormFrame>
  );
}
