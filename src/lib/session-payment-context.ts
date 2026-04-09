import { extractOrderCodeFromUrl } from "./payment-recovery";

const SESSION_PAYMENT_STORAGE_KEY = "inblue.session-payment.pending";
const SESSION_PAYMENT_MAX_AGE_MS = 1000 * 60 * 60 * 2;

export interface SessionPaymentContext {
  sessionId: number;
  userId?: number;
  checkoutUrl?: string;
  orderCode?: string;
  createdAt: string;
}

interface SaveSessionPaymentInput {
  sessionId: number;
  userId?: number;
  checkoutUrl?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const asOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const asOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const parseContext = (value: unknown): SessionPaymentContext | null => {
  if (!isRecord(value)) {
    return null;
  }

  const sessionId = asOptionalNumber(value.sessionId);
  const createdAt = asOptionalString(value.createdAt);

  if (!sessionId || !createdAt) {
    return null;
  }

  const createdAtMs = Date.parse(createdAt);
  if (!Number.isFinite(createdAtMs)) {
    return null;
  }

  if (Date.now() - createdAtMs > SESSION_PAYMENT_MAX_AGE_MS) {
    return null;
  }

  return {
    sessionId,
    userId: asOptionalNumber(value.userId),
    checkoutUrl: asOptionalString(value.checkoutUrl),
    orderCode: asOptionalString(value.orderCode),
    createdAt,
  };
};

export const savePendingSessionPaymentContext = (
  input: SaveSessionPaymentInput
): SessionPaymentContext => {
  const checkoutUrl = input.checkoutUrl?.trim();
  const context: SessionPaymentContext = {
    sessionId: Number(input.sessionId),
    userId: input.userId,
    checkoutUrl,
    orderCode: checkoutUrl ? extractOrderCodeFromUrl(checkoutUrl) || undefined : undefined,
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(SESSION_PAYMENT_STORAGE_KEY, JSON.stringify(context));
  return context;
};

export const getPendingSessionPaymentContext = (
  currentUserId?: number
): SessionPaymentContext | null => {
  try {
    const raw = localStorage.getItem(SESSION_PAYMENT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = parseContext(JSON.parse(raw));
    if (!parsed) {
      localStorage.removeItem(SESSION_PAYMENT_STORAGE_KEY);
      return null;
    }

    if (currentUserId && parsed.userId && parsed.userId !== currentUserId) {
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(SESSION_PAYMENT_STORAGE_KEY);
    return null;
  }
};

export const clearPendingSessionPaymentContext = (): void => {
  localStorage.removeItem(SESSION_PAYMENT_STORAGE_KEY);
};
