import type { PaymentPurpose } from "@/interfaces";

type PaymentRecoveryStorageRecord = {
  id: string;
  supportCode: string;
  orderCode?: string;
  transactionCode?: string;
  checkoutToken?: string;
  userId: number;
  planId?: number;
  planName?: string;
  amount?: number;
  paymentPurpose?: PaymentPurpose;
  sessionId?: number;
  checkoutUrl?: string;
  status: PaymentRecoveryStatus;
  note?: string;
  errorCode?: string;
  createdAt: string;
  updatedAt: string;
};

type PaymentSupportLogStorageRecord = {
  id: string;
  supportCode: string;
  orderCode?: string;
  transactionCode?: string;
  checkoutToken?: string;
  userId?: number;
  planId?: number;
  planName?: string;
  amount?: number;
  paymentPurpose?: PaymentPurpose;
  sessionId?: number;
  status: PaymentRecoveryStatus;
  message: string;
  payload?: Record<string, unknown>;
  createdAt: string;
};

export type PaymentRecoveryStatus =
  | "CREATED"
  | "CREATE_FAILED"
  | "REDIRECTED"
  | "CALLBACK_SUCCESS"
  | "CALLBACK_CANCEL"
  | "UNMAPPED_ORDER"
  | "SUBSCRIBE_SUCCESS"
  | "SUBSCRIBE_FAILED"
  | "CANCEL_CHAIN_SUCCESS"
  | "CANCEL_CHAIN_FAILED";

export type PaymentRecoveryContext = PaymentRecoveryStorageRecord;
export type PaymentSupportLog = PaymentSupportLogStorageRecord;

export interface UpsertPaymentRecoveryInput {
  supportCode?: string;
  orderCode?: string;
  transactionCode?: string;
  checkoutToken?: string;
  userId: number;
  planId?: number;
  planName?: string;
  amount?: number;
  paymentPurpose?: PaymentPurpose;
  sessionId?: number;
  checkoutUrl?: string;
  status: PaymentRecoveryStatus;
  note?: string;
  errorCode?: string;
}

export interface AddPaymentSupportLogInput {
  supportCode?: string;
  orderCode?: string;
  transactionCode?: string;
  checkoutToken?: string;
  userId?: number;
  planId?: number;
  planName?: string;
  amount?: number;
  paymentPurpose?: PaymentPurpose;
  sessionId?: number;
  status: PaymentRecoveryStatus;
  message: string;
  payload?: Record<string, unknown>;
}

const PAYMENT_RECOVERY_STORAGE_KEY = "inblue.payment.recovery-contexts.v1";
const PAYMENT_SUPPORT_LOG_STORAGE_KEY = "inblue.payment.support-logs.v1";
const PAYMENT_RECOVERY_RETENTION_MS = 24 * 60 * 60 * 1000;

const nowIso = () => new Date().toISOString();

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const asString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const asNumber = (value: unknown): number | undefined => {
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

const asStatus = (value: unknown): PaymentRecoveryStatus | undefined => {
  const normalized = asString(value);
  if (!normalized) {
    return undefined;
  }

  const allow: PaymentRecoveryStatus[] = [
    "CREATED",
    "CREATE_FAILED",
    "REDIRECTED",
    "CALLBACK_SUCCESS",
    "CALLBACK_CANCEL",
    "UNMAPPED_ORDER",
    "SUBSCRIBE_SUCCESS",
    "SUBSCRIBE_FAILED",
    "CANCEL_CHAIN_SUCCESS",
    "CANCEL_CHAIN_FAILED",
  ];

  return allow.includes(normalized as PaymentRecoveryStatus)
    ? (normalized as PaymentRecoveryStatus)
    : undefined;
};

const asPaymentPurpose = (value: unknown): PaymentPurpose | undefined => {
  const normalized = asString(value);
  if (!normalized) {
    return undefined;
  }

  const allow: PaymentPurpose[] = ["BUY_MEMBERSHIP", "MENTOR_INTERVIEW"];

  return allow.includes(normalized as PaymentPurpose) ? (normalized as PaymentPurpose) : undefined;
};

const safeReadJson = <T>(storageKey: string): T | null => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const safeWriteJson = (storageKey: string, value: unknown): void => {
  localStorage.setItem(storageKey, JSON.stringify(value));
};

const parseRecoveryRecord = (value: unknown): PaymentRecoveryStorageRecord | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = asString(value.id);
  const supportCode = asString(value.supportCode);
  const userId = asNumber(value.userId);
  const status = asStatus(value.status);
  const createdAt = asString(value.createdAt);
  const updatedAt = asString(value.updatedAt);

  if (!id || !supportCode || !userId || !status || !createdAt || !updatedAt) {
    return null;
  }

  return {
    id,
    supportCode,
    orderCode: asString(value.orderCode),
    transactionCode: asString(value.transactionCode),
    checkoutToken: asString(value.checkoutToken),
    userId,
    planId: asNumber(value.planId),
    planName: asString(value.planName),
    amount: asNumber(value.amount),
    paymentPurpose: asPaymentPurpose(value.paymentPurpose),
    sessionId: asNumber(value.sessionId),
    checkoutUrl: asString(value.checkoutUrl),
    status,
    note: asString(value.note),
    errorCode: asString(value.errorCode),
    createdAt,
    updatedAt,
  };
};

const parseSupportLogRecord = (value: unknown): PaymentSupportLogStorageRecord | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = asString(value.id);
  const supportCode = asString(value.supportCode);
  const status = asStatus(value.status);
  const message = asString(value.message);
  const createdAt = asString(value.createdAt);

  if (!id || !supportCode || !status || !message || !createdAt) {
    return null;
  }

  return {
    id,
    supportCode,
    orderCode: asString(value.orderCode),
    transactionCode: asString(value.transactionCode),
    checkoutToken: asString(value.checkoutToken),
    userId: asNumber(value.userId),
    planId: asNumber(value.planId),
    planName: asString(value.planName),
    amount: asNumber(value.amount),
    paymentPurpose: asPaymentPurpose(value.paymentPurpose),
    sessionId: asNumber(value.sessionId),
    status,
    message,
    payload: isRecord(value.payload) ? value.payload : undefined,
    createdAt,
  };
};

const toMs = (dateIso?: string): number => {
  if (!dateIso) {
    return 0;
  }

  const parsed = Date.parse(dateIso);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isExpired = (updatedAt: string): boolean => {
  const updatedMs = toMs(updatedAt);
  if (updatedMs <= 0) {
    return true;
  }
  return Date.now() - updatedMs > PAYMENT_RECOVERY_RETENTION_MS;
};

const readRecoveryRecords = (): PaymentRecoveryStorageRecord[] => {
  const parsed = safeReadJson<unknown>(PAYMENT_RECOVERY_STORAGE_KEY);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map(parseRecoveryRecord)
    .filter((item): item is PaymentRecoveryStorageRecord => !!item)
    .filter((item) => !isExpired(item.updatedAt))
    .sort((a, b) => toMs(b.updatedAt) - toMs(a.updatedAt));
};

const writeRecoveryRecords = (records: PaymentRecoveryStorageRecord[]): void => {
  safeWriteJson(PAYMENT_RECOVERY_STORAGE_KEY, records);
};

const readSupportLogRecords = (): PaymentSupportLogStorageRecord[] => {
  const parsed = safeReadJson<unknown>(PAYMENT_SUPPORT_LOG_STORAGE_KEY);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map(parseSupportLogRecord)
    .filter((item): item is PaymentSupportLogStorageRecord => !!item)
    .filter((item) => !isExpired(item.createdAt))
    .sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
};

const writeSupportLogRecords = (records: PaymentSupportLogStorageRecord[]): void => {
  safeWriteJson(PAYMENT_SUPPORT_LOG_STORAGE_KEY, records);
};

const newId = (): string => {
  return `PAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
};

export const createSupportCode = (orderCode?: string): string => {
  const normalized = asString(orderCode);
  if (!normalized) {
    return `SUP-${Date.now().toString(36).toUpperCase()}`;
  }

  const suffix = normalized.slice(-6).toUpperCase();
  return `SUP-${suffix}-${Date.now().toString(36).toUpperCase()}`;
};

export const extractOrderCodeFromUrl = (checkoutUrl: string): string | null => {
  try {
    const url = new URL(checkoutUrl, window.location.origin);
    const fromQuery =
      asString(url.searchParams.get("orderCode")) || asString(url.searchParams.get("order_code"));
    if (fromQuery) {
      return fromQuery;
    }

    return null;
  } catch {
    return null;
  }
};

export const extractTransactionCodeFromUrl = (checkoutUrl: string): string | null => {
  try {
    const url = new URL(checkoutUrl, window.location.origin);
    const fromQuery =
      asString(url.searchParams.get("transactionCode")) ||
      asString(url.searchParams.get("transaction_code"));

    return fromQuery || null;
  } catch {
    return null;
  }
};

export const extractCheckoutTokenFromUrl = (checkoutUrl: string): string | null => {
  try {
    const url = new URL(checkoutUrl, window.location.origin);
    const fromQuery =
      asString(url.searchParams.get("id")) ||
      asString(url.searchParams.get("checkoutId")) ||
      asString(url.searchParams.get("checkout_id"));

    if (fromQuery) {
      return fromQuery;
    }

    const segments = url.pathname
      .split("/")
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0);

    if (segments.length === 0) {
      return null;
    }

    return asString(segments[segments.length - 1]) || null;
  } catch {
    return null;
  }
};

export const upsertPaymentRecoveryContext = (
  input: UpsertPaymentRecoveryInput
): PaymentRecoveryContext => {
  const records = readRecoveryRecords();

  const normalizedOrderCode = asString(input.orderCode);
  const normalizedTransactionCode = asString(input.transactionCode);
  const normalizedCheckoutToken =
    asString(input.checkoutToken) ||
    (input.checkoutUrl ? extractCheckoutTokenFromUrl(input.checkoutUrl) || undefined : undefined);

  let targetIndex = -1;

  if (input.supportCode) {
    targetIndex = records.findIndex((item) => item.supportCode === input.supportCode);
  }

  if (targetIndex < 0 && normalizedOrderCode) {
    targetIndex = records.findIndex(
      (item) => item.orderCode === normalizedOrderCode && item.userId === input.userId
    );
  }

  if (targetIndex < 0 && normalizedTransactionCode) {
    targetIndex = records.findIndex(
      (item) => item.transactionCode === normalizedTransactionCode && item.userId === input.userId
    );
  }

  if (targetIndex < 0 && normalizedCheckoutToken) {
    targetIndex = records.findIndex(
      (item) => item.checkoutToken === normalizedCheckoutToken && item.userId === input.userId
    );
  }

  if (
    targetIndex < 0 &&
    input.paymentPurpose === "MENTOR_INTERVIEW" &&
    Number.isFinite(input.sessionId) &&
    (input.sessionId || 0) > 0
  ) {
    targetIndex = records.findIndex(
      (item) =>
        item.userId === input.userId &&
        item.paymentPurpose === "MENTOR_INTERVIEW" &&
        item.sessionId === input.sessionId
    );
  }

  const timestamp = nowIso();
  if (targetIndex >= 0) {
    const prev = records[targetIndex];
    const next: PaymentRecoveryStorageRecord = {
      ...prev,
      orderCode: normalizedOrderCode || prev.orderCode,
      transactionCode: normalizedTransactionCode || prev.transactionCode,
      checkoutToken: normalizedCheckoutToken || prev.checkoutToken,
      userId: input.userId,
      planId: input.planId ?? prev.planId,
      planName: input.planName || prev.planName,
      amount: input.amount ?? prev.amount,
      paymentPurpose: input.paymentPurpose || prev.paymentPurpose,
      sessionId: input.sessionId ?? prev.sessionId,
      checkoutUrl: input.checkoutUrl || prev.checkoutUrl,
      status: input.status,
      note: input.note || prev.note,
      errorCode: input.errorCode || prev.errorCode,
      updatedAt: timestamp,
    };

    const merged = [next, ...records.filter((_, index) => index !== targetIndex)];
    writeRecoveryRecords(merged);
    return next;
  }

  const supportCode = input.supportCode || createSupportCode(normalizedOrderCode);
  const created: PaymentRecoveryStorageRecord = {
    id: newId(),
    supportCode,
    orderCode: normalizedOrderCode,
    transactionCode: normalizedTransactionCode,
    checkoutToken: normalizedCheckoutToken,
    userId: input.userId,
    planId: input.planId,
    planName: input.planName,
    amount: input.amount,
    paymentPurpose: input.paymentPurpose,
    sessionId: input.sessionId,
    checkoutUrl: input.checkoutUrl,
    status: input.status,
    note: input.note,
    errorCode: input.errorCode,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  writeRecoveryRecords([created, ...records]);
  return created;
};

export const getRecoveryByOrderCode = (
  orderCode: string,
  userId?: number
): PaymentRecoveryContext | null => {
  const normalized = asString(orderCode);
  if (!normalized) {
    return null;
  }

  const item = readRecoveryRecords().find((record) => {
    if (record.orderCode !== normalized) {
      return false;
    }

    if (!userId) {
      return true;
    }

    return record.userId === userId;
  });

  return item || null;
};

export const getRecoveryByTransactionCode = (
  transactionCode: string,
  userId?: number
): PaymentRecoveryContext | null => {
  const normalized = asString(transactionCode);
  if (!normalized) {
    return null;
  }

  const item = readRecoveryRecords().find((record) => {
    if (record.transactionCode !== normalized) {
      return false;
    }

    if (!userId) {
      return true;
    }

    return record.userId === userId;
  });

  return item || null;
};

export const getRecoveryByCheckoutToken = (
  checkoutToken: string,
  userId?: number
): PaymentRecoveryContext | null => {
  const normalized = asString(checkoutToken);
  if (!normalized) {
    return null;
  }

  const item = readRecoveryRecords().find((record) => {
    if (record.checkoutToken !== normalized) {
      return false;
    }

    if (!userId) {
      return true;
    }

    return record.userId === userId;
  });

  return item || null;
};

export const getLatestRecoveryForUser = (userId: number): PaymentRecoveryContext | null => {
  if (!Number.isFinite(userId) || userId <= 0) {
    return null;
  }

  const item = readRecoveryRecords().find((record) => record.userId === userId);
  return item || null;
};

export const getLatestRecoveryForUserByPurpose = (
  userId: number,
  paymentPurpose: PaymentPurpose
): PaymentRecoveryContext | null => {
  if (!Number.isFinite(userId) || userId <= 0) {
    return null;
  }

  const item = readRecoveryRecords().find(
    (record) => record.userId === userId && record.paymentPurpose === paymentPurpose
  );
  return item || null;
};

export const getLatestRecoveryForSessionPayment = (
  sessionId: number,
  userId?: number
): PaymentRecoveryContext | null => {
  if (!Number.isFinite(sessionId) || sessionId <= 0) {
    return null;
  }

  const item = readRecoveryRecords().find((record) => {
    if (record.paymentPurpose !== "MENTOR_INTERVIEW" || record.sessionId !== sessionId) {
      return false;
    }

    if (!userId) {
      return true;
    }

    return record.userId === userId;
  });

  return item || null;
};

export const clearRecoveryBySupportCode = (supportCode: string): void => {
  const normalized = asString(supportCode);
  if (!normalized) {
    return;
  }

  const next = readRecoveryRecords().filter((record) => record.supportCode !== normalized);
  writeRecoveryRecords(next);
};

export const addPaymentSupportLog = (input: AddPaymentSupportLogInput): PaymentSupportLog => {
  const contexts = readRecoveryRecords();
  const normalizedOrderCode = asString(input.orderCode);
  const normalizedTransactionCode = asString(input.transactionCode);
  const normalizedCheckoutToken = asString(input.checkoutToken);

  const linkedContext =
    (input.supportCode && contexts.find((item) => item.supportCode === input.supportCode)) ||
    (normalizedOrderCode && contexts.find((item) => item.orderCode === normalizedOrderCode)) ||
    (normalizedTransactionCode &&
      contexts.find((item) => item.transactionCode === normalizedTransactionCode)) ||
    (normalizedCheckoutToken &&
      contexts.find((item) => item.checkoutToken === normalizedCheckoutToken)) ||
    null;

  const supportCode =
    input.supportCode || linkedContext?.supportCode || createSupportCode(normalizedOrderCode);

  const next: PaymentSupportLogStorageRecord = {
    id: newId(),
    supportCode,
    orderCode: normalizedOrderCode || linkedContext?.orderCode,
    transactionCode: normalizedTransactionCode || linkedContext?.transactionCode,
    checkoutToken: normalizedCheckoutToken || linkedContext?.checkoutToken,
    userId: input.userId ?? linkedContext?.userId,
    planId: input.planId ?? linkedContext?.planId,
    planName: input.planName || linkedContext?.planName,
    amount: input.amount ?? linkedContext?.amount,
    paymentPurpose: input.paymentPurpose || linkedContext?.paymentPurpose,
    sessionId: input.sessionId ?? linkedContext?.sessionId,
    status: input.status,
    message: input.message,
    payload: input.payload,
    createdAt: nowIso(),
  };

  const logs = readSupportLogRecords();
  writeSupportLogRecords([next, ...logs]);

  return next;
};

export const getSupportLogsByOrderCode = (orderCode: string): PaymentSupportLog[] => {
  const normalized = asString(orderCode);
  if (!normalized) {
    return [];
  }

  return readSupportLogRecords().filter((log) => log.orderCode === normalized);
};

export const getSupportLogsBySupportCode = (supportCode: string): PaymentSupportLog[] => {
  const normalized = asString(supportCode);
  if (!normalized) {
    return [];
  }

  return readSupportLogRecords().filter((log) => log.supportCode === normalized);
};

export const buildSupportPayload = (params: {
  orderCode?: string;
  supportCode?: string;
  context?: PaymentRecoveryContext | null;
  extra?: Record<string, unknown>;
}): Record<string, unknown> => {
  const contextByOrderCode = params.orderCode ? getRecoveryByOrderCode(params.orderCode) : null;
  const contextBySupportCode =
    params.supportCode && !contextByOrderCode
      ? readRecoveryRecords().find((item) => item.supportCode === params.supportCode) || null
      : null;

  const context = params.context || contextByOrderCode || contextBySupportCode;
  const supportCode = params.supportCode || context?.supportCode;

  return {
    generatedAt: nowIso(),
    supportCode: supportCode || null,
    orderCode: params.orderCode || context?.orderCode || null,
    context: context || null,
    logsByOrderCode: params.orderCode ? getSupportLogsByOrderCode(params.orderCode) : [],
    logsBySupportCode: supportCode ? getSupportLogsBySupportCode(supportCode) : [],
    extra: params.extra || null,
  };
};

export const formatSupportPayload = (payload: unknown): string => {
  return JSON.stringify(payload, null, 2);
};
