import type { TransactionEntity } from "@/interfaces";

export type WalletBalanceSource = "user-detail" | "transactions" | "auth-store" | "unavailable";

export interface WalletBalanceResolution {
  walletBalance?: number;
  source: WalletBalanceSource;
  userDetailBalance?: number;
  transactionBalance?: number;
  authStoreBalance?: number;
  hasMismatch: boolean;
  mismatchDelta?: number;
}

const asFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return undefined;
    }

    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const getTransactionBalanceCandidate = (
  transactions: TransactionEntity[]
): { balance: number; transactionId?: number; index: number } | undefined => {
  let candidate: { balance: number; transactionId?: number; index: number } | undefined;

  for (const [index, transaction] of transactions.entries()) {
    const balance = asFiniteNumber(transaction.currentBalance);
    if (balance === undefined) {
      continue;
    }

    const transactionId = asFiniteNumber(transaction.id);
    if (!candidate) {
      candidate = {
        balance,
        transactionId,
        index,
      };
      continue;
    }

    const hasCandidateId = typeof candidate.transactionId === "number";
    const hasCurrentId = typeof transactionId === "number";

    if (hasCurrentId && hasCandidateId && transactionId >= (candidate.transactionId as number)) {
      candidate = {
        balance,
        transactionId,
        index,
      };
      continue;
    }

    if (hasCurrentId && !hasCandidateId) {
      candidate = {
        balance,
        transactionId,
        index,
      };
      continue;
    }

    if (!hasCurrentId && !hasCandidateId && index >= candidate.index) {
      candidate = {
        balance,
        transactionId,
        index,
      };
    }
  }

  return candidate;
};

export const getLatestTransactionBalance = (
  transactions: TransactionEntity[] | null | undefined
): number | undefined => {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return undefined;
  }

  return getTransactionBalanceCandidate(transactions)?.balance;
};

export const reconcileWalletBalance = (input: {
  userDetailBalance?: number;
  transactions?: TransactionEntity[] | null;
  authStoreBalance?: number;
}): WalletBalanceResolution => {
  const userDetailBalance = asFiniteNumber(input.userDetailBalance);
  const transactionBalance = getLatestTransactionBalance(input.transactions);
  const authStoreBalance = asFiniteNumber(input.authStoreBalance);

  const hasMismatch =
    typeof userDetailBalance === "number" &&
    typeof transactionBalance === "number" &&
    userDetailBalance !== transactionBalance;

  if (typeof userDetailBalance === "number") {
    return {
      walletBalance: userDetailBalance,
      source: "user-detail",
      userDetailBalance,
      transactionBalance,
      authStoreBalance,
      hasMismatch,
      mismatchDelta: hasMismatch ? userDetailBalance - transactionBalance : undefined,
    };
  }

  if (typeof transactionBalance === "number") {
    return {
      walletBalance: transactionBalance,
      source: "transactions",
      userDetailBalance,
      transactionBalance,
      authStoreBalance,
      hasMismatch,
    };
  }

  if (typeof authStoreBalance === "number") {
    return {
      walletBalance: authStoreBalance,
      source: "auth-store",
      userDetailBalance,
      transactionBalance,
      authStoreBalance,
      hasMismatch,
    };
  }

  return {
    source: "unavailable",
    userDetailBalance,
    transactionBalance,
    authStoreBalance,
    hasMismatch,
  };
};
