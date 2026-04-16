import { describe, expect, it } from "vitest";

import type { TransactionEntity } from "@/interfaces";

import {
  getTransactionPurposeLabel,
  mapTransactionToAccountTransaction,
  shouldHideTransactionFromHistory,
} from "./wallet-mapping";

const buildTransaction = (override?: Partial<TransactionEntity>): TransactionEntity => ({
  id: 1,
  amount: 100000,
  createdAt: "2026-04-15T10:00:00.000Z",
  transactionCode: "TX-001",
  ...override,
});

describe("wallet-mapping", () => {
  it("maps TOP_UP_WALLET to incoming deposit row", () => {
    const mapped = mapTransactionToAccountTransaction(
      buildTransaction({
        paymentPurpose: "TOP_UP_WALLET",
        transactionType: false,
        amount: 250000,
      })
    );

    expect(mapped.type).toBe("deposit");
    expect(mapped.direction).toBe("in");
    expect(mapped.amount).toBe(250000);
    expect(mapped.purposeLabel).toBe("Nạp tiền vào ví");
    expect(mapped.status).toBe("completed");
  });

  it("maps WITHDRAW_FROM_WALLET to outgoing withdrawal row", () => {
    const mapped = mapTransactionToAccountTransaction(
      buildTransaction({
        paymentPurpose: "WITHDRAW_FROM_WALLET",
        transactionType: true,
        amount: 120000,
      })
    );

    expect(mapped.type).toBe("refund");
    expect(mapped.direction).toBe("out");
    expect(mapped.amount).toBe(-120000);
    expect(mapped.description).toBe("Rút tiền từ ví");
    expect(mapped.status).toBe("completed");
  });

  it("maps membership payment to outgoing payment row", () => {
    const mapped = mapTransactionToAccountTransaction(
      buildTransaction({
        paymentPurpose: "BUY_MEMBERSHIP",
        transactionType: false,
        amount: 500000,
        description: undefined,
      })
    );

    expect(mapped.type).toBe("payment");
    expect(mapped.direction).toBe("out");
    expect(mapped.amount).toBe(-500000);
    expect(mapped.purposeLabel).toBe("Thanh toán gói thành viên");
    expect(mapped.description).toBe("Thanh toán gói thành viên");
    expect(mapped.status).toBe("completed");
  });

  it("does not synthesize pending status when purpose is unknown", () => {
    const mapped = mapTransactionToAccountTransaction(
      buildTransaction({
        paymentPurpose: "" as unknown as TransactionEntity["paymentPurpose"],
        transactionType: false,
        amount: 90000,
      })
    );

    expect(mapped.type).toBe("payment");
    expect(mapped.amount).toBe(-90000);
    expect(mapped.purposeLabel).toBe("Giao dịch chưa phân loại");
    expect(mapped.status).toBeUndefined();
    expect(mapped.hasClassifiedPurpose).toBe(false);
  });

  it("uses neutral fallback description for unknown-purpose rows", () => {
    const mapped = mapTransactionToAccountTransaction(
      buildTransaction({
        paymentPurpose: "" as unknown as TransactionEntity["paymentPurpose"],
        description: undefined,
      })
    );

    expect(mapped.description).toBe("Giao dịch ví");
  });

  it("hides null-purpose rows created by cancel tests", () => {
    const shouldHide = shouldHideTransactionFromHistory(
      buildTransaction({
        paymentPurpose: "" as unknown as TransactionEntity["paymentPurpose"],
        description: undefined,
        currentBalance: 0,
      })
    );

    expect(shouldHide).toBe(true);
  });

  it("keeps null-purpose rows when they still contain useful data", () => {
    const withDescription = shouldHideTransactionFromHistory(
      buildTransaction({
        paymentPurpose: "" as unknown as TransactionEntity["paymentPurpose"],
        description: "Nạp tiền vào ví Inblue",
        currentBalance: 0,
      })
    );

    const withBalanceSignal = shouldHideTransactionFromHistory(
      buildTransaction({
        paymentPurpose: "" as unknown as TransactionEntity["paymentPurpose"],
        description: undefined,
        currentBalance: 150000,
      })
    );

    expect(withDescription).toBe(false);
    expect(withBalanceSignal).toBe(false);
  });

  it("returns vietnamese purpose labels", () => {
    expect(getTransactionPurposeLabel("MENTOR_INTERVIEW")).toBe("Thanh toán phiên mentor");
    expect(getTransactionPurposeLabel("UNKNOWN")).toBe("Giao dịch chưa phân loại");
  });
});
