import type { ApiResponse, TransactionEntity } from "@/interfaces";

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
        error: error instanceof Error ? error.message : "Khong the tai danh sach giao dich.",
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
        error: error instanceof Error ? error.message : "Khong the tai chi tiet giao dich.",
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
        error: error instanceof Error ? error.message : "Khong the tai giao dich theo user.",
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
        error: error instanceof Error ? error.message : "Khong the tao giao dich transfer-in.",
      };
    }
  }

  async transferOut(amount: number, userId: number): Promise<ApiResponse<string>> {
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
        },
      });

      const redirectUrl = this.extractRedirectUrl(response.data);
      if (!redirectUrl) {
        return {
          success: false,
          error: "Backend khong tra ve ket qua hop le cho transfer-out.",
        };
      }

      return {
        success: true,
        data: redirectUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Khong the tao giao dich transfer-out.",
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
        error: error instanceof Error ? error.message : "Khong the xoa giao dich.",
      };
    }
  }
}

export const transactionManager = new TransactionManager();
