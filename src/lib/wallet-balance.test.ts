import { describe, expect, it } from "vitest";

import { getLatestTransactionBalance, reconcileWalletBalance } from "@/lib/wallet-balance";

describe("wallet-balance utils", () => {
  it("prefers user-detail balance and flags mismatch with transactions", () => {
    const resolution = reconcileWalletBalance({
      userDetailBalance: 150000,
      transactions: [
        {
          id: 10,
          currentBalance: 120000,
        },
      ],
      authStoreBalance: 50000,
    });

    expect(resolution.source).toBe("user-detail");
    expect(resolution.walletBalance).toBe(150000);
    expect(resolution.hasMismatch).toBe(true);
    expect(resolution.mismatchDelta).toBe(30000);
  });

  it("falls back to latest transaction balance when user-detail is unavailable", () => {
    const resolution = reconcileWalletBalance({
      transactions: [
        {
          id: 9,
          currentBalance: 100000,
        },
        {
          id: 11,
          currentBalance: 170000,
        },
      ],
      authStoreBalance: 80000,
    });

    expect(resolution.source).toBe("transactions");
    expect(resolution.walletBalance).toBe(170000);
  });

  it("falls back to auth-store balance when api sources are missing", () => {
    const resolution = reconcileWalletBalance({
      authStoreBalance: 42000,
    });

    expect(resolution.source).toBe("auth-store");
    expect(resolution.walletBalance).toBe(42000);
    expect(resolution.hasMismatch).toBe(false);
  });

  it("returns unavailable when no source contains a finite balance", () => {
    const resolution = reconcileWalletBalance({});

    expect(resolution.source).toBe("unavailable");
    expect(resolution.walletBalance).toBeUndefined();
  });

  it("selects transaction balance with highest numeric id", () => {
    const balance = getLatestTransactionBalance([
      {
        id: 7,
        currentBalance: 90000,
      },
      {
        id: 5,
        currentBalance: 110000,
      },
      {
        id: 12,
        currentBalance: 150000,
      },
    ]);

    expect(balance).toBe(150000);
  });
});
