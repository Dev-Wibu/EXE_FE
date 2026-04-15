import { describe, expect, it } from "vitest";

import {
  getCallbackIdentifierMismatch,
  isCancelCallbackSignal,
  isLowConfidenceRecoverySource,
  resolveCancelTransactionCode,
  shouldUseOrderCodeAsTransactionCode,
} from "./payment-callback";

describe("payment-callback helpers", () => {
  it("uses query transaction code as first priority", () => {
    const result = resolveCancelTransactionCode({
      queryTransactionCode: " TX-123 ",
      contextTransactionCode: "CTX-111",
      pendingTransactionCode: "PEND-111",
      orderCode: "ORDER-111",
      callbackCheckoutToken: "token-1",
      status: "CANCELLED",
    });

    expect(result).toEqual({
      value: "TX-123",
      source: "query-transaction-code",
      usedOrderCodeFallback: false,
    });
  });

  it("falls back to context transaction code when query code is missing", () => {
    const result = resolveCancelTransactionCode({
      contextTransactionCode: "CTX-222",
      pendingTransactionCode: "PEND-222",
      orderCode: "ORDER-222",
      status: "CANCELLED",
    });

    expect(result.value).toBe("CTX-222");
    expect(result.source).toBe("context-transaction-code");
    expect(result.usedOrderCodeFallback).toBe(false);
  });

  it("uses pending transaction code when query/context are missing", () => {
    const result = resolveCancelTransactionCode({
      pendingTransactionCode: "PEND-333",
      orderCode: "ORDER-333",
      status: "CANCELLED",
    });

    expect(result.value).toBe("PEND-333");
    expect(result.source).toBe("pending-transaction-code");
  });

  it("falls back to orderCode when callback has strong cancel signal", () => {
    const result = resolveCancelTransactionCode({
      orderCode: "ORDER-444",
      callbackCheckoutToken: "token-444",
      status: "CANCELLED",
    });

    expect(result.value).toBe("ORDER-444");
    expect(result.source).toBe("order-code-fallback");
    expect(result.usedOrderCodeFallback).toBe(true);
  });

  it("does not fallback to orderCode without cancel callback signal", () => {
    const result = resolveCancelTransactionCode({
      orderCode: "ORDER-555",
      status: "PAID",
      cancelFlag: "false",
    });

    expect(result).toEqual({
      value: "",
      source: "none",
      usedOrderCodeFallback: false,
    });
  });

  it("accepts explicit cancel query flag as fallback signal", () => {
    const shouldUseFallback = shouldUseOrderCodeAsTransactionCode({
      orderCode: "ORDER-666",
      cancelFlag: "true",
    });

    expect(shouldUseFallback).toBe(true);
  });

  it("recognizes checkout token/status/cancel flag as cancel callback signals", () => {
    expect(isCancelCallbackSignal({ callbackCheckoutToken: "token" })).toBe(true);
    expect(isCancelCallbackSignal({ status: "cancelled" })).toBe(true);
    expect(isCancelCallbackSignal({ cancelFlag: "1" })).toBe(true);
    expect(isCancelCallbackSignal({ status: "PAID", cancelFlag: "false" })).toBe(false);
  });

  it("reports mismatch when callback identifiers conflict with context", () => {
    const mismatch = getCallbackIdentifierMismatch(
      {
        orderCode: "ORDER-1",
        transactionCode: "TX-1",
        checkoutToken: "token-1",
      },
      {
        orderCode: "ORDER-2",
        transactionCode: "TX-1",
        checkoutToken: "token-2",
      }
    );

    expect(mismatch.hasMismatch).toBe(true);
    expect(mismatch.mismatchedKeys).toEqual(["orderCode", "checkoutToken"]);
  });

  it("treats latest-user source as low confidence", () => {
    expect(isLowConfidenceRecoverySource("latest-user-recovery")).toBe(true);
    expect(isLowConfidenceRecoverySource("order-code")).toBe(false);
  });
});
