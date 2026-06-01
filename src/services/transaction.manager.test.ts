import i18n from "@/lib/i18n";
import { beforeEach, describe, expect, it, vi } from "vitest";
const t = i18n.t.bind(i18n);

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    GET: vi.fn(),
    POST: vi.fn(),
    DELETE: vi.fn(),
  },
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    fetchClient: mockApi,
  };
});

import { TransactionManager } from "@/services/transaction.manager";

describe("TransactionManager API mode", () => {
  beforeEach(() => {
    mockApi.GET.mockReset();
    mockApi.POST.mockReset();
    mockApi.DELETE.mockReset();
  });

  it("returns list of transactions from API", async () => {
    mockApi.GET.mockResolvedValueOnce({
      data: [{ id: 1, transactionCode: "TX-1", amount: 10000 }],
    });

    const manager = new TransactionManager();
    const result = await manager.getAll();

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  it("creates transfer-in and returns redirect url", async () => {
    mockApi.POST.mockResolvedValueOnce({
      data: {
        redirectUrl: "https://payos.vn/checkout?orderCode=TX-11",
      },
    });

    const manager = new TransactionManager();
    const result = await manager.transferIn(150000, 202);

    expect(result.success).toBe(true);
    expect(result.data).toContain("orderCode=TX-11");
  });

  it("returns error when transfer-in amount is invalid", async () => {
    const manager = new TransactionManager();
    const result = await manager.transferIn(0, 303);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid wallet deposit amount.");
  });

  it("returns error when transfer-out response has no redirect url", async () => {
    mockApi.POST.mockResolvedValueOnce({
      data: {
        ok: true,
      },
    });

    const manager = new TransactionManager();
    const result = await manager.transferOut(25000, 404);

    expect(result.success).toBe(false);
    expect(result.error).toContain(t("general.validResults"));
    expect(mockApi.POST).toHaveBeenCalledWith(
      "/api/transactions/transfer-out",
      expect.objectContaining({
        params: expect.objectContaining({
          amount: 25000,
          userId: 404,
          paymentPurpose: "WITHDRAW_FROM_WALLET",
        }),
      })
    );
  });

  it("parses transfer-out text response from backend", async () => {
    mockApi.POST.mockResolvedValueOnce({
      data: "Transfer out successful. Current balance: 0",
    });

    const manager = new TransactionManager();
    const result = await manager.transferOut(44000, 55, "BUY_MEMBERSHIP");

    expect(result.success).toBe(true);
    expect(result.data?.message).toContain("Transfer out successful");
    expect(result.data?.currentBalance).toBe(0);
    expect(mockApi.POST).toHaveBeenCalledWith(
      "/api/transactions/transfer-out",
      expect.objectContaining({
        params: expect.objectContaining({
          amount: 44000,
          userId: 55,
          paymentPurpose: "BUY_MEMBERSHIP",
        }),
      })
    );
  });

  it("returns vietnamese insufficient-balance message for transfer-out errors", async () => {
    mockApi.POST.mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          error: "Insufficient balance",
        },
      },
    });

    const manager = new TransactionManager();
    const result = await manager.transferOut(999999, 55, "MENTOR_INTERVIEW");

    expect(result.success).toBe(false);
    expect(result.error).toContain(t("general.walletBalanceIsNotEnough1"));
  });

  it("maps insufficient-balance when backend returns only status 400", async () => {
    mockApi.POST.mockRejectedValueOnce({
      response: {
        status: 400,
      },
    });

    const manager = new TransactionManager();
    const result = await manager.transferOut(999999, 55, "MENTOR_INTERVIEW");

    expect(result.success).toBe(false);
    expect(result.error).toContain(t("general.walletBalanceIsNotEnough1"));
  });

  it("keeps transfer-out redirect url when backend still responds with checkout link", async () => {
    mockApi.POST.mockResolvedValueOnce({
      data: {
        redirectUrl: "https://payos.vn/checkout?orderCode=TX-44",
      },
    });

    const manager = new TransactionManager();
    const result = await manager.transferOut(44000, 55, "BUY_MEMBERSHIP");

    expect(result.success).toBe(true);
    expect(result.data?.redirectUrl).toContain("orderCode=TX-44");
    expect(mockApi.POST).toHaveBeenCalledWith(
      "/api/transactions/transfer-out",
      expect.objectContaining({
        params: expect.objectContaining({
          amount: 44000,
          userId: 55,
          paymentPurpose: "BUY_MEMBERSHIP",
        }),
      })
    );
  });

  it("deletes transaction by transaction code", async () => {
    mockApi.DELETE.mockResolvedValueOnce({ data: null });

    const manager = new TransactionManager();
    const result = await manager.delete("TX-DELETE-1");

    expect(result.success).toBe(true);
    expect(mockApi.DELETE).toHaveBeenCalledTimes(1);
  });

  it("returns backend delete error message when API rejects", async () => {
    mockApi.DELETE.mockRejectedValueOnce({
      response: {
        data: {
          error: "Transaction not found with transaction code: TX-404",
        },
      },
      message: "Request failed with status code 404",
    });

    const manager = new TransactionManager();
    const result = await manager.delete("TX-404");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Transaction not found with transaction code");
  });
});
