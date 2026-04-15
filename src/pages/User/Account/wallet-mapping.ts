import type { PaymentPurpose, TransactionEntity } from "@/interfaces";
import type { Transaction } from "@/mocks/user.mock";

type WalletScopedPurpose = "TOP_UP_WALLET" | "WITHDRAW_FROM_WALLET" | "UNKNOWN";

const normalizePaymentPurpose = (
  value: TransactionEntity["paymentPurpose"] | ""
): PaymentPurpose | undefined => {
  return value === "BUY_MEMBERSHIP" ||
    value === "TOP_UP_WALLET" ||
    value === "WITHDRAW_FROM_WALLET" ||
    value === "MENTOR_INTERVIEW"
    ? value
    : undefined;
};

const resolveWalletScopedPurpose = (
  transaction: TransactionEntity
): WalletScopedPurpose | "EXCLUDED" => {
  const normalizedPurpose = normalizePaymentPurpose(
    (transaction.paymentPurpose as TransactionEntity["paymentPurpose"] | "") || ""
  );

  if (normalizedPurpose === "TOP_UP_WALLET" || normalizedPurpose === "WITHDRAW_FROM_WALLET") {
    return normalizedPurpose;
  }

  if (normalizedPurpose === "BUY_MEMBERSHIP" || normalizedPurpose === "MENTOR_INTERVIEW") {
    return "EXCLUDED";
  }

  return "UNKNOWN";
};

export const isWalletScopedTransaction = (transaction: TransactionEntity): boolean => {
  return resolveWalletScopedPurpose(transaction) !== "EXCLUDED";
};

export const mapTransactionToWalletTransaction = (transaction: TransactionEntity): Transaction => {
  const scopedPurpose = resolveWalletScopedPurpose(transaction);
  const sourceAmount = Number(transaction.amount || 0);
  const absoluteAmount = Math.abs(sourceAmount);

  const isIncoming =
    scopedPurpose === "TOP_UP_WALLET"
      ? true
      : scopedPurpose === "WITHDRAW_FROM_WALLET"
        ? false
        : transaction.transactionType === true
          ? true
          : transaction.transactionType === false
            ? false
            : sourceAmount >= 0;

  const type: Transaction["type"] =
    scopedPurpose === "TOP_UP_WALLET"
      ? "deposit"
      : scopedPurpose === "WITHDRAW_FROM_WALLET"
        ? "refund"
        : "unknown";

  const description =
    transaction.description ||
    (scopedPurpose === "TOP_UP_WALLET"
      ? "Nạp tiền vào ví"
      : scopedPurpose === "WITHDRAW_FROM_WALLET"
        ? "Rút tiền từ ví"
        : "Giao dịch ví (không xác định)");

  const status: Transaction["status"] = scopedPurpose === "UNKNOWN" ? "pending" : "completed";

  return {
    id: Number(transaction.id || Date.now()),
    type,
    amount: isIncoming ? absoluteAmount : -absoluteAmount,
    date: transaction.createdAt || new Date().toISOString(),
    description,
    status,
  };
};
