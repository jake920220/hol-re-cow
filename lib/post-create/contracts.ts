export const postCreateRouteByType = {
  hand_review: "/create/hand-review",
  free_post: "/create/free-post",
} as const;

export type PostCreateType = keyof typeof postCreateRouteByType;
export type PostCreateIntent = "draft" | "publish";
export type PostSaveStatus = "draft" | "published";
export type ActionStatus = "idle" | "success" | "error";

export type PostCreateAccessState = {
  envReady: boolean;
  isAuthenticated: boolean;
};

export type FieldErrors<T extends string> = Partial<Record<T, string>>;

type BaseActionState<T extends string> = {
  status: ActionStatus;
  message: string | null;
  savedAs: PostSaveStatus | null;
  fieldErrors: FieldErrors<T>;
  submissionId: number;
};

export type FreePostField = "title" | "body";

export type FreePostValues = {
  title: string;
  body: string;
};

export type FreePostActionState = BaseActionState<FreePostField>;

export const freePostFieldLabels: Record<FreePostField, string> = {
  title: "제목",
  body: "본문",
};

export const emptyFreePostValues: FreePostValues = {
  title: "",
  body: "",
};

export const initialFreePostActionState: FreePostActionState = {
  status: "idle",
  message: null,
  savedAs: null,
  fieldErrors: {},
  submissionId: 0,
};

export type HandReviewField =
  | "title"
  | "body"
  | "gameType"
  | "stakesLabel"
  | "heroPosition"
  | "heroCards"
  | "boardFlop"
  | "boardTurn"
  | "boardRiver"
  | "actionSummary"
  | "question"
  | "resultSummary";

export type HandReviewValues = {
  title: string;
  body: string;
  gameType: string;
  stakesLabel: string;
  heroPosition: string;
  heroCards: string;
  boardFlop: string;
  boardTurn: string;
  boardRiver: string;
  actionSummary: string;
  question: string;
  resultSummary: string;
};

export type HandReviewActionState = BaseActionState<HandReviewField>;

export const handReviewFieldLabels: Record<HandReviewField, string> = {
  title: "리뷰 제목",
  body: "상황 설명",
  gameType: "게임 타입",
  stakesLabel: "스테이크",
  heroPosition: "내 포지션",
  heroCards: "내 핸드",
  boardFlop: "플랍 보드",
  boardTurn: "턴 보드",
  boardRiver: "리버 보드",
  actionSummary: "액션 흐름",
  question: "리뷰 질문",
  resultSummary: "결과 요약",
};

export const emptyHandReviewValues: HandReviewValues = {
  title: "",
  body: "",
  gameType: "",
  stakesLabel: "",
  heroPosition: "",
  heroCards: "",
  boardFlop: "",
  boardTurn: "",
  boardRiver: "",
  actionSummary: "",
  question: "",
  resultSummary: "",
};

export const initialHandReviewActionState: HandReviewActionState = {
  status: "idle",
  message: null,
  savedAs: null,
  fieldErrors: {},
  submissionId: 0,
};

export const handReviewGameTypeOptions = [
  { value: "cash", label: "캐시 게임" },
  { value: "tournament", label: "토너먼트" },
] as const;

export const heroPositionOptions = [
  { value: "UTG", label: "UTG" },
  { value: "HJ", label: "HJ" },
  { value: "CO", label: "CO" },
  { value: "BTN", label: "BTN" },
  { value: "SB", label: "SB" },
  { value: "BB", label: "BB" },
] as const;

const gameTypeValues = new Set<string>(
  handReviewGameTypeOptions.map((option) => option.value),
);
const heroPositionValues = new Set<string>(
  heroPositionOptions.map((option) => option.value),
);
const cardPattern = /^(?:[2-9TJQKA]|10)[shdc]$/i;
const unicodeSuitMap: Record<string, string> = {
  "♠": "s",
  "♣": "c",
  "♥": "h",
  "♦": "d",
};
const duplicateCardErrorMessage = "중복된 카드는 입력할 수 없습니다.";

function normalizeValue(value: string) {
  return value.trim();
}

function readValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? normalizeValue(value) : "";
}

function splitCards(value: string) {
  return value
    .replace(/[♠♣♥♦]/g, (match) => unicodeSuitMap[match] ?? match)
    .split(/[\s,/]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function normalizeCardToken(token: string) {
  const normalized = token.replace(/[♠♣♥♦]/g, (match) => unicodeSuitMap[match] ?? match);
  const suit = normalized.slice(-1).toLowerCase();
  const rank = normalized.slice(0, -1).toUpperCase();
  const normalizedRank = rank === "10" ? "T" : rank;
  return `${normalizedRank}${suit}`;
}

function parseCardGroup(value: string, expectedCount?: number) {
  const tokens = splitCards(value);

  if (tokens.length === 0) {
    return {
      cards: [] as string[],
      error: expectedCount ? `카드를 ${expectedCount}장 입력해 주세요.` : null,
    };
  }

  if (expectedCount && tokens.length !== expectedCount) {
    return {
      cards: [] as string[],
      error: `카드를 ${expectedCount}장 입력해 주세요.`,
    };
  }

  const normalizedCards = tokens.map(normalizeCardToken);
  const invalidCard = normalizedCards.find((card) => !cardPattern.test(card));

  if (invalidCard) {
    return {
      cards: [] as string[],
      error: "`As`, `Kd` 같은 형식으로 입력해 주세요.",
    };
  }

  return {
    cards: normalizedCards,
    error: null,
  };
}

function createEmptyCardGroup() {
  return {
    cards: [] as string[],
    error: null as string | null,
  };
}

function parseHandReviewCardGroups(values: HandReviewValues) {
  return {
    heroCards: values.heroCards ? parseCardGroup(values.heroCards, 2) : createEmptyCardGroup(),
    boardFlop: values.boardFlop ? parseCardGroup(values.boardFlop, 3) : createEmptyCardGroup(),
    boardTurn: values.boardTurn ? parseCardGroup(values.boardTurn, 1) : createEmptyCardGroup(),
    boardRiver: values.boardRiver ? parseCardGroup(values.boardRiver, 1) : createEmptyCardGroup(),
  };
}

function getDuplicateCardFields(
  parsedCards: ReturnType<typeof parseHandReviewCardGroups>,
): HandReviewField[] {
  const cardToFields = new Map<string, HandReviewField[]>();

  const appendCards = (field: HandReviewField, cards: string[]) => {
    cards.forEach((card) => {
      const fields = cardToFields.get(card) ?? [];
      fields.push(field);
      cardToFields.set(card, fields);
    });
  };

  appendCards("heroCards", parsedCards.heroCards.cards);
  appendCards("boardFlop", parsedCards.boardFlop.cards);
  appendCards("boardTurn", parsedCards.boardTurn.cards);
  appendCards("boardRiver", parsedCards.boardRiver.cards);

  const duplicateFields = new Set<HandReviewField>();

  cardToFields.forEach((fields) => {
    if (fields.length > 1) {
      fields.forEach((field) => duplicateFields.add(field));
    }
  });

  return Array.from(duplicateFields);
}

export function readIntent(formData: FormData): PostCreateIntent {
  return formData.get("intent") === "draft" ? "draft" : "publish";
}

export function readFreePostValues(formData: FormData): FreePostValues {
  return {
    title: readValue(formData, "title"),
    body: readValue(formData, "body"),
  };
}

function normalizeFreePostValues(values: FreePostValues): FreePostValues {
  return {
    title: normalizeValue(values.title),
    body: normalizeValue(values.body),
  };
}

export function hasFreePostDraftContent(values: FreePostValues) {
  const normalizedValues = normalizeFreePostValues(values);
  return Boolean(normalizedValues.title || normalizedValues.body);
}

export function getFreePostPublishErrors(values: FreePostValues): FieldErrors<FreePostField> {
  const normalizedValues = normalizeFreePostValues(values);
  const errors: FieldErrors<FreePostField> = {};

  if (!normalizedValues.title) {
    errors.title = "제목을 입력해 주세요.";
  }

  if (!normalizedValues.body) {
    errors.body = "본문을 입력해 주세요.";
  }

  return errors;
}

export function getFreePostDraftError(values: FreePostValues) {
  return hasFreePostDraftContent(values)
    ? null
    : "초안 저장을 시작하려면 제목 또는 본문을 먼저 입력해 주세요.";
}

export function readHandReviewValues(formData: FormData): HandReviewValues {
  return {
    title: readValue(formData, "title"),
    body: readValue(formData, "body"),
    gameType: readValue(formData, "gameType"),
    stakesLabel: readValue(formData, "stakesLabel"),
    heroPosition: readValue(formData, "heroPosition"),
    heroCards: readValue(formData, "heroCards"),
    boardFlop: readValue(formData, "boardFlop"),
    boardTurn: readValue(formData, "boardTurn"),
    boardRiver: readValue(formData, "boardRiver"),
    actionSummary: readValue(formData, "actionSummary"),
    question: readValue(formData, "question"),
    resultSummary: readValue(formData, "resultSummary"),
  };
}

function normalizeHandReviewValues(values: HandReviewValues): HandReviewValues {
  return {
    title: normalizeValue(values.title),
    body: normalizeValue(values.body),
    gameType: normalizeValue(values.gameType),
    stakesLabel: normalizeValue(values.stakesLabel),
    heroPosition: normalizeValue(values.heroPosition),
    heroCards: normalizeValue(values.heroCards),
    boardFlop: normalizeValue(values.boardFlop),
    boardTurn: normalizeValue(values.boardTurn),
    boardRiver: normalizeValue(values.boardRiver),
    actionSummary: normalizeValue(values.actionSummary),
    question: normalizeValue(values.question),
    resultSummary: normalizeValue(values.resultSummary),
  };
}

export function hasHandReviewDraftContent(values: HandReviewValues) {
  return Object.values(normalizeHandReviewValues(values)).some(Boolean);
}

export function getHandReviewDraftErrors(
  values: HandReviewValues,
): FieldErrors<HandReviewField> {
  const normalizedValues = normalizeHandReviewValues(values);
  const errors: FieldErrors<HandReviewField> = {};
  const parsedCards = parseHandReviewCardGroups(normalizedValues);

  if (normalizedValues.gameType && !gameTypeValues.has(normalizedValues.gameType)) {
    errors.gameType = "게임 타입을 다시 선택해 주세요.";
  }

  if (normalizedValues.heroPosition && !heroPositionValues.has(normalizedValues.heroPosition)) {
    errors.heroPosition = "포지션을 다시 선택해 주세요.";
  }

  if (normalizedValues.heroCards) {
    if (parsedCards.heroCards.error) {
      errors.heroCards = parsedCards.heroCards.error;
    }
  }

  if (normalizedValues.boardTurn && !normalizedValues.boardFlop) {
    errors.boardFlop = "턴 카드를 적기 전에 플랍 보드를 먼저 입력해 주세요.";
  }

  if (normalizedValues.boardRiver && !normalizedValues.boardTurn) {
    errors.boardTurn = "리버 카드를 적기 전에 턴 카드를 먼저 입력해 주세요.";
  }

  if (normalizedValues.boardFlop) {
    if (parsedCards.boardFlop.error) {
      errors.boardFlop = "플랍 보드는 카드 3장으로 입력해 주세요.";
    }
  }

  if (normalizedValues.boardTurn) {
    if (parsedCards.boardTurn.error) {
      errors.boardTurn = "턴 카드는 1장만 입력해 주세요.";
    }
  }

  if (normalizedValues.boardRiver) {
    if (parsedCards.boardRiver.error) {
      errors.boardRiver = "리버 카드는 1장만 입력해 주세요.";
    }
  }

  if (
    !parsedCards.heroCards.error &&
    !parsedCards.boardFlop.error &&
    !parsedCards.boardTurn.error &&
    !parsedCards.boardRiver.error
  ) {
    getDuplicateCardFields(parsedCards).forEach((field) => {
      errors[field] ??= duplicateCardErrorMessage;
    });
  }

  return errors;
}

export function getHandReviewPublishErrors(
  values: HandReviewValues,
): FieldErrors<HandReviewField> {
  const normalizedValues = normalizeHandReviewValues(values);
  const errors: FieldErrors<HandReviewField> = {
    ...getHandReviewDraftErrors(normalizedValues),
  };

  if (!gameTypeValues.has(normalizedValues.gameType)) {
    errors.gameType = "게임 타입을 선택해 주세요.";
  }

  if (!heroPositionValues.has(normalizedValues.heroPosition)) {
    errors.heroPosition = "내 포지션을 선택해 주세요.";
  }

  if (!normalizedValues.actionSummary) {
    errors.actionSummary = "액션 흐름을 입력해 주세요.";
  }

  if (!normalizedValues.question) {
    errors.question = "리뷰 질문을 입력해 주세요.";
  }

  if (!normalizedValues.heroCards) {
    errors.heroCards = "카드를 2장 입력해 주세요.";
  }

  return errors;
}

export function getHandReviewDraftError(values: HandReviewValues) {
  if (!hasHandReviewDraftContent(values)) {
    return "초안 저장을 시작하려면 한 칸이라도 먼저 입력해 주세요.";
  }

  return Object.keys(getHandReviewDraftErrors(values)).length > 0
    ? "카드 형식, 중복 여부, 보드 순서를 먼저 확인해 주세요."
    : null;
}

export function normalizeHandReviewCards(values: HandReviewValues) {
  const parsedCards = parseHandReviewCardGroups(normalizeHandReviewValues(values));

  return {
    heroCards: parsedCards.heroCards.cards,
    boardFlop: parsedCards.boardFlop.cards,
    boardTurn: parsedCards.boardTurn.cards[0] ?? null,
    boardRiver: parsedCards.boardRiver.cards[0] ?? null,
  };
}
