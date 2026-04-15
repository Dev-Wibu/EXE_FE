import type { ApiResponse, PaymentPurpose, TransactionEntity } from "@/interfaces";

import { API_ENDPOINTS, buildEndpoint, createApiInstance } from "@/constants/api.config";

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

const isInsufficientBalanceError = (statusCode: unknown, message?: string): boolean => {
  const status = asFiniteNumber(statusCode);
  if (status === 402) {
    return true;
  }

  const normalized = (message || "").toLowerCase();
  return (
    normalized.includes("insufficient balance") ||
    normalized.includes("số dư") ||
    normalized.includes("so du")
  );
};

const extractErrorMessageFromPayload = (payload: unknown): string | undefined => {
  if (typeof payload === "string") {
    return asNonEmptyString(payload);
  }

  if (!isRecord(payload)) {
    return undefined;
  }

  return (
    asNonEmptyString(payload.message) ||
    asNonEmptyString(payload.error) ||
    asNonEmptyString(payload.detail) ||
    asNonEmptyString(payload.title)
  );
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (isRecord(error) && isRecord(error.response)) {
    const response = error.response as Record<string, unknown>;
    const responseData = response.data;
    const responseMessage = extractErrorMessageFromPayload(responseData);
    if (isInsufficientBalanceError(response.status, responseMessage)) {
      return "Số dư ví không đủ. Vui lòng nạp thêm tiền hoặc chọn phương thức khác.";
    }

    if (responseMessage) {
      return responseMessage;
    }
  }

  if (error instanceof Error) {
    return asNonEmptyString(error.message) || fallback;
  }

  return fallback;
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
          message: "Đã tạo liên kết xử lý giao dịch.",
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
      (redirectUrl ? "Đã tạo liên kết xử lý giao dịch." : "Giao dịch ví đã được xử lý.");

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
        error: getErrorMessage(error, "Khong the tai danh sach giao dich."),
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
        error: getErrorMessage(error, "Khong the tai chi tiet giao dich."),
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
        error: getErrorMessage(error, "Khong the tai giao dich theo user."),
      };
    }
  }

  async transferIn(amount: number, userId: number): Promise<ApiResponse<string>> {
    const normalizedAmount = normalizeAmount(amount);
    if (normalizedAmount <= 0) {
      return {
        success: false,
        error: "So tien nap vi khong hop le.",
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
          error: "Backend khong tra ve link redirect hop le cho transfer-in.",
        };
      }

      return {
        success: true,
        data: redirectUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Khong the tao giao dich transfer-in."),
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
        error: "So tien thanh toan khong hop le.",
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
          error: "Backend khong tra ve ket qua hop le cho transfer-out.",
        };
      }

      return {
        success: true,
        data: transferOutResult,
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Khong the tao giao dich transfer-out."),
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
        error: getErrorMessage(error, "Khong the xoa giao dich."),
      };
    }
  }
}

export const transactionManager = new TransactionManager();
