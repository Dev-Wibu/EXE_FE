import type { ApiResponse, PaymentEntity, PaymentPurpose } from "@/interfaces";
import i18n from "@/lib/i18n";
const t = i18n.t.bind(i18n);

import { API_ENDPOINTS, buildEndpoint } from "@/constants/api.config";
import { fetchClient } from "@/lib/api";
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

const getErrorMessage = (error: unknown, fallback: string): string => {
  return getNormalizedErrorMessage(error, fallback);
};

export interface PaymentCreateOptions {
  planId?: number;
  planName?: string;
  paymentPurpose?: PaymentPurpose;
}

const DEFAULT_PAYMENT_PURPOSE: PaymentPurpose = "BUY_MEMBERSHIP";

export class PaymentManager {
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
      const response = await fetchClient.GET("/api/payments", {}).then((res) => ({
        data: res.data,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("general.unableToLoadPaymentList")),
      };
    }
  }

  async getById(id: number): Promise<ApiResponse<PaymentEntity>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.PAYMENTS.DETAIL, { id });
      // @ts-expect-error: Backend Swagger schema mismatch
      const response = await fetchClient.GET(endpoint, {}).then((res) => ({
        data: res.data,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      return {
        success: true,
        // @ts-expect-error: Backend Swagger schema mismatch
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("general.unableToLoadPaymentDetails")),
      };
    }
  }

  async getByTransactionCode(transactionCode: string): Promise<ApiResponse<PaymentEntity>> {
    try {
      const response = await fetchClient.GET("/api/payments", {}).then((res) => ({
        data: res.data,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      const list = Array.isArray(response.data) ? (response.data as PaymentEntity[]) : [];
      const item = list.find((payment) => payment.transactionCode === transactionCode);

      if (!item) {
        return {
          success: false,
          error: t("general.paymentByTransactioncodeNotFound"),
        };
      }

      return {
        success: true,
        data: item,
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("general.unableToLoadPaymentBy")),
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
        error: t("general.invalidPaymentAmount"),
      };
    }

    try {
      const response = await fetchClient
        .POST("/api/payments/pay", {
          params: {
            // @ts-expect-error: Backend Swagger schema mismatch
            amount: normalizedAmount,
            userId: Number(userId),
            paymentPurpose,
          },
        })
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));

      const checkoutUrl = this.extractCheckoutUrl(response.data);
      if (checkoutUrl) {
        return {
          success: true,
          data: checkoutUrl,
        };
      }

      return {
        success: false,
        error: t("general.theBackendDoesNotReturn"),
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("general.cannotCreateNewPayment")),
      };
    }
  }

  async cancel(transactionCode: string): Promise<ApiResponse<PaymentEntity>> {
    try {
      const response = await fetchClient
        .GET("/api/payments/cancel", {
          params: {
            // @ts-expect-error: Backend Swagger schema mismatch
            transactionCode,
          },
        })
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, t("common.paymentCannotBeCanceled")),
      };
    }
  }
}

export const paymentManager = new PaymentManager();
