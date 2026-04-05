import { describe, expect, it } from "vitest";

import { PaymentManager } from "@/services/payment.manager";

describe("PaymentManager skeleton", () => {
  it("returns skeleton payment list", async () => {
    const manager = new PaymentManager("mock");
    const result = await manager.getAll();

    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it("creates payment link and supports cancel by transactionCode", async () => {
    const manager = new PaymentManager("mock");
    const createResult = await manager.create(120000, 101);

    expect(createResult.success).toBe(true);
    expect(createResult.data).toContain("/payment/success");

    const url = new URL(createResult.data || "", "https://inblue.local");
    const transactionCode = url.searchParams.get("orderCode") || "";

    const cancelResult = await manager.cancel(transactionCode);
    expect(cancelResult.success).toBe(true);
    expect(cancelResult.data?.status).toBe("FAILED");
  });

  it("resolves orderCode to user-plan mapping in mock mode", async () => {
    const manager = new PaymentManager("mock");
    const createResult = await manager.create(189000, 202, {
      planId: 7,
      planName: "PREMIUM",
    });

    expect(createResult.success).toBe(true);

    const url = new URL(createResult.data || "", "https://inblue.local");
    const orderCode = url.searchParams.get("orderCode") || "";

    const resolveResult = await manager.resolveOrder(orderCode);
    expect(resolveResult.success).toBe(true);
    expect(resolveResult.data?.userId).toBe(202);
    expect(resolveResult.data?.planId).toBe(7);
    expect(resolveResult.data?.planName).toBe("PREMIUM");
  });
});
