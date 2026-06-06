import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addPaymentSupportLog,
  buildSupportPayload,
  clearRecoveryBySupportCode,
  createSupportCode,
  extractCheckoutTokenFromUrl,
  extractOrderCodeFromUrl,
  extractTransactionCodeFromUrl,
  formatSupportPayload,
  getLatestRecoveryForSessionPayment,
  getLatestRecoveryForUser,
  getLatestRecoveryForUserByPurpose,
  getRecoveryByCheckoutToken,
  getRecoveryByOrderCode,
  getRecoveryByTransactionCode,
  getSupportLogsByOrderCode,
  getSupportLogsBySupportCode,
  upsertPaymentRecoveryContext,
} from "./payment-recovery";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

describe("createSupportCode", () => {
  it("creates a support code without orderCode", () => {
    const code = createSupportCode();
    expect(code).toMatch(/^SUP-/);
  });

  it("creates a support code with orderCode suffix", () => {
    const code = createSupportCode("ORDER123456");
    // Last 6 chars of "ORDER123456" = "123456"
    expect(code).toMatch(/^SUP-123456-/);
  });
  it("handles short orderCode (fewer than 6 chars)", () => {
    const code = createSupportCode("AB");
    expect(code).toMatch(/^SUP-AB-/);
  });
  it("handles undefined orderCode", () => {
    const code = createSupportCode(undefined);
    expect(code).toMatch(/^SUP-/);
  });
});

describe("extractOrderCodeFromUrl", () => {
  it("extracts orderCode from query param", () => {
    expect(extractOrderCodeFromUrl("https://pay.vn?orderCode=ABC123")).toBe("ABC123");
  });

  it("extracts order_code from query param", () => {
    expect(extractOrderCodeFromUrl("https://pay.vn?order_code=XYZ")).toBe("XYZ");
  });

  it("returns null when no orderCode in URL", () => {
    expect(extractOrderCodeFromUrl("https://pay.vn?other=123")).toBeNull();
  });

  it("returns null for invalid URL", () => {
    expect(extractOrderCodeFromUrl("not-a-url")).toBeNull();
  });
});

describe("extractTransactionCodeFromUrl", () => {
  it("extracts transactionCode from query param", () => {
    expect(extractTransactionCodeFromUrl("https://pay.vn?transactionCode=T123")).toBe("T123");
  });

  it("extracts transaction_code from query param", () => {
    expect(extractTransactionCodeFromUrl("https://pay.vn?transaction_code=T456")).toBe("T456");
  });

  it("returns null when not present", () => {
    expect(extractTransactionCodeFromUrl("https://pay.vn")).toBeNull();
  });
});

describe("extractCheckoutTokenFromUrl", () => {
  it("extracts id from query param", () => {
    expect(extractCheckoutTokenFromUrl("https://pay.vn?id=TOKEN123")).toBe("TOKEN123");
  });

  it("extracts checkoutId from query param", () => {
    expect(extractCheckoutTokenFromUrl("https://pay.vn?checkoutId=CID456")).toBe("CID456");
  });

  it("extracts from URL path segment when no query params", () => {
    expect(extractCheckoutTokenFromUrl("https://pay.vn/checkout/PATH_TOKEN")).toBe("PATH_TOKEN");
  });

  it("extracts checkout_id from query param", () => {
    expect(extractCheckoutTokenFromUrl("https://pay.vn?checkout_id=CID789")).toBe("CID789");
  });

  it("returns null for empty URL", () => {
    expect(extractCheckoutTokenFromUrl("")).toBeNull();
  });
});

describe("upsertPaymentRecoveryContext", () => {
  it("creates a new record when no match found", () => {
    const result = upsertPaymentRecoveryContext({
      userId: 1,
      status: "CREATED",
      orderCode: "ORD001",
    });
    expect(result.userId).toBe(1);
    expect(result.status).toBe("CREATED");
    expect(result.orderCode).toBe("ORD001");
    expect(result.supportCode).toBeDefined();
    expect(result.id).toMatch(/^PAY-/);
  });

  it("updates existing record matched by supportCode", () => {
    const first = upsertPaymentRecoveryContext({
      userId: 1,
      status: "CREATED",
      supportCode: "SUP-TEST",
    });
    const second = upsertPaymentRecoveryContext({
      userId: 1,
      status: "REDIRECTED",
      supportCode: "SUP-TEST",
    });
    expect(second.id).toBe(first.id);
    expect(second.status).toBe("REDIRECTED");
  });

  it("updates existing record matched by orderCode + userId", () => {
    upsertPaymentRecoveryContext({
      userId: 1,
      status: "CREATED",
      orderCode: "ORD002",
    });
    const second = upsertPaymentRecoveryContext({
      userId: 1,
      status: "CALLBACK_SUCCESS",
      orderCode: "ORD002",
    });
    expect(second.status).toBe("CALLBACK_SUCCESS");
    expect(second.orderCode).toBe("ORD002");
  });

  it("updates existing record matched by transactionCode + userId", () => {
    upsertPaymentRecoveryContext({
      userId: 1,
      status: "CREATED",
      transactionCode: "TX001",
    });
    const second = upsertPaymentRecoveryContext({
      userId: 1,
      status: "CALLBACK_SUCCESS",
      transactionCode: "TX001",
    });
    expect(second.id).not.toBeUndefined();
    expect(second.status).toBe("CALLBACK_SUCCESS");
  });

  it("updates existing record matched by checkoutToken + userId", () => {
    upsertPaymentRecoveryContext({
      userId: 1,
      status: "CREATED",
      checkoutToken: "TKN001",
    });
    const second = upsertPaymentRecoveryContext({
      userId: 1,
      status: "REDIRECTED",
      checkoutToken: "TKN001",
    });
    expect(second.status).toBe("REDIRECTED");
  });

  it("updates existing record matched by MENTOR_INTERVIEW + sessionId + userId", () => {
    upsertPaymentRecoveryContext({
      userId: 1,
      status: "CREATED",
      paymentPurpose: "MENTOR_INTERVIEW",
      sessionId: 42,
    });
    const second = upsertPaymentRecoveryContext({
      userId: 1,
      status: "REDIRECTED",
      paymentPurpose: "MENTOR_INTERVIEW",
      sessionId: 42,
    });
    expect(second.sessionId).toBe(42);
    expect(second.status).toBe("REDIRECTED");
  });

  it("preserves previous fields when updating (merge behavior)", () => {
    upsertPaymentRecoveryContext({
      userId: 1,
      status: "CREATED",
      orderCode: "ORD-MERGE",
      planId: 5,
      planName: "Pro",
      amount: 100,
    });
    const second = upsertPaymentRecoveryContext({
      userId: 1,
      status: "REDIRECTED",
      orderCode: "ORD-MERGE",
      // intentionally omit planId, planName, amount
    });
    expect(second.planId).toBe(5);
    expect(second.planName).toBe("Pro");
    expect(second.amount).toBe(100);
    expect(second.status).toBe("REDIRECTED");
  });
});

describe("getLatestRecoveryForUser", () => {
  it("returns latest record for a specific user", () => {
    upsertPaymentRecoveryContext({ userId: 1, status: "CREATED" });
    upsertPaymentRecoveryContext({ userId: 2, status: "CREATED" });
    const result = getLatestRecoveryForUser(1);
    expect(result).not.toBeNull();
    expect(result?.userId).toBe(1);
  });

  it("returns null when no records exist for user", () => {
    expect(getLatestRecoveryForUser(999)).toBeNull();
  });

  it("returns null for invalid userId (0, negative, NaN, Infinity)", () => {
    upsertPaymentRecoveryContext({ userId: 1, status: "CREATED" });
    expect(getLatestRecoveryForUser(0)).toBeNull();
    expect(getLatestRecoveryForUser(-1)).toBeNull();
    expect(getLatestRecoveryForUser(NaN)).toBeNull();
    expect(getLatestRecoveryForUser(Infinity)).toBeNull();
  });
});

describe("clearRecoveryBySupportCode", () => {
  it("removes a record by supportCode", () => {
    upsertPaymentRecoveryContext({
      userId: 1,
      status: "CREATED",
      supportCode: "SUP-DEL",
    });
    clearRecoveryBySupportCode("SUP-DEL");
    const remaining = getLatestRecoveryForUser(1);
    expect(remaining).toBeNull();
  });

  it("does nothing when supportCode is empty", () => {
    upsertPaymentRecoveryContext({
      userId: 1,
      status: "CREATED",
      supportCode: "SUP-KEEP",
    });
    clearRecoveryBySupportCode("");
    const remaining = getLatestRecoveryForUser(1);
    expect(remaining?.supportCode).toBe("SUP-KEEP");
  });

  it("does nothing when supportCode does not match", () => {
    upsertPaymentRecoveryContext({
      userId: 1,
      status: "CREATED",
      supportCode: "SUP-EXIST",
    });
    clearRecoveryBySupportCode("SUP-NONEXIST");
    const remaining = getLatestRecoveryForUser(1);
    expect(remaining?.supportCode).toBe("SUP-EXIST");
  });
});

describe("addPaymentSupportLog", () => {
  it("adds a support log entry", () => {
    addPaymentSupportLog({
      supportCode: "SUP-LOG",
      status: "CREATED",
      message: "Test log",
      userId: 1,
    });
    const logs = getSupportLogsBySupportCode("SUP-LOG");
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0].message).toBe("Test log");
  });
});

describe("buildSupportPayload", () => {
  it("builds a structured payload", () => {
    const payload = buildSupportPayload({
      supportCode: "SUP-1",
      orderCode: "ORD-1",
    });
    expect(payload).toHaveProperty("supportCode", "SUP-1");
    expect(payload).toHaveProperty("orderCode", "ORD-1");
    expect(payload).toHaveProperty("generatedAt");
  });
});

describe("getRecoveryByOrderCode", () => {
  it("finds record by orderCode", () => {
    upsertPaymentRecoveryContext({ userId: 1, status: "CREATED", orderCode: "ORD-LOOKUP" });
    const result = getRecoveryByOrderCode("ORD-LOOKUP");
    expect(result).not.toBeNull();
    expect(result?.orderCode).toBe("ORD-LOOKUP");
  });

  it("filters by userId when provided", () => {
    upsertPaymentRecoveryContext({ userId: 1, status: "CREATED", orderCode: "ORD-FILT" });
    upsertPaymentRecoveryContext({ userId: 2, status: "CREATED", orderCode: "ORD-FILT" });
    const result = getRecoveryByOrderCode("ORD-FILT", 2);
    expect(result?.userId).toBe(2);
  });

  it("returns null for empty orderCode", () => {
    expect(getRecoveryByOrderCode("")).toBeNull();
  });
});

describe("getRecoveryByTransactionCode", () => {
  it("finds record by transactionCode", () => {
    upsertPaymentRecoveryContext({ userId: 1, status: "CREATED", transactionCode: "TX-LOOK" });
    const result = getRecoveryByTransactionCode("TX-LOOK");
    expect(result?.transactionCode).toBe("TX-LOOK");
  });

  it("returns null for empty transactionCode", () => {
    expect(getRecoveryByTransactionCode("")).toBeNull();
  });
});

describe("getRecoveryByCheckoutToken", () => {
  it("finds record by checkoutToken", () => {
    upsertPaymentRecoveryContext({ userId: 1, status: "CREATED", checkoutToken: "TK-LOOK" });
    const result = getRecoveryByCheckoutToken("TK-LOOK");
    expect(result?.checkoutToken).toBe("TK-LOOK");
  });

  it("returns null for empty checkoutToken", () => {
    expect(getRecoveryByCheckoutToken("")).toBeNull();
  });
});

describe("getLatestRecoveryForUserByPurpose", () => {
  it("finds record by userId and paymentPurpose", () => {
    upsertPaymentRecoveryContext({
      userId: 1,
      status: "CREATED",
      paymentPurpose: "MENTOR_INTERVIEW",
    });
    upsertPaymentRecoveryContext({
      userId: 1,
      status: "CREATED",
      paymentPurpose: "FULLY_PAID",
    });
    const result = getLatestRecoveryForUserByPurpose(1, "MENTOR_INTERVIEW");
    expect(result?.paymentPurpose).toBe("MENTOR_INTERVIEW");
  });

  it("returns null for invalid userId", () => {
    expect(getLatestRecoveryForUserByPurpose(-1, "FULLY_PAID")).toBeNull();
  });
});

describe("getLatestRecoveryForSessionPayment", () => {
  it("finds MENTOR_INTERVIEW record by sessionId", () => {
    upsertPaymentRecoveryContext({
      userId: 1,
      status: "CREATED",
      paymentPurpose: "MENTOR_INTERVIEW",
      sessionId: 99,
    });
    const result = getLatestRecoveryForSessionPayment(99);
    expect(result?.sessionId).toBe(99);
  });

  it("returns null for invalid sessionId (0, negative, NaN)", () => {
    expect(getLatestRecoveryForSessionPayment(0)).toBeNull();
    expect(getLatestRecoveryForSessionPayment(-5)).toBeNull();
    expect(getLatestRecoveryForSessionPayment(NaN)).toBeNull();
  });

  it("filters by userId when provided", () => {
    upsertPaymentRecoveryContext({
      userId: 1,
      status: "CREATED",
      paymentPurpose: "MENTOR_INTERVIEW",
      sessionId: 50,
    });
    upsertPaymentRecoveryContext({
      userId: 2,
      status: "CREATED",
      paymentPurpose: "MENTOR_INTERVIEW",
      sessionId: 50,
    });
    const result = getLatestRecoveryForSessionPayment(50, 2);
    expect(result?.userId).toBe(2);
  });
});

describe("getSupportLogsByOrderCode", () => {
  it("finds logs by orderCode", () => {
    addPaymentSupportLog({
      orderCode: "ORD-LOGS",
      status: "CREATED",
      message: "test",
    });
    const logs = getSupportLogsByOrderCode("ORD-LOGS");
    expect(logs.length).toBe(1);
    expect(logs[0].message).toBe("test");
  });

  it("returns empty for empty orderCode", () => {
    expect(getSupportLogsByOrderCode("")).toEqual([]);
  });
});

describe("addPaymentSupportLog — linked context", () => {
  it("inherits fields from linked recovery context", () => {
    upsertPaymentRecoveryContext({
      userId: 1,
      status: "CREATED",
      orderCode: "ORD-LINKED",
      planId: 3,
      planName: "Premium",
      amount: 500,
    });
    const log = addPaymentSupportLog({
      orderCode: "ORD-LINKED",
      status: "CALLBACK_SUCCESS",
      message: "inherited fields",
    });
    expect(log.userId).toBe(1);
    expect(log.planId).toBe(3);
    expect(log.planName).toBe("Premium");
    expect(log.amount).toBe(500);
  });

  it("creates supportCode when none provided and no linked context", () => {
    const log = addPaymentSupportLog({
      status: "CREATED",
      message: "no link",
    });
    expect(log.supportCode).toMatch(/^SUP-/);
  });
});

describe("buildSupportPayload — additional cases", () => {
  it("includes extra data when provided", () => {
    const payload = buildSupportPayload({
      supportCode: "SUP-EXTRA",
      extra: { custom: "data" },
    });
    expect(payload.extra).toEqual({ custom: "data" });
  });

  it("resolves context from orderCode via recovery lookup", () => {
    upsertPaymentRecoveryContext({
      userId: 1,
      status: "CREATED",
      orderCode: "ORD-CTX",
    });
    const payload = buildSupportPayload({ orderCode: "ORD-CTX" });
    expect(payload.context).not.toBeNull();
    expect(payload.supportCode).toBeDefined();
  });

  it("includes logs by orderCode and supportCode", () => {
    upsertPaymentRecoveryContext({
      userId: 1,
      status: "CREATED",
      orderCode: "ORD-WLOG",
      supportCode: "SUP-WLOG",
    });
    addPaymentSupportLog({
      orderCode: "ORD-WLOG",
      status: "CREATED",
      message: "log entry",
    });
    const payload = buildSupportPayload({
      orderCode: "ORD-WLOG",
      supportCode: "SUP-WLOG",
    });
    expect((payload.logsByOrderCode as unknown[]).length).toBeGreaterThanOrEqual(1);
    expect((payload.logsBySupportCode as unknown[]).length).toBeGreaterThanOrEqual(1);
  });
});

describe("formatSupportPayload", () => {
  it("formats payload as JSON string", () => {
    const result = formatSupportPayload({ key: "value" });
    expect(typeof result).toBe("string");
    expect(JSON.parse(result)).toEqual({ key: "value" });
  });

  it("handles null gracefully", () => {
    expect(formatSupportPayload(null)).toBe("null");
  });
});

describe("expired record filtering (24h retention)", () => {
  it("filters out records older than 24 hours", () => {
    vi.useFakeTimers();
    try {
      // Create a record "now"
      vi.setSystemTime(new Date("2026-01-10T12:00:00Z"));
      upsertPaymentRecoveryContext({
        userId: 1,
        status: "CREATED",
        orderCode: "ORD-EXPIRE",
      });

      // Advance time by 25 hours — record should be expired
      vi.setSystemTime(new Date("2026-01-11T13:00:00Z"));
      const result = getRecoveryByOrderCode("ORD-EXPIRE");
      expect(result).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps records within 24-hour window", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-01-10T12:00:00Z"));
      upsertPaymentRecoveryContext({
        userId: 1,
        status: "CREATED",
        orderCode: "ORD-FRESH",
      });

      // Advance time by 23 hours — still within window
      vi.setSystemTime(new Date("2026-01-11T11:00:00Z"));
      const result = getRecoveryByOrderCode("ORD-FRESH");
      expect(result).not.toBeNull();
      expect(result?.orderCode).toBe("ORD-FRESH");
    } finally {
      vi.useRealTimers();
    }
  });

  it("treats records with invalid updatedAt as expired", () => {
    // Inject a record with invalid date directly into localStorage
    const invalidRecord = {
      id: "PAY-INVALID",
      supportCode: "SUP-INVALID",
      userId: 1,
      status: "CREATED",
      orderCode: "ORD-BAD-DATE",
      createdAt: "not-a-date",
      updatedAt: "not-a-date",
    };
    localStorageMock.setItem(
      "inblue.payment.recovery-contexts.v1",
      JSON.stringify([invalidRecord])
    );
    const result = getRecoveryByOrderCode("ORD-BAD-DATE");
    expect(result).toBeNull();
  });
});

describe("corrupt localStorage handling", () => {
  it("returns empty results when localStorage contains invalid JSON", () => {
    localStorageMock.getItem.mockReturnValueOnce("{invalid json");
    const result = getRecoveryByOrderCode("anything");
    expect(result).toBeNull();
  });

  it("returns empty results when localStorage contains non-array", () => {
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify({ not: "array" }));
    const result = getLatestRecoveryForUser(1);
    expect(result).toBeNull();
  });

  it("skips malformed records in array", () => {
    const records = [
      {
        id: "PAY-OK",
        supportCode: "SUP-OK",
        userId: 1,
        status: "CREATED",
        orderCode: "ORD-GOOD",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { id: "PAY-BAD" }, // missing required fields
      "not-an-object",
    ];
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(records));
    const result = getRecoveryByOrderCode("ORD-GOOD");
    expect(result).not.toBeNull();
    expect(result?.orderCode).toBe("ORD-GOOD");
  });
});

describe("upsertPaymentRecoveryContext — checkoutUrl extraction", () => {
  it("extracts checkoutToken from checkoutUrl when not provided directly", () => {
    const result = upsertPaymentRecoveryContext({
      userId: 1,
      status: "CREATED",
      checkoutUrl: "https://pay.vn/checkout/TOKEN_FROM_URL",
    });
    expect(result.checkoutToken).toBe("TOKEN_FROM_URL");
  });

  it("extracts checkoutToken from checkoutUrl query param", () => {
    const result = upsertPaymentRecoveryContext({
      userId: 1,
      status: "CREATED",
      checkoutUrl: "https://pay.vn?id=QUERY_TOKEN",
    });
    expect(result.checkoutToken).toBe("QUERY_TOKEN");
  });

  it("explicit checkoutToken takes precedence over URL extraction", () => {
    const result = upsertPaymentRecoveryContext({
      userId: 1,
      status: "CREATED",
      checkoutToken: "EXPLICIT",
      checkoutUrl: "https://pay.vn/checkout/URL_TOKEN",
    });
    expect(result.checkoutToken).toBe("EXPLICIT");
  });
});

describe("getRecoveryByTransactionCode — userId filter", () => {
  it("filters by userId when provided", () => {
    upsertPaymentRecoveryContext({ userId: 1, status: "CREATED", transactionCode: "TX-U1" });
    upsertPaymentRecoveryContext({ userId: 2, status: "CREATED", transactionCode: "TX-U2" });
    const result = getRecoveryByTransactionCode("TX-U1", 2);
    // TX-U1 belongs to userId 1, not 2 — should not match
    expect(result).toBeNull();
  });

  it("returns record when userId matches", () => {
    upsertPaymentRecoveryContext({ userId: 5, status: "CREATED", transactionCode: "TX-MATCH" });
    const result = getRecoveryByTransactionCode("TX-MATCH", 5);
    expect(result?.userId).toBe(5);
    expect(result?.transactionCode).toBe("TX-MATCH");
  });
});

describe("getRecoveryByCheckoutToken — userId filter", () => {
  it("filters by userId when provided", () => {
    upsertPaymentRecoveryContext({ userId: 1, status: "CREATED", checkoutToken: "TK-U1" });
    upsertPaymentRecoveryContext({ userId: 2, status: "CREATED", checkoutToken: "TK-U2" });
    const result = getRecoveryByCheckoutToken("TK-U1", 2);
    // TK-U1 belongs to userId 1, not 2 — should not match
    expect(result).toBeNull();
  });

  it("returns record when userId matches", () => {
    upsertPaymentRecoveryContext({ userId: 3, status: "CREATED", checkoutToken: "TK-MATCH" });
    const result = getRecoveryByCheckoutToken("TK-MATCH", 3);
    expect(result?.userId).toBe(3);
    expect(result?.checkoutToken).toBe("TK-MATCH");
  });
});
