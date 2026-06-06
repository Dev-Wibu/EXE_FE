import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearPendingSessionPaymentContext,
  getPendingSessionPaymentContext,
  savePendingSessionPaymentContext,
} from "./session-payment-context";

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

describe("savePendingSessionPaymentContext", () => {
  it("saves context to localStorage and returns it", () => {
    const result = savePendingSessionPaymentContext({
      sessionId: 42,
      userId: 1,
    });
    expect(result.sessionId).toBe(42);
    expect(result.userId).toBe(1);
    expect(result.paymentPurpose).toBe("MENTOR_INTERVIEW");
    expect(result.createdAt).toBeDefined();
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it("extracts checkout token from URL when provided", () => {
    const result = savePendingSessionPaymentContext({
      sessionId: 42,
      userId: 1,
      checkoutUrl: "https://pay.vn?id=TOKEN123",
    });
    expect(result.checkoutToken).toBe("TOKEN123");
  });

  it("extracts orderCode and transactionCode from checkoutUrl", () => {
    const result = savePendingSessionPaymentContext({
      sessionId: 42,
      userId: 1,
      checkoutUrl: "https://pay.vn?id=TOKEN&orderCode=ORD123&transactionCode=TX456",
    });
    expect(result.checkoutToken).toBe("TOKEN");
    expect(result.orderCode).toBe("ORD123");
    expect(result.transactionCode).toBe("TX456");
  });

  it("sets undefined for extractable fields when checkoutUrl has no tokens", () => {
    const result = savePendingSessionPaymentContext({
      sessionId: 42,
      userId: 1,
      checkoutUrl: "https://pay.vn",
    });
    expect(result.checkoutToken).toBeUndefined();
    expect(result.orderCode).toBeUndefined();
    expect(result.transactionCode).toBeUndefined();
  });

  it("handles undefined checkoutUrl gracefully", () => {
    const result = savePendingSessionPaymentContext({
      sessionId: 10,
    });
    expect(result.checkoutUrl).toBeUndefined();
    expect(result.checkoutToken).toBeUndefined();
  });
});

describe("getPendingSessionPaymentContext", () => {
  it("returns null when nothing is stored", () => {
    expect(getPendingSessionPaymentContext()).toBeNull();
  });

  it("returns saved context when valid", () => {
    savePendingSessionPaymentContext({ sessionId: 42, userId: 1 });
    const result = getPendingSessionPaymentContext();
    expect(result?.sessionId).toBe(42);
  });

  it("returns null when userId does not match", () => {
    savePendingSessionPaymentContext({ sessionId: 42, userId: 1 });
    expect(getPendingSessionPaymentContext(999)).toBeNull();
  });

  it("returns context when currentUserId is provided but stored userId is undefined", () => {
    // Save without userId
    savePendingSessionPaymentContext({ sessionId: 42 });
    // Current user check is skipped when parsed.userId is undefined
    const result = getPendingSessionPaymentContext(1);
    expect(result?.sessionId).toBe(42);
  });

  it("skips userId mismatch check when currentUserId is not provided", () => {
    savePendingSessionPaymentContext({ sessionId: 42, userId: 1 });
    const result = getPendingSessionPaymentContext();
    expect(result?.sessionId).toBe(42);
  });

  it("clears and returns null for expired context", () => {
    // Save with old timestamp
    const oldContext = {
      sessionId: 1,
      userId: 1,
      paymentPurpose: "MENTOR_INTERVIEW",
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    };
    localStorageMock.setItem("inblue.session-payment.pending", JSON.stringify(oldContext));

    const result = getPendingSessionPaymentContext();
    expect(result).toBeNull();
  });

  it("returns null and clears for malformed JSON in localStorage", () => {
    localStorageMock.setItem("inblue.session-payment.pending", "not-valid-json{{{");
    const result = getPendingSessionPaymentContext();
    expect(result).toBeNull();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("inblue.session-payment.pending");
  });

  it("returns null and clears for stored data missing sessionId", () => {
    localStorageMock.setItem(
      "inblue.session-payment.pending",
      JSON.stringify({ createdAt: new Date().toISOString() })
    );
    const result = getPendingSessionPaymentContext();
    expect(result).toBeNull();
  });

  it("returns null and clears for stored data with invalid createdAt", () => {
    localStorageMock.setItem(
      "inblue.session-payment.pending",
      JSON.stringify({ sessionId: 1, createdAt: "not-a-date" })
    );
    const result = getPendingSessionPaymentContext();
    expect(result).toBeNull();
  });

  it("returns null and clears for stored data with missing createdAt", () => {
    localStorageMock.setItem("inblue.session-payment.pending", JSON.stringify({ sessionId: 1 }));
    const result = getPendingSessionPaymentContext();
    expect(result).toBeNull();
  });

  it("returns null for sessionId 0 (falsy guard)", () => {
    localStorageMock.setItem(
      "inblue.session-payment.pending",
      JSON.stringify({ sessionId: 0, createdAt: new Date().toISOString() })
    );
    expect(getPendingSessionPaymentContext()).toBeNull();
  });

  it("accepts negative sessionId (truthy guard only rejects 0/null/undefined)", () => {
    localStorageMock.setItem(
      "inblue.session-payment.pending",
      JSON.stringify({ sessionId: -1, createdAt: new Date().toISOString() })
    );
    // -1 is truthy → !(-1) is false → guard doesn't trigger → context is accepted
    const result = getPendingSessionPaymentContext();
    expect(result).not.toBeNull();
    expect(result!.sessionId).toBe(-1);
  });

  it("returns null for NaN sessionId", () => {
    localStorageMock.setItem(
      "inblue.session-payment.pending",
      JSON.stringify({ sessionId: NaN, createdAt: new Date().toISOString() })
    );
    expect(getPendingSessionPaymentContext()).toBeNull();
  });

  it("returns null for Infinity sessionId", () => {
    localStorageMock.setItem(
      "inblue.session-payment.pending",
      JSON.stringify({ sessionId: Infinity, createdAt: new Date().toISOString() })
    );
    expect(getPendingSessionPaymentContext()).toBeNull();
  });
});

describe("clearPendingSessionPaymentContext", () => {
  it("removes the context from localStorage", () => {
    savePendingSessionPaymentContext({ sessionId: 42, userId: 1 });
    clearPendingSessionPaymentContext();
    expect(getPendingSessionPaymentContext()).toBeNull();
  });
});
