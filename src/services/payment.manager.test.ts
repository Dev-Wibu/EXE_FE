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

import { PaymentManager } from "@/services/payment.manager";

describe("PaymentManager API mode", () => {
  beforeEach(() => {
    mockApi.get.mockReset();
    mockApi.post.mockReset();
    mockApi.delete.mockReset();
  });

  it("returns payment list from API", async () => {
    mockApi.get.mockResolvedValueOnce({
      data: [{ id: 1, transactionCode: "PAY-1", amount: 99000 }],
    });

    const manager = new PaymentManager();
    const result = await manager.getAll();

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(mockApi.get).toHaveBeenCalledTimes(1);
  });

  it("creates payment and returns checkout url from API payload", async () => {
    mockApi.post.mockResolvedValueOnce({
      data: {
        checkoutUrl: "https://payos.vn/checkout?orderCode=ORDER-123",
      },
    });

    const manager = new PaymentManager();
    const result = await manager.create(120000, 101, {
      planId: 5,
      planName: "BASIC",
    });

    expect(result.success).toBe(true);
    expect(result.data).toContain("orderCode=ORDER-123");
    expect(mockApi.post).toHaveBeenCalledTimes(1);
  });

  it("returns error when create amount is invalid", async () => {
    const manager = new PaymentManager();
    const result = await manager.create(0, 1);

    expect(result.success).toBe(false);
    expect(result.error).toContain("So tien");
    expect(mockApi.post).not.toHaveBeenCalled();
  });

  it("returns error when API create does not include checkout URL", async () => {
    mockApi.post.mockResolvedValueOnce({
      data: {
        id: 123,
      },
    });

    const manager = new PaymentManager();
    const result = await manager.create(50000, 10);

    expect(result.success).toBe(false);
    expect(result.error).toContain("link thanh toan");
  });

  it("cancels payment by transaction code", async () => {
    mockApi.get.mockResolvedValueOnce({
      data: {
        id: 9,
        transactionCode: "ORDER-9",
        status: "FAILED",
      },
    });

    const manager = new PaymentManager();
    const result = await manager.cancel("ORDER-9");

    expect(result.success).toBe(true);
    expect(result.data?.status).toBe("FAILED");
    expect(mockApi.get).toHaveBeenCalledTimes(1);
  });

  it("finds payment by transaction code from payment list", async () => {
    mockApi.get.mockResolvedValueOnce({
      data: [
        { id: 1, transactionCode: "TX-1" },
        { id: 2, transactionCode: "TX-2" },
      ],
    });

    const manager = new PaymentManager();
    const result = await manager.getByTransactionCode("TX-2");

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe(2);
  });
});
