type PaymentRecoveryStorageRecord = {
  id: string;
  supportCode: string;
  orderCode?: string;
  userId: number;
  planId: number;
  planName?: string;
  amount: number;
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
  userId?: number;
  planId?: number;
  planName?: string;
  amount?: number;
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
  userId: number;
  planId: number;
  planName?: string;
  amount: number;
  checkoutUrl?: string;
  status: PaymentRecoveryStatus;
  note?: string;
  errorCode?: string;
}

export interface AddPaymentSupportLogInput {
  supportCode?: string;
  orderCode?: string;
  userId?: number;
  planId?: number;
  planName?: string;
  amount?: number;
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
  const planId = asNumber(value.planId);
  const amount = asNumber(value.amount);
  const status = asStatus(value.status);
  const createdAt = asString(value.createdAt);
  const updatedAt = asString(value.updatedAt);

  if (
    !id ||
    !supportCode ||
    !userId ||
    !planId ||
    amount == null ||
    !status ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }

  return {
    id,
    supportCode,
    orderCode: asString(value.orderCode),
    userId,
    planId,
    planName: asString(value.planName),
    amount,
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
    userId: asNumber(value.userId),
    planId: asNumber(value.planId),
    planName: asString(value.planName),
    amount: asNumber(value.amount),
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
    const fromQuery = asString(url.searchParams.get("orderCode"));
    if (fromQuery) {
      return fromQuery;
    }

    const fromPath = asString(url.searchParams.get("order_code"));
    return fromPath || null;
  } catch {
    return null;
  }
};

export const upsertPaymentRecoveryContext = (
  input: UpsertPaymentRecoveryInput
): PaymentRecoveryContext => {
  const records = readRecoveryRecords();

  let targetIndex = -1;
  if (input.orderCode) {
    targetIndex = records.findIndex(
      (item) => item.orderCode === input.orderCode && item.userId === input.userId
    );
  }

  if (targetIndex < 0 && input.supportCode) {
    targetIndex = records.findIndex((item) => item.supportCode === input.supportCode);
  }

  const timestamp = nowIso();
  if (targetIndex >= 0) {
    const prev = records[targetIndex];
    const next: PaymentRecoveryStorageRecord = {
      ...prev,
      orderCode: input.orderCode || prev.orderCode,
      userId: input.userId,
      planId: input.planId,
      planName: input.planName || prev.planName,
      amount: input.amount,
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

  const supportCode = input.supportCode || createSupportCode(input.orderCode);
  const created: PaymentRecoveryStorageRecord = {
    id: newId(),
    supportCode,
    orderCode: input.orderCode,
    userId: input.userId,
    planId: input.planId,
    planName: input.planName,
    amount: input.amount,
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

export const getLatestRecoveryForUser = (userId: number): PaymentRecoveryContext | null => {
  if (!Number.isFinite(userId) || userId <= 0) {
    return null;
  }

  const item = readRecoveryRecords().find((record) => record.userId === userId);
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
  const linkedContext =
    (input.supportCode && contexts.find((item) => item.supportCode === input.supportCode)) ||
    (input.orderCode && contexts.find((item) => item.orderCode === input.orderCode)) ||
    null;

  const supportCode =
    input.supportCode || linkedContext?.supportCode || createSupportCode(input.orderCode);

  const next: PaymentSupportLogStorageRecord = {
    id: newId(),
    supportCode,
    orderCode: input.orderCode || linkedContext?.orderCode,
    userId: input.userId ?? linkedContext?.userId,
    planId: input.planId ?? linkedContext?.planId,
    planName: input.planName || linkedContext?.planName,
    amount: input.amount ?? linkedContext?.amount,
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
