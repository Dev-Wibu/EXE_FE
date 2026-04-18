const SESSION_PAID_STATUS_SYNC_STORAGE_KEY = "inblue.session-paid-status-sync.v1";
const SESSION_PAID_STATUS_MAX_AGE_MS = 1000 * 60 * 60 * 4;

export interface PendingSessionPaidStatusSync {
  sessionId: number;
  userId: number;
  transactionCode?: string;
  createdAt: string;
  updatedAt: string;
  retryCount: number;
}

interface UpsertPendingSessionPaidStatusSyncInput {
  sessionId: number;
  userId: number;
  transactionCode?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const asOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
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

const toMs = (value?: string): number => {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parsePendingItem = (value: unknown): PendingSessionPaidStatusSync | null => {
  if (!isRecord(value)) {
    return null;
  }

  const sessionId = asOptionalNumber(value.sessionId);
  const userId = asOptionalNumber(value.userId);
  const createdAt = asOptionalString(value.createdAt);
  const updatedAt = asOptionalString(value.updatedAt);
  const retryCount = asOptionalNumber(value.retryCount);

  if (!sessionId || !userId || !createdAt || !updatedAt || retryCount === undefined) {
    return null;
  }

  if (Date.now() - toMs(updatedAt) > SESSION_PAID_STATUS_MAX_AGE_MS) {
    return null;
  }

  return {
    sessionId,
    userId,
    transactionCode: asOptionalString(value.transactionCode),
    createdAt,
    updatedAt,
    retryCount: Math.max(Math.trunc(retryCount), 0),
  };
};

const readPendingList = (): PendingSessionPaidStatusSync[] => {
  try {
    const raw = localStorage.getItem(SESSION_PAID_STATUS_SYNC_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(parsePendingItem)
      .filter((item): item is PendingSessionPaidStatusSync => !!item)
      .sort((a, b) => toMs(b.updatedAt) - toMs(a.updatedAt));
  } catch {
    return [];
  }
};

const writePendingList = (list: PendingSessionPaidStatusSync[]): void => {
  localStorage.setItem(SESSION_PAID_STATUS_SYNC_STORAGE_KEY, JSON.stringify(list));
};

const matchPending = (
  item: PendingSessionPaidStatusSync,
  sessionId: number,
  userId: number
): boolean => {
  return item.sessionId === sessionId && item.userId === userId;
};

export const getPendingSessionPaidStatusSync = (
  sessionId: number,
  userId: number
): PendingSessionPaidStatusSync | null => {
  const sessionIdNum = Math.trunc(sessionId);
  const userIdNum = Math.trunc(userId);
  if (
    !Number.isFinite(sessionIdNum) ||
    !Number.isFinite(userIdNum) ||
    sessionIdNum <= 0 ||
    userIdNum <= 0
  ) {
    return null;
  }

  const list = readPendingList();
  const found = list.find((item) => matchPending(item, sessionIdNum, userIdNum)) || null;

  if (list.length > 0) {
    writePendingList(list);
  }

  return found;
};

export const upsertPendingSessionPaidStatusSync = (
  input: UpsertPendingSessionPaidStatusSyncInput
): PendingSessionPaidStatusSync => {
  const sessionId = Math.trunc(input.sessionId);
  const userId = Math.trunc(input.userId);
  const now = new Date().toISOString();

  const list = readPendingList();
  const existing = list.find((item) => matchPending(item, sessionId, userId));

  const nextItem: PendingSessionPaidStatusSync = existing
    ? {
        ...existing,
        transactionCode: input.transactionCode || existing.transactionCode,
        updatedAt: now,
      }
    : {
        sessionId,
        userId,
        transactionCode: input.transactionCode,
        createdAt: now,
        updatedAt: now,
        retryCount: 0,
      };

  const nextList = [nextItem, ...list.filter((item) => !matchPending(item, sessionId, userId))];

  writePendingList(nextList);
  return nextItem;
};

export const markPendingSessionPaidStatusSyncRetried = (
  sessionId: number,
  userId: number
): PendingSessionPaidStatusSync | null => {
  const sessionIdNum = Math.trunc(sessionId);
  const userIdNum = Math.trunc(userId);
  const now = new Date().toISOString();

  const list = readPendingList();
  const existing = list.find((item) => matchPending(item, sessionIdNum, userIdNum));

  if (!existing) {
    return null;
  }

  const updatedItem: PendingSessionPaidStatusSync = {
    ...existing,
    retryCount: existing.retryCount + 1,
    updatedAt: now,
  };

  const nextList = [
    updatedItem,
    ...list.filter((item) => !matchPending(item, sessionIdNum, userIdNum)),
  ];

  writePendingList(nextList);
  return updatedItem;
};

export const clearPendingSessionPaidStatusSync = (sessionId: number, userId: number): void => {
  const sessionIdNum = Math.trunc(sessionId);
  const userIdNum = Math.trunc(userId);

  const list = readPendingList();
  const nextList = list.filter((item) => !matchPending(item, sessionIdNum, userIdNum));

  if (nextList.length === 0) {
    localStorage.removeItem(SESSION_PAID_STATUS_SYNC_STORAGE_KEY);
    return;
  }

  writePendingList(nextList);
};

export const canRetryPendingSessionPaidStatusSync = (
  context: PendingSessionPaidStatusSync,
  options?: { maxRetryCount?: number; minRetryIntervalMs?: number }
): boolean => {
  const maxRetryCount = Math.max(Math.trunc(options?.maxRetryCount ?? 8), 1);
  const minRetryIntervalMs = Math.max(Math.trunc(options?.minRetryIntervalMs ?? 4000), 0);

  if (context.retryCount >= maxRetryCount) {
    return false;
  }

  if (Date.now() - toMs(context.updatedAt) < minRetryIntervalMs) {
    return false;
  }

  return true;
};
