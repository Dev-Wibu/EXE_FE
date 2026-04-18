import { beforeEach, describe, expect, it } from "vitest";

import {
  canRetryPendingSessionPaidStatusSync,
  clearPendingSessionPaidStatusSync,
  getPendingSessionPaidStatusSync,
  markPendingSessionPaidStatusSyncRetried,
  upsertPendingSessionPaidStatusSync,
} from "@/lib/session-paid-status-sync";

describe("session-paid-status-sync", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores and retrieves pending session paid sync context", () => {
    upsertPendingSessionPaidStatusSync({
      sessionId: 99,
      userId: 8,
      transactionCode: "TX-99",
    });

    const pending = getPendingSessionPaidStatusSync(99, 8);

    expect(pending).not.toBeNull();
    expect(pending?.sessionId).toBe(99);
    expect(pending?.userId).toBe(8);
    expect(pending?.transactionCode).toBe("TX-99");
    expect(pending?.retryCount).toBe(0);
  });

  it("increments retry counter after each retry mark", () => {
    upsertPendingSessionPaidStatusSync({
      sessionId: 77,
      userId: 8,
      transactionCode: "TX-77",
    });

    const retried = markPendingSessionPaidStatusSyncRetried(77, 8);

    expect(retried).not.toBeNull();
    expect(retried?.retryCount).toBe(1);

    const latest = getPendingSessionPaidStatusSync(77, 8);
    expect(latest?.retryCount).toBe(1);
  });

  it("clears pending sync context", () => {
    upsertPendingSessionPaidStatusSync({
      sessionId: 88,
      userId: 8,
      transactionCode: "TX-88",
    });

    clearPendingSessionPaidStatusSync(88, 8);

    expect(getPendingSessionPaidStatusSync(88, 8)).toBeNull();
  });

  it("applies retry interval and max retry limit", () => {
    const pending = upsertPendingSessionPaidStatusSync({
      sessionId: 66,
      userId: 8,
      transactionCode: "TX-66",
    });

    expect(
      canRetryPendingSessionPaidStatusSync(pending, {
        minRetryIntervalMs: 10_000,
      })
    ).toBe(false);

    expect(
      canRetryPendingSessionPaidStatusSync(
        {
          ...pending,
          retryCount: 8,
          updatedAt: new Date(Date.now() - 60_000).toISOString(),
        },
        {
          maxRetryCount: 8,
          minRetryIntervalMs: 0,
        }
      )
    ).toBe(false);
  });
});
