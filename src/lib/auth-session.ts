const JWT_SEGMENT_COUNT = 3;

function decodeBase64Url(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return atob(padded);
  } catch {
    return null;
  }
}

export function getTokenExpiresAt(token: string | null | undefined): number | null {
  if (!token) {
    return null;
  }

  const normalizedToken = token.replace(/^Bearer\s+/i, "").trim();
  const parts = normalizedToken.split(".");

  if (parts.length < JWT_SEGMENT_COUNT) {
    return Date.now();
  }

  const payloadJson = decodeBase64Url(parts[1]);
  if (!payloadJson) {
    return Date.now();
  }

  try {
    const payload = JSON.parse(payloadJson) as { exp?: unknown };
    if (typeof payload.exp === "number" && Number.isFinite(payload.exp)) {
      return payload.exp * 1000;
    }

    return Date.now();
  } catch {
    return Date.now();
  }
}

export function isSessionExpired(
  expiresAt: number | null | undefined,
  now: number = Date.now()
): boolean {
  if (typeof expiresAt !== "number" || !Number.isFinite(expiresAt)) {
    return false;
  }

  return now >= expiresAt;
}
