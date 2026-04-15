import { describe, expect, it } from "vitest";

import type { TransactionEntity } from "@/interfaces";

import { isWalletScopedTransaction, mapTransactionToWalletTransaction } from "./wallet-mapping";

const buildTransaction = (override?: Partial<TransactionEntity>): TransactionEntity => ({
  id: 1,
  amount: 100000,
  createdAt: "2026-04-15T10:00:00.000Z",
  transactionCode: "TX-001",
  ...override,
});

describe("wallet-mapping", () => {
  it("keeps only wallet-scoped purposes and unknown purpose records", () => {
    expect(isWalletScopedTransaction(buildTransaction({ paymentPurpose: "TOP_UP_WALLET" }))).toBe(
      true
    );
    expect(
      isWalletScopedTransaction(buildTransaction({ paymentPurpose: "WITHDRAW_FROM_WALLET" }))
    ).toBe(true);
    expect(isWalletScopedTransaction(buildTransaction({ paymentPurpose: "BUY_MEMBERSHIP" }))).toBe(
      false
    );
    expect(
      isWalletScopedTransaction(buildTransaction({ paymentPurpose: "MENTOR_INTERVIEW" }))
    ).toBe(false);
    expect(
      isWalletScopedTransaction(
        buildTransaction({ paymentPurpose: "" as unknown as TransactionEntity["paymentPurpose"] })
      )
    ).toBe(true);
  });

  it("maps TOP_UP_WALLET to incoming deposit row", () => {
    const mapped = mapTransactionToWalletTransaction(
      buildTransaction({
        paymentPurpose: "TOP_UP_WALLET",
        transactionType: false,
        amount: 250000,
      })
    );

    expect(mapped.type).toBe("deposit");
    expect(mapped.amount).toBe(250000);
    expect(mapped.description).toBe("Nạp tiền vào ví");
    expect(mapped.status).toBe("completed");
  });

  it("maps WITHDRAW_FROM_WALLET to outgoing withdrawal row", () => {
    const mapped = mapTransactionToWalletTransaction(
      buildTransaction({
        paymentPurpose: "WITHDRAW_FROM_WALLET",
        transactionType: true,
        amount: 120000,
      })
    );

    expect(mapped.type).toBe("refund");
    expect(mapped.amount).toBe(-120000);
    expect(mapped.description).toBe("Rút tiền từ ví");
    expect(mapped.status).toBe("completed");
  });

  it("marks unknown-purpose rows as unknown and pending", () => {
    const mapped = mapTransactionToWalletTransaction(
      buildTransaction({
        paymentPurpose: "" as unknown as TransactionEntity["paymentPurpose"],
        transactionType: false,
        amount: 90000,
      })
    );

    expect(mapped.type).toBe("unknown");
    expect(mapped.amount).toBe(-90000);
    expect(mapped.description).toBe("Giao dịch ví (không xác định)");
    expect(mapped.status).toBe("pending");
  });
});
