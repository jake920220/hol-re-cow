export type AuthNoticeTone = "error" | "success" | "info";

export type AuthNotice = {
  tone: AuthNoticeTone;
  message: string;
};

export type AuthPageState = {
  notice: AuthNotice | null;
  email: string;
  displayName: string;
  handle: string;
  nextPath: string;
};

type SearchValue = string | string[] | undefined;

type SearchParamsShape = Record<string, SearchValue>;

function firstValue(value: SearchValue) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export function sanitizeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/mypage";
  }

  return value;
}

export function buildAuthRedirect(
  pathname: string,
  {
    tone,
    message,
    nextPath,
    email,
    displayName,
    handle,
  }: {
    tone?: AuthNoticeTone;
    message?: string;
    nextPath?: string;
    email?: string;
    displayName?: string;
    handle?: string;
  } = {},
) {
  const params = new URLSearchParams();

  if (tone && message) {
    params.set("tone", tone);
    params.set("message", message);
  }

  if (nextPath) {
    params.set("next", sanitizeNextPath(nextPath));
  }

  if (email) {
    params.set("email", email);
  }

  if (displayName) {
    params.set("displayName", displayName);
  }

  if (handle) {
    params.set("handle", handle);
  }

  const query = params.toString();

  return query ? `${pathname}?${query}` : pathname;
}

export function parseAuthPageState(searchParams: SearchParamsShape): AuthPageState {
  const tone = firstValue(searchParams.tone);
  const message = firstValue(searchParams.message);

  return {
    notice:
      (tone === "error" || tone === "success" || tone === "info") && message
        ? { tone, message }
        : null,
    email: firstValue(searchParams.email),
    displayName: firstValue(searchParams.displayName),
    handle: firstValue(searchParams.handle),
    nextPath: sanitizeNextPath(firstValue(searchParams.next)),
  };
}
