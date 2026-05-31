import type { ApiResponse, PaymentPurpose, TransactionEntity } from "@/interfaces";
import i18n from "@/lib/i18n";
const t = i18n.t.bind(i18n);

import { API_ENDPOINTS, buildEndpoint, createApiInstance } from "@/constants/api.config";
import { getNormalizedErrorMessage } from "@/lib/error-normalizer";

const normalizeAmount = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.round(value);
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const asNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const asFiniteNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
};

const isLikelyHttpUrl = (value: string): boolean => {
  return /^https?:\/\//i.test(value.trim());
};

const extractCurrentBalanceFromMessage = (value: string): number | undefined => {
  const match = value.match(/current\s+balance\s*:\s*(-?\d+(?:\.\d+)?)/i);
  if (!match) {
    return undefined;
  }

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  return getNormalizedErrorMessage(error, fallback);
};

const DEFAULT_TRANSFER_OUT_PURPOSE: PaymentPurpose = "WITHDRAW_FROM_WALLET";

export interface TransferOutResult {
  message: string;
  redirectUrl?: string;
  transactionCode?: string;
  currentBalance?: number;
  status?: string;
}

export class TransactionManager {
  private api = createApiInstance();

  private extractRedirectUrl(payload: unknown): string | undefined {
    if (typeof payload === "string") {
      return asNonEmptyString(payload);
    }

    if (!isRecord(payload)) {
      return undefined;
    }

    const direct =
      asNonEmptyString(payload.checkoutUrl) ||
      asNonEmptyString(payload.paymentUrl) ||
      asNonEmptyString(payload.redirectUrl) ||
      asNonEmptyString(payload.link) ||
      asNonEmptyString(payload.url);

    if (direct) {
      return direct;
    }

    if (isRecord(payload.data)) {
      return this.extractRedirectUrl(payload.data);
    }

    return undefined;
  }

  private extractTransferOutResult(payload: unknown): TransferOutResult | undefined {
    if (typeof payload === "string") {
      const normalized = asNonEmptyString(payload);
      if (!normalized) {
        return undefined;
      }

      if (isLikelyHttpUrl(normalized)) {
        return {
          message: t("general.transactionProcessingLinkCreated"),
          redirectUrl: normalized,
        };
      }

      return {
        message: normalized,
        currentBalance: extractCurrentBalanceFromMessage(normalized),
      };
    }

    if (!isRecord(payload)) {
      return undefined;
    }

    const redirectUrl = this.extractRedirectUrl(payload);
    const transactionCode =
      asNonEmptyString(payload.transactionCode) ||
      asNonEmptyString(payload.code) ||
      asNonEmptyString(payload.transaction_id);
    const currentBalance =
      asFiniteNumber(payload.currentBalance) ||
      asFiniteNumber(payload.balance) ||
      asFiniteNumber(payload.newBalance);
    const status = asNonEmptyString(payload.status) || asNonEmptyString(payload.result);
    const explicitMessage =
      asNonEmptyString(payload.message) ||
      asNonEmptyString(payload.error) ||
      asNonEmptyString(payload.detail) ||
      asNonEmptyString(payload.title);

    const hasStructuredSignal =
      Boolean(redirectUrl) ||
      Boolean(transactionCode) ||
      currentBalance !== undefined ||
      Boolean(status) ||
      Boolean(explicitMessage);

    if (!hasStructuredSignal) {
      return undefined;
    }

    const message =
      explicitMessage ||
      (redirectUrl
        ? t("general.transactionProcessingLinkCreated")
        : t("general.walletTransactionHasBeenProcessed"));

    if (!message && !redirectUrl && !transactionCode && currentBalance === undefined && !status) {
      return undefined;
    }

    return {
      message,
      redirectUrl,
      transactionCode,
      currentBalance,
      status,
    };
  }

  async getAll(): Promise<ApiResponse<TransactionEntity[]>> {
    try {
      const response = await this.api.get(API_ENDPOINTS.TRANSACTIONS.LIST);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("general.unableToLoadTransactionList")),
      };
    }
  }

  async getByTransactionCode(transactionCode: string): Promise<ApiResponse<TransactionEntity>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.TRANSACTIONS.DETAIL, {
        transactionCode,
      });
      const response = await this.api.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("general.unableToLoadTransactionDetails")),
      };
    }
  }

  async getByUserId(userId: number): Promise<ApiResponse<TransactionEntity[]>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.TRANSACTIONS.BY_USER, {
        userId: Number(userId),
      });
      const response = await this.api.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("general.unableToLoadTransactionsBy")),
      };
    }
  }

  async transferIn(amount: number, userId: number): Promise<ApiResponse<string>> {
    const normalizedAmount = normalizeAmount(amount);
    if (normalizedAmount <= 0) {
      return {
        success: false,
        error: t("general.invalidWalletDepositAmount"),
      };
    }

    try {
      const response = await this.api.post(API_ENDPOINTS.TRANSACTIONS.TRANSFER_IN, null, {
        params: {
          amount: normalizedAmount,
          userId: Number(userId),
        },
      });

      const redirectUrl = this.extractRedirectUrl(response.data);
      if (!redirectUrl) {
        return {
          success: false,
          error: t("general.theBackendDoesNotReturn1"),
        };
      }

      return {
        success: true,
        data: redirectUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("general.unableToCreateTransferIn")),
      };
    }
  }

  async transferOut(
    amount: number,
    userId: number,
    paymentPurpose: PaymentPurpose = DEFAULT_TRANSFER_OUT_PURPOSE
  ): Promise<ApiResponse<TransferOutResult>> {
    const normalizedAmount = normalizeAmount(amount);
    if (normalizedAmount <= 0) {
      return {
        success: false,
        error: t("general.invalidPaymentAmount"),
      };
    }

    try {
      const response = await this.api.post(API_ENDPOINTS.TRANSACTIONS.TRANSFER_OUT, null, {
        params: {
          amount: normalizedAmount,
          userId: Number(userId),
          paymentPurpose,
        },
      });

      const transferOutResult = this.extractTransferOutResult(response.data);
      if (!transferOutResult) {
        return {
          success: false,
          error: t("general.backendDoesNotReturnValid"),
        };
      }

      return {
        success: true,
        data: transferOutResult,
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("general.cannotCreateTransferOutTransaction")),
      };
    }
  }

  async delete(transactionCode: string): Promise<ApiResponse<void>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.TRANSACTIONS.DELETE, {
        transactionCode,
      });
      await this.api.delete(endpoint);
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("general.transactionCannotBeDeleted")),
      };
    }
  }
}

export const transactionManager = new TransactionManager();
