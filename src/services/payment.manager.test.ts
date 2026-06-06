import i18n from "@/lib/i18n";
import { PaymentManager } from "@/services/payment.manager";
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
describe("PaymentManager API mode", () => {
  beforeEach(() => {
    mockApi.GET.mockReset();
    mockApi.POST.mockReset();
    mockApi.DELETE.mockReset();
  });
  it("returns payment list from API", async () => {
    mockApi.GET.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          transactionCode: "PAY-1",
          amount: 99000,
        },
      ],
    });
    const manager = new PaymentManager();
    const result = await manager.getAll();
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(mockApi.GET).toHaveBeenCalledTimes(1);
  });
  it("creates payment and returns checkout url from API payload", async () => {
    mockApi.POST.mockResolvedValueOnce({
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
    expect(mockApi.POST).toHaveBeenCalledTimes(1);
    expect(mockApi.POST).toHaveBeenCalledWith(
      "/api/payments/pay",
      expect.objectContaining({
        params: expect.objectContaining({
          amount: 120000,
          userId: 101,
          paymentPurpose: "FULLY_PAID",
        }),
      })
    );
  });
  it("passes explicit payment purpose when provided", async () => {
    mockApi.POST.mockResolvedValueOnce({
      data: {
        checkoutUrl: "https://payos.vn/checkout?orderCode=ORDER-999",
      },
    });
    const manager = new PaymentManager();
    const result = await manager.create(88000, 77, {
      paymentPurpose: "MENTOR_INTERVIEW",
    });
    expect(result.success).toBe(true);
    expect(mockApi.POST).toHaveBeenCalledWith(
      "/api/payments/pay",
      expect.objectContaining({
        params: expect.objectContaining({
          amount: 88000,
          userId: 77,
          paymentPurpose: "MENTOR_INTERVIEW",
        }),
      })
    );
  });
  it("returns error when create amount is invalid", async () => {
    const manager = new PaymentManager();
    const result = await manager.create(0, 1);
    expect(result.success).toBe(false);
    expect(result.error).toBe(t("general.invalidPaymentAmount"));
    expect(mockApi.POST).not.toHaveBeenCalled();
  });
  it("returns error when API create does not include checkout URL", async () => {
    mockApi.POST.mockResolvedValueOnce({
      data: {
        id: 123,
      },
    });
    const manager = new PaymentManager();
    const result = await manager.create(50000, 10);
    expect(result.success).toBe(false);
    expect(result.error).toBe(t("general.theBackendDoesNotReturn"));
  });
  it("cancels payment by transaction code", async () => {
    mockApi.GET.mockResolvedValueOnce({
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
    expect(mockApi.GET).toHaveBeenCalledTimes(1);
  });
  it("returns backend cancel error message when API rejects", async () => {
    mockApi.GET.mockRejectedValueOnce({
      response: {
        data: {
          error: "Payment not found with transaction code: ORDER-404",
        },
      },
      message: "Request failed with status code 404",
    });
    const manager = new PaymentManager();
    const result = await manager.cancel("ORDER-404");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Payment not found with transaction code");
  });
  it("finds payment by transaction code from payment list", async () => {
    mockApi.GET.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          transactionCode: "TX-1",
        },
        {
          id: 2,
          transactionCode: "TX-2",
        },
      ],
    });
    const manager = new PaymentManager();
    const result = await manager.getByTransactionCode("TX-2");
    expect(result.success).toBe(true);
    expect(result.data?.id).toBe(2);
  });

  it("returns error when transaction code not found in list", async () => {
    mockApi.GET.mockResolvedValueOnce({
      data: [
        { id: 1, transactionCode: "TX-1" },
        { id: 2, transactionCode: "TX-2" },
      ],
    });
    const manager = new PaymentManager();
    const result = await manager.getByTransactionCode("TX-MISSING");
    expect(result.success).toBe(false);
    expect(result.error).toBe(t("general.paymentByTransactioncodeNotFound"));
  });

  it("handles non-array response in getByTransactionCode", async () => {
    mockApi.GET.mockResolvedValueOnce({
      data: { content: [{ id: 1, transactionCode: "TX-1" }] },
    });
    const manager = new PaymentManager();
    const result = await manager.getByTransactionCode("TX-1");
    expect(result.success).toBe(false);
    expect(result.error).toBe(t("general.paymentByTransactioncodeNotFound"));
  });

  it("fetches payment by id", async () => {
    mockApi.GET.mockResolvedValueOnce({
      data: { id: 5, transactionCode: "TX-5", amount: 50000 },
    });
    const manager = new PaymentManager();
    const result = await manager.getById(5);
    expect(result.success).toBe(true);
    expect(result.data?.id).toBe(5);
  });

  it("returns error when getById fails", async () => {
    mockApi.GET.mockRejectedValueOnce(new Error("Not found"));
    const manager = new PaymentManager();
    const result = await manager.getById(999);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Not found");
  });

  it("returns normalized error for non-Error throws in create", async () => {
    mockApi.POST.mockRejectedValueOnce("string error");
    const manager = new PaymentManager();
    const result = await manager.create(50000, 10);
    expect(result.success).toBe(false);
    // getNormalizedErrorMessage extracts raw message for non-generic strings
    expect(result.error).toBe("string error");
  });
});
