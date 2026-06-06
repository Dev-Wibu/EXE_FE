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

  // -------------------------------------------------------------------------
  // getPendingSessionPaidStatusSync
  // -------------------------------------------------------------------------
  describe("getPendingSessionPaidStatusSync", () => {
    it("returns null for non-existent session", () => {
      expect(getPendingSessionPaidStatusSync(999, 1)).toBeNull();
    });

    it("returns null for sessionId 0", () => {
      upsertPendingSessionPaidStatusSync({ sessionId: 0, userId: 1 });
      expect(getPendingSessionPaidStatusSync(0, 1)).toBeNull();
    });

    it("returns null for negative sessionId", () => {
      upsertPendingSessionPaidStatusSync({ sessionId: -1, userId: 1 });
      expect(getPendingSessionPaidStatusSync(-1, 1)).toBeNull();
    });

    it("returns null for userId 0", () => {
      upsertPendingSessionPaidStatusSync({ sessionId: 1, userId: 0 });
      expect(getPendingSessionPaidStatusSync(1, 0)).toBeNull();
    });

    it("returns null for NaN sessionId", () => {
      expect(getPendingSessionPaidStatusSync(Number.NaN, 1)).toBeNull();
    });

    it("returns null for Infinity sessionId", () => {
      expect(getPendingSessionPaidStatusSync(Number.POSITIVE_INFINITY, 1)).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // upsertPendingSessionPaidStatusSync
  // -------------------------------------------------------------------------
  describe("upsertPendingSessionPaidStatusSync", () => {
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

    it("updates existing record (preserves createdAt, updates updatedAt)", () => {
      const first = upsertPendingSessionPaidStatusSync({
        sessionId: 50,
        userId: 1,
        transactionCode: "TX-A",
      });

      const second = upsertPendingSessionPaidStatusSync({
        sessionId: 50,
        userId: 1,
        transactionCode: "TX-B",
      });

      expect(second.sessionId).toBe(50);
      expect(second.transactionCode).toBe("TX-B");
      expect(second.createdAt).toBe(first.createdAt);
      expect(second.retryCount).toBe(0);
    });

    it("preserves existing transactionCode when upsert omits it", () => {
      upsertPendingSessionPaidStatusSync({
        sessionId: 51,
        userId: 1,
        transactionCode: "TX-KEEP",
      });

      const second = upsertPendingSessionPaidStatusSync({
        sessionId: 51,
        userId: 1,
        // no transactionCode
      });

      expect(second.transactionCode).toBe("TX-KEEP");
    });

    it("creates new record without transactionCode", () => {
      const result = upsertPendingSessionPaidStatusSync({
        sessionId: 52,
        userId: 1,
      });

      expect(result.transactionCode).toBeUndefined();
      expect(result.retryCount).toBe(0);
    });

    it("maintains separate records for different sessions", () => {
      upsertPendingSessionPaidStatusSync({ sessionId: 1, userId: 1, transactionCode: "A" });
      upsertPendingSessionPaidStatusSync({ sessionId: 2, userId: 1, transactionCode: "B" });

      expect(getPendingSessionPaidStatusSync(1, 1)?.transactionCode).toBe("A");
      expect(getPendingSessionPaidStatusSync(2, 1)?.transactionCode).toBe("B");
    });
  });

  // -------------------------------------------------------------------------
  // markPendingSessionPaidStatusSyncRetried
  // -------------------------------------------------------------------------
  describe("markPendingSessionPaidStatusSyncRetried", () => {
    it("increments retry counter", () => {
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

    it("returns null for non-existent session", () => {
      expect(markPendingSessionPaidStatusSyncRetried(999, 1)).toBeNull();
    });

    it("increments multiple times", () => {
      upsertPendingSessionPaidStatusSync({ sessionId: 78, userId: 1 });
      markPendingSessionPaidStatusSyncRetried(78, 1);
      markPendingSessionPaidStatusSyncRetried(78, 1);
      const result = markPendingSessionPaidStatusSyncRetried(78, 1);
      expect(result?.retryCount).toBe(3);
    });
  });

  // -------------------------------------------------------------------------
  // clearPendingSessionPaidStatusSync
  // -------------------------------------------------------------------------
  describe("clearPendingSessionPaidStatusSync", () => {
    it("removes specific session record", () => {
      upsertPendingSessionPaidStatusSync({ sessionId: 88, userId: 8, transactionCode: "TX-88" });
      clearPendingSessionPaidStatusSync(88, 8);
      expect(getPendingSessionPaidStatusSync(88, 8)).toBeNull();
    });

    it("does not affect other session records", () => {
      upsertPendingSessionPaidStatusSync({ sessionId: 1, userId: 1 });
      upsertPendingSessionPaidStatusSync({ sessionId: 2, userId: 1 });
      clearPendingSessionPaidStatusSync(1, 1);
      expect(getPendingSessionPaidStatusSync(2, 1)).not.toBeNull();
    });

    it("is a no-op for non-existent session", () => {
      upsertPendingSessionPaidStatusSync({ sessionId: 1, userId: 1 });
      clearPendingSessionPaidStatusSync(999, 1);
      expect(getPendingSessionPaidStatusSync(1, 1)).not.toBeNull();
    });

    it("removes localStorage key when list becomes empty", () => {
      upsertPendingSessionPaidStatusSync({ sessionId: 1, userId: 1 });
      clearPendingSessionPaidStatusSync(1, 1);
      expect(localStorage.getItem("inblue.session-paid-status-sync.v1")).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Expired entries filtered out
  // -------------------------------------------------------------------------
  describe("expired entries", () => {
    it("filters out entries older than 4 hours", () => {
      // Write a stale entry directly to localStorage
      const staleEntry = {
        sessionId: 100,
        userId: 1,
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        retryCount: 0,
      };
      localStorage.setItem("inblue.session-paid-status-sync.v1", JSON.stringify([staleEntry]));

      // Should be filtered out by parsePendingItem
      expect(getPendingSessionPaidStatusSync(100, 1)).toBeNull();
    });

    it("keeps entries within the 4-hour window", () => {
      const recentEntry = {
        sessionId: 101,
        userId: 1,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        retryCount: 0,
      };
      localStorage.setItem("inblue.session-paid-status-sync.v1", JSON.stringify([recentEntry]));

      expect(getPendingSessionPaidStatusSync(101, 1)).not.toBeNull();
    });

    it("handles corrupt JSON in localStorage gracefully", () => {
      localStorage.setItem("inblue.session-paid-status-sync.v1", "not-json");
      // readPendingList catches parse errors and returns []
      expect(getPendingSessionPaidStatusSync(1, 1)).toBeNull();
    });

    it("handles non-array JSON in localStorage gracefully", () => {
      localStorage.setItem("inblue.session-paid-status-sync.v1", JSON.stringify({ not: "array" }));
      expect(getPendingSessionPaidStatusSync(1, 1)).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // canRetryPendingSessionPaidStatusSync
  // -------------------------------------------------------------------------
  describe("canRetryPendingSessionPaidStatusSync", () => {
    it("returns false when minRetryIntervalMs not elapsed", () => {
      const pending = upsertPendingSessionPaidStatusSync({
        sessionId: 66,
        userId: 8,
      });

      expect(canRetryPendingSessionPaidStatusSync(pending, { minRetryIntervalMs: 10_000 })).toBe(
        false
      );
    });

    it("returns false when retryCount >= maxRetryCount", () => {
      expect(
        canRetryPendingSessionPaidStatusSync(
          {
            sessionId: 66,
            userId: 8,
            createdAt: new Date().toISOString(),
            retryCount: 8,
            updatedAt: new Date(Date.now() - 60_000).toISOString(),
          },
          { maxRetryCount: 8, minRetryIntervalMs: 0 }
        )
      ).toBe(false);
    });

    it("returns true when interval elapsed and retryCount below max", () => {
      expect(
        canRetryPendingSessionPaidStatusSync(
          {
            sessionId: 66,
            userId: 8,
            createdAt: new Date().toISOString(),
            retryCount: 2,
            updatedAt: new Date(Date.now() - 60_000).toISOString(),
          },
          { maxRetryCount: 8, minRetryIntervalMs: 0 }
        )
      ).toBe(true);
    });

    it("uses default options when none provided", () => {
      // Default maxRetryCount=8, minRetryIntervalMs=4000
      // Fresh item → interval not elapsed → false
      const fresh = upsertPendingSessionPaidStatusSync({ sessionId: 67, userId: 1 });
      expect(canRetryPendingSessionPaidStatusSync(fresh)).toBe(false);
    });

    it("clamps maxRetryCount to at least 1", () => {
      // maxRetryCount=0 is clamped to 1 → retryCount 0 < 1 → could be true if interval ok
      expect(
        canRetryPendingSessionPaidStatusSync(
          {
            sessionId: 1,
            userId: 1,
            createdAt: new Date().toISOString(),
            retryCount: 0,
            updatedAt: new Date(Date.now() - 60_000).toISOString(),
          },
          { maxRetryCount: 0, minRetryIntervalMs: 0 }
        )
      ).toBe(true);
    });
  });
});
