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

  it("reports no mismatch when all identifiers match", () => {
    const mismatch = getCallbackIdentifierMismatch(
      { orderCode: "O1", transactionCode: "T1", checkoutToken: "C1" },
      { orderCode: "O1", transactionCode: "T1", checkoutToken: "C1" }
    );
    expect(mismatch.hasMismatch).toBe(false);
    expect(mismatch.mismatchedKeys).toEqual([]);
  });

  it("ignores mismatch on keys where callback has empty value", () => {
    // callback omits checkoutToken → no mismatch even though context has one
    const mismatch = getCallbackIdentifierMismatch(
      { orderCode: "O1", transactionCode: "T1" },
      { orderCode: "O1", transactionCode: "T1", checkoutToken: "C1" }
    );
    expect(mismatch.hasMismatch).toBe(false);
  });

  it("treats '1' and 'true' cancelFlag strings as truthy", () => {
    expect(isCancelCallbackSignal({ cancelFlag: "1" })).toBe(true);
    expect(isCancelCallbackSignal({ cancelFlag: "true" })).toBe(true);
  });

  it("treats 'false', '0', empty string cancelFlag as non-truthy", () => {
    expect(isCancelCallbackSignal({ cancelFlag: "false" })).toBe(false);
    expect(isCancelCallbackSignal({ cancelFlag: "0" })).toBe(false);
    expect(isCancelCallbackSignal({ cancelFlag: "" })).toBe(false);
  });

  it("treats null cancelFlag as non-truthy", () => {
    expect(isCancelCallbackSignal({ cancelFlag: null })).toBe(false);
  });

  it("treats latest-user source as low confidence", () => {
    expect(isLowConfidenceRecoverySource("latest-user-recovery")).toBe(true);
    expect(isLowConfidenceRecoverySource("order-code")).toBe(false);
  });

  // --- Additional edge cases ---

  it("isCancelCallbackSignal returns false when all params are empty", () => {
    expect(isCancelCallbackSignal({})).toBe(false);
  });

  it("isCancelCallbackSignal accepts boolean true cancelFlag", () => {
    expect(isCancelCallbackSignal({ cancelFlag: true })).toBe(true);
  });

  it("isCancelCallbackSignal accepts 'yes' and 'y' cancelFlag", () => {
    expect(isCancelCallbackSignal({ cancelFlag: "yes" })).toBe(true);
    expect(isCancelCallbackSignal({ cancelFlag: "y" })).toBe(true);
  });

  it("isCancelCallbackSignal recognizes FAILED status", () => {
    expect(isCancelCallbackSignal({ status: "FAILED" })).toBe(true);
  });

  it("isCancelCallbackSignal recognizes CANCEL status (without ED)", () => {
    expect(isCancelCallbackSignal({ status: "CANCEL" })).toBe(true);
  });

  it("getCallbackIdentifierMismatch returns no mismatch when context is null", () => {
    const mismatch = getCallbackIdentifierMismatch({ orderCode: "ORDER-1" }, null);
    expect(mismatch.hasMismatch).toBe(false);
    expect(mismatch.mismatchedKeys).toEqual([]);
  });

  it("getCallbackIdentifierMismatch does not flag empty strings as mismatched", () => {
    const mismatch = getCallbackIdentifierMismatch(
      { orderCode: "", transactionCode: "" },
      { orderCode: "ORDER-1", transactionCode: "TX-1" }
    );
    expect(mismatch.hasMismatch).toBe(false);
    expect(mismatch.mismatchedKeys).toEqual([]);
  });

  it("shouldUseOrderCodeAsTransactionCode returns false when no orderCode", () => {
    expect(
      shouldUseOrderCodeAsTransactionCode({
        callbackCheckoutToken: "token",
        status: "CANCELLED",
      })
    ).toBe(false);
  });

  it("resolveCancelTransactionCode skips whitespace-only strings", () => {
    const result = resolveCancelTransactionCode({
      queryTransactionCode: "   ",
      contextTransactionCode: "   ",
      pendingTransactionCode: "   ",
      orderCode: "ORDER-777",
      status: "CANCELLED",
      callbackCheckoutToken: "tok",
    });
    expect(result.value).toBe("ORDER-777");
    expect(result.source).toBe("order-code-fallback");
  });

  it("resolveCancelTransactionCode returns 'none' when all inputs are empty", () => {
    const result = resolveCancelTransactionCode({});
    expect(result.value).toBe("");
    expect(result.source).toBe("none");
    expect(result.usedOrderCodeFallback).toBe(false);
  });

  it("getCallbackIdentifierMismatch only flags keys where BOTH sides have non-empty values", () => {
    // callback has empty transactionCode — should not be flagged
    const mismatch = getCallbackIdentifierMismatch(
      { orderCode: "O1", transactionCode: "" },
      { orderCode: "DIFFERENT", transactionCode: "T1" }
    );
    expect(mismatch.hasMismatch).toBe(true);
    expect(mismatch.mismatchedKeys).toEqual(["orderCode"]);
  });

  it("isLowConfidenceRecoverySource returns false for other sources", () => {
    expect(isLowConfidenceRecoverySource("existing-state")).toBe(false);
    expect(isLowConfidenceRecoverySource("none")).toBe(false);
    expect(isLowConfidenceRecoverySource("session-recovery")).toBe(false);
  });
});
