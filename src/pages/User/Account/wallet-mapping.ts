import type { PaymentPurpose, TransactionEntity } from "@/interfaces";

export type AccountTransactionDirection = "in" | "out";
export type AccountTransactionType = "deposit" | "payment" | "refund" | "unknown";
export type AccountTransactionStatus = "completed" | "pending";

export interface AccountTransactionItem {
  id: number;
  type: AccountTransactionType;
  status?: AccountTransactionStatus;
  direction: AccountTransactionDirection;
  amount: number;
  absoluteAmount: number;
  date: string;
  transactionCode: string;
  purpose: PaymentPurpose | "UNKNOWN";
  hasClassifiedPurpose: boolean;
  purposeLabel: string;
  description: string;
  currentBalance?: number;
}

const normalizePaymentPurpose = (
  value: TransactionEntity["paymentPurpose"] | ""
): PaymentPurpose | "UNKNOWN" => {
  return value === "BUY_MEMBERSHIP" ||
    value === "TOP_UP_WALLET" ||
    value === "WITHDRAW_FROM_WALLET" ||
    value === "MENTOR_INTERVIEW"
    ? value
    : "UNKNOWN";
};

const resolvePurpose = (transaction: TransactionEntity): PaymentPurpose | "UNKNOWN" => {
  return normalizePaymentPurpose(
    (transaction.paymentPurpose as TransactionEntity["paymentPurpose"] | "") || ""
  );
};

const hasMeaningfulDescription = (value: TransactionEntity["description"]): boolean => {
  return typeof value === "string" && value.trim().length > 0;
};

const hasZeroCurrentBalance = (value: TransactionEntity["currentBalance"]): boolean => {
  return typeof value === "number" && Number.isFinite(value) && value === 0;
};

export const shouldHideTransactionFromHistory = (transaction: TransactionEntity): boolean => {
  const purpose = resolvePurpose(transaction);
  if (purpose !== "UNKNOWN") {
    return false;
  }

  return (
    !hasMeaningfulDescription(transaction.description) &&
    hasZeroCurrentBalance(transaction.currentBalance)
  );
};

const resolveDirection = (
  transaction: TransactionEntity,
  purpose: PaymentPurpose | "UNKNOWN"
): AccountTransactionDirection => {
  if (purpose === "TOP_UP_WALLET") {
    return "in";
  }

  if (
    purpose === "WITHDRAW_FROM_WALLET" ||
    purpose === "BUY_MEMBERSHIP" ||
    purpose === "MENTOR_INTERVIEW"
  ) {
    return "out";
  }

  if (transaction.transactionType === true) {
    return "in";
  }

  if (transaction.transactionType === false) {
    return "out";
  }

  return Number(transaction.amount || 0) >= 0 ? "in" : "out";
};

export const getTransactionPurposeLabel = (purpose: PaymentPurpose | "UNKNOWN"): string => {
  switch (purpose) {
    case "TOP_UP_WALLET":
      return "Nạp tiền vào ví";
    case "WITHDRAW_FROM_WALLET":
      return "Rút tiền từ ví";
    case "BUY_MEMBERSHIP":
      return "Thanh toán gói thành viên";
    case "MENTOR_INTERVIEW":
      return "Thanh toán phiên mentor";
    default:
      return "Giao dịch chưa phân loại";
  }
};

const resolveType = (
  purpose: PaymentPurpose | "UNKNOWN",
  direction: AccountTransactionDirection
): AccountTransactionType => {
  switch (purpose) {
    case "TOP_UP_WALLET":
      return "deposit";
    case "WITHDRAW_FROM_WALLET":
      return "refund";
    case "BUY_MEMBERSHIP":
    case "MENTOR_INTERVIEW":
      return "payment";
    default:
      return direction === "in" ? "deposit" : "payment";
  }
};

const resolveStatus = (
  purpose: PaymentPurpose | "UNKNOWN"
): AccountTransactionStatus | undefined => {
  if (purpose === "UNKNOWN") {
    return undefined;
  }

  return "completed";
};

export const mapTransactionToAccountTransaction = (
  transaction: TransactionEntity
): AccountTransactionItem => {
  const purpose = resolvePurpose(transaction);
  const direction = resolveDirection(transaction, purpose);
  const sourceAmount = Number(transaction.amount || 0);
  const absoluteAmount = Math.abs(sourceAmount);
  const amount = direction === "in" ? absoluteAmount : -absoluteAmount;
  const purposeLabel = getTransactionPurposeLabel(purpose);
  const hasClassifiedPurpose = purpose !== "UNKNOWN";
  const description =
    (transaction.description || "").trim() ||
    (hasClassifiedPurpose ? purposeLabel : "Giao dịch ví");

  return {
    id: Number(transaction.id || Date.now()),
    type: resolveType(purpose, direction),
    status: resolveStatus(purpose),
    direction,
    amount,
    absoluteAmount,
    date: transaction.createdAt || new Date().toISOString(),
    transactionCode: transaction.transactionCode || "—",
    purpose,
    hasClassifiedPurpose,
    purposeLabel,
    description,
    currentBalance:
      typeof transaction.currentBalance === "number" && Number.isFinite(transaction.currentBalance)
        ? transaction.currentBalance
        : undefined,
  };
};
