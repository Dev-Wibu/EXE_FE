import type { ApiResponse, PaymentEntity, PaymentPurpose } from "@/interfaces";

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
    const responseData = (error.response as Record<string, unknown>).data;
    const responseMessage = extractErrorMessageFromPayload(responseData);
    if (responseMessage) {
      return responseMessage;
    }
  }

  if (error instanceof Error) {
    return asNonEmptyString(error.message) || fallback;
  }

  return fallback;
};

export interface PaymentCreateOptions {
  planId?: number;
  planName?: string;
  paymentPurpose?: PaymentPurpose;
}

const DEFAULT_PAYMENT_PURPOSE: PaymentPurpose = "BUY_MEMBERSHIP";

export class PaymentManager {
  private api = createApiInstance();

  private extractCheckoutUrl(payload: unknown): string | undefined {
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
      return this.extractCheckoutUrl(payload.data);
    }

    return undefined;
  }

  async getAll(): Promise<ApiResponse<PaymentEntity[]>> {
    try {
      const response = await this.api.get(API_ENDPOINTS.PAYMENTS.LIST);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Không thể tải danh sách thanh toán."),
      };
    }
  }

  async getById(id: number): Promise<ApiResponse<PaymentEntity>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.PAYMENTS.DETAIL, { id });
      const response = await this.api.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Không thể tải chi tiết thanh toán."),
      };
    }
  }

  async getByTransactionCode(transactionCode: string): Promise<ApiResponse<PaymentEntity>> {
    try {
      const response = await this.api.get(API_ENDPOINTS.PAYMENTS.LIST);
      const list = Array.isArray(response.data) ? (response.data as PaymentEntity[]) : [];
      const item = list.find((payment) => payment.transactionCode === transactionCode);

      if (!item) {
        return {
          success: false,
          error: "Không tìm thấy thanh toán theo transactionCode.",
        };
      }

      return {
        success: true,
        data: item,
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Không thể tải thanh toán theo transaction code."),
      };
    }
  }

  async create(
    amount: number,
    userId: number,
    options?: PaymentCreateOptions
  ): Promise<ApiResponse<string>> {
    const paymentPurpose = options?.paymentPurpose || DEFAULT_PAYMENT_PURPOSE;

    const normalizedAmount = normalizeAmount(amount);
    if (normalizedAmount <= 0) {
      return {
        success: false,
        error: "Số tiền thanh toán không hợp lệ.",
      };
    }

    try {
      const response = await this.api.post(API_ENDPOINTS.PAYMENTS.PAY, null, {
        params: {
          amount: normalizedAmount,
          userId: Number(userId),
          paymentPurpose,
        },
      });

      const checkoutUrl = this.extractCheckoutUrl(response.data);
      if (checkoutUrl) {
        return {
          success: true,
          data: checkoutUrl,
        };
      }

      return {
        success: false,
        error: "Backend không trả về link thanh toán hợp lệ.",
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Không thể tạo thanh toán mới."),
      };
    }
  }

  async cancel(transactionCode: string): Promise<ApiResponse<PaymentEntity>> {
    try {
      const response = await this.api.get(API_ENDPOINTS.PAYMENTS.CANCEL, {
        params: {
          transactionCode,
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Không thể hủy thanh toán."),
      };
    }
  }
}

export const paymentManager = new PaymentManager();
