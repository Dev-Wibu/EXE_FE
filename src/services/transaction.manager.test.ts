import { describe, expect, it } from "vitest";

import { TransactionManager } from "@/services/transaction.manager";

describe("TransactionManager skeleton", () => {
  it("creates transfer-in callback url and can delete transaction by code", async () => {
    const manager = new TransactionManager("mock");

    const transferResult = await manager.transferIn(150000, 202);
    expect(transferResult.success).toBe(true);
    expect(transferResult.data).toContain("/payment/success");

    const url = new URL(transferResult.data || "", "https://inblue.local");
    const transactionCode = url.searchParams.get("orderCode") || "";

    const listResult = await manager.getAll();
    expect(listResult.success).toBe(true);
    expect(listResult.data?.some((tx) => tx.transactionCode === transactionCode)).toBe(true);

    const deleteResult = await manager.delete(transactionCode);
    expect(deleteResult.success).toBe(true);
  });

  it("returns insufficient-balance error when transfer-out amount is too high", async () => {
    const manager = new TransactionManager("mock");
    const result = await manager.transferOut(999999999, 303);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
