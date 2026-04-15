import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/constants/api.config", async () => {
  const actual =
    await vi.importActual<typeof import("@/constants/api.config")>("@/constants/api.config");

  return {
    ...actual,
    createApiInstance: () => mockApi,
  };
});

import { TransactionManager } from "@/services/transaction.manager";

describe("TransactionManager API mode", () => {
  beforeEach(() => {
    mockApi.get.mockReset();
    mockApi.post.mockReset();
    mockApi.delete.mockReset();
  });

  it("returns list of transactions from API", async () => {
    mockApi.get.mockResolvedValueOnce({
      data: [{ id: 1, transactionCode: "TX-1", amount: 10000 }],
    });

    const manager = new TransactionManager();
    const result = await manager.getAll();

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  it("creates transfer-in and returns redirect url", async () => {
    mockApi.post.mockResolvedValueOnce({
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
    expect(result.error).toContain("So tien");
  });

  it("returns error when transfer-out response has no redirect url", async () => {
    mockApi.post.mockResolvedValueOnce({
      data: {
        ok: true,
      },
    });

    const manager = new TransactionManager();
    const result = await manager.transferOut(25000, 404);

    expect(result.success).toBe(false);
    expect(result.error).toContain("hop le");
    expect(mockApi.post).toHaveBeenCalledWith(
      "/api/transactions/transfer-out",
      null,
      expect.objectContaining({
        params: expect.objectContaining({
          amount: 25000,
          userId: 404,
          paymentPurpose: "WITHDRAW_FROM_WALLET",
        }),
      })
    );
  });

  it("passes explicit transfer-out payment purpose when provided", async () => {
    mockApi.post.mockResolvedValueOnce({
      data: {
        redirectUrl: "https://payos.vn/checkout?orderCode=TX-44",
      },
    });

    const manager = new TransactionManager();
    const result = await manager.transferOut(44000, 55, "BUY_MEMBERSHIP");

    expect(result.success).toBe(true);
    expect(mockApi.post).toHaveBeenCalledWith(
      "/api/transactions/transfer-out",
      null,
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
    mockApi.delete.mockResolvedValueOnce({ data: null });

    const manager = new TransactionManager();
    const result = await manager.delete("TX-DELETE-1");

    expect(result.success).toBe(true);
    expect(mockApi.delete).toHaveBeenCalledTimes(1);
  });

  it("returns backend delete error message when API rejects", async () => {
    mockApi.delete.mockRejectedValueOnce({
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
