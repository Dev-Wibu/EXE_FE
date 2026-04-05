import type { ApiResponse, ManagerMode, PaymentEntity } from "@/interfaces";

import {
  API_ENDPOINTS,
  MANAGER_MODE,
  buildEndpoint,
  createApiInstance,
} from "@/constants/api.config";

import { transactionManager } from "./transaction.manager";

const SKELETON_REDIRECT_BASE = "/payment";

let mockPayments: PaymentEntity[] = [
  {
    id: 9001,
    amount: 199000,
    description: "Thanh toan goi PREMIUM (skeleton)",
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    transactionCode: "PAY-SKEL-9001",
  },
  {
    id: 9002,
    amount: 99000,
    description: "Thanh toan goi BASIC (skeleton)",
    status: "PENDING",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    transactionCode: "PAY-SKEL-9002",
  },
];

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeAmount = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.round(value);
};

const buildPaymentCode = (): string => {
  return `PAY-SKEL-${Date.now().toString(36).toUpperCase()}`;
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

const asNumber = (value: unknown): number | undefined => {
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

export interface PaymentCreateOptions {
  planId?: number;
  planName?: string;
}

export interface PaymentOrderResolution {
  orderCode: string;
  transactionCode: string;
  userId: number;
  planId: number;
  planName?: string;
  amount?: number;
  status?: string;
}

const mockOrderResolutions = new Map<string, PaymentOrderResolution>();

export class PaymentManager {
  private mode: ManagerMode;
  private api: ReturnType<typeof createApiInstance> | null;

  constructor(mode: ManagerMode = MANAGER_MODE) {
    this.mode = mode;
    this.api = this.mode === "api" ? createApiInstance() : null;
  }

  private getApiInstance() {
    return this.api ?? createApiInstance();
  }

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

  private unwrapPayload(payload: unknown): Record<string, unknown> | null {
    if (!isRecord(payload)) {
      return null;
    }

    if (isRecord(payload.data)) {
      return payload.data;
    }

    return payload;
  }

  private normalizeOrderResolution(
    payload: unknown,
    fallbackOrderCode: string
  ): PaymentOrderResolution | null {
    const candidate = this.unwrapPayload(payload);
    if (!candidate) {
      return null;
    }

    const userData = isRecord(candidate.user) ? candidate.user : null;
    const planData = isRecord(candidate.plan) ? candidate.plan : null;

    const orderCode =
      asNonEmptyString(candidate.orderCode) ||
      asNonEmptyString(candidate.transactionCode) ||
      fallbackOrderCode;

    const transactionCode = asNonEmptyString(candidate.transactionCode) || orderCode;
    const userId =
      asNumber(candidate.userId) || asNumber(userData?.id) || asNumber(userData?.userId);
    const planId =
      asNumber(candidate.planId) ||
      asNumber(candidate.membershipPlanId) ||
      asNumber(planData?.id) ||
      asNumber(planData?.planId);

    if (!userId || !planId) {
      return null;
    }

    return {
      orderCode,
      transactionCode,
      userId,
      planId,
      planName: asNonEmptyString(candidate.planName) || asNonEmptyString(planData?.name),
      amount: asNumber(candidate.amount),
      status: asNonEmptyString(candidate.status),
    };
  }

  private getSkeletonRedirectUrl(transactionCode: string): string {
    const query = new URLSearchParams({
      orderCode: transactionCode,
      status: "PAID",
      source: "payment-skeleton",
      mode: this.mode,
    });

    return `${SKELETON_REDIRECT_BASE}/success?${query.toString()}`;
  }

  async getAll(): Promise<ApiResponse<PaymentEntity[]>> {
    if (this.mode === "mock") {
      await delay();
      return {
        success: true,
        data: [...mockPayments],
        message: "Skeleton mode: chua ket noi API that cho payment.",
      };
    }

    try {
      const response = await this.getApiInstance().get(API_ENDPOINTS.PAYMENTS.LIST);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Khong the tai danh sach payment.",
      };
    }
  }

  async getById(id: number): Promise<ApiResponse<PaymentEntity>> {
    if (this.mode === "mock") {
      await delay();

      const item = mockPayments.find((payment) => payment.id === id);
      if (!item) {
        return {
          success: false,
          error: "Khong tim thay payment trong skeleton store.",
        };
      }

      return {
        success: true,
        data: item,
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.PAYMENTS.DETAIL, { id });
      const response = await this.getApiInstance().get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Khong the tai chi tiet payment.",
      };
    }
  }

  async getByTransactionCode(transactionCode: string): Promise<ApiResponse<PaymentEntity>> {
    if (this.mode === "mock") {
      await delay();

      const item = mockPayments.find((payment) => payment.transactionCode === transactionCode);
      if (!item) {
        return {
          success: false,
          error: "Khong tim thay payment theo transactionCode.",
        };
      }

      return {
        success: true,
        data: item,
      };
    }

    try {
      const response = await this.getApiInstance().get(API_ENDPOINTS.PAYMENTS.LIST);
      const list = Array.isArray(response.data) ? (response.data as PaymentEntity[]) : [];
      const item = list.find((payment) => payment.transactionCode === transactionCode);

      if (!item) {
        return {
          success: false,
          error: "Khong tim thay payment theo transactionCode.",
        };
      }

      return {
        success: true,
        data: item,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Khong the tai payment theo transaction code.",
      };
    }
  }

  async create(
    amount: number,
    userId: number,
    options?: PaymentCreateOptions
  ): Promise<ApiResponse<string>> {
    const normalizedAmount = normalizeAmount(amount);
    if (normalizedAmount <= 0) {
      return {
        success: false,
        error: "So tien thanh toan khong hop le.",
      };
    }

    if (this.mode === "mock") {
      await delay();

      const transactionCode = buildPaymentCode();
      mockPayments = [
        {
          id: Date.now(),
          amount: normalizedAmount,
          description: `Tao thanh toan PayOS (skeleton) cho user ${userId}`,
          status: "PENDING",
          createdAt: new Date().toISOString(),
          transactionCode,
        },
        ...mockPayments,
      ];

      mockOrderResolutions.set(transactionCode, {
        orderCode: transactionCode,
        transactionCode,
        userId: Number(userId),
        planId: Number(options?.planId || 0),
        planName: options?.planName,
        amount: normalizedAmount,
        status: "PENDING",
      });

      return {
        success: true,
        data: this.getSkeletonRedirectUrl(transactionCode),
        message: "Skeleton mode: da tao link thanh toan gia lap.",
      };
    }

    try {
      const response = await this.getApiInstance().post(API_ENDPOINTS.PAYMENTS.PAY, null, {
        params: {
          amount: normalizedAmount,
          userId: Number(userId),
        },
      });

      const checkoutUrl = this.extractCheckoutUrl(response.data);
      if (checkoutUrl) {
        return {
          success: true,
          data: checkoutUrl,
        };
      }

      const fallbackResult = await transactionManager.transferIn(normalizedAmount, Number(userId));
      if (fallbackResult.success && fallbackResult.data) {
        return {
          success: true,
          data: fallbackResult.data,
          message: "Khong lay duoc link tu payment API, da fallback sang transfer-in.",
        };
      }

      return {
        success: false,
        error: "Khong the tao link thanh toan tu payment API hoac transfer-in fallback.",
      };
    } catch (error) {
      const fallbackResult = await transactionManager.transferIn(normalizedAmount, Number(userId));
      if (fallbackResult.success && fallbackResult.data) {
        return {
          success: true,
          data: fallbackResult.data,
          message: "Payment API loi, da fallback sang transfer-in.",
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Khong the tao payment moi.",
      };
    }
  }

  async cancel(transactionCode: string): Promise<ApiResponse<PaymentEntity>> {
    if (this.mode === "mock") {
      await delay();

      const existing = mockPayments.find((payment) => payment.transactionCode === transactionCode);

      if (existing) {
        existing.status = "FAILED";
        const resolution = mockOrderResolutions.get(transactionCode);
        if (resolution) {
          mockOrderResolutions.set(transactionCode, {
            ...resolution,
            status: "FAILED",
          });
        }

        return {
          success: true,
          data: existing,
          message: "Skeleton mode: da cap nhat payment sang FAILED.",
        };
      }

      const fallbackItem: PaymentEntity = {
        id: Date.now(),
        amount: 0,
        description: "Cancel payment fallback (skeleton)",
        status: "FAILED",
        createdAt: new Date().toISOString(),
        transactionCode,
      };

      mockPayments = [fallbackItem, ...mockPayments];
      const resolution = mockOrderResolutions.get(transactionCode);
      if (resolution) {
        mockOrderResolutions.set(transactionCode, {
          ...resolution,
          status: "FAILED",
        });
      }

      return {
        success: true,
        data: fallbackItem,
        message: "Skeleton mode: khong tim thay payment cu, da tao ban ghi fallback.",
      };
    }

    try {
      const response = await this.getApiInstance().get(API_ENDPOINTS.PAYMENTS.CANCEL, {
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
        error: error instanceof Error ? error.message : "Khong the huy payment.",
      };
    }
  }

  async resolveOrder(orderCode: string): Promise<ApiResponse<PaymentOrderResolution>> {
    const normalizedOrderCode = asNonEmptyString(orderCode);
    if (!normalizedOrderCode) {
      return {
        success: false,
        error: "Thieu orderCode de map thanh userId va planId.",
      };
    }

    if (this.mode === "mock") {
      await delay();

      const item = mockOrderResolutions.get(normalizedOrderCode);
      if (!item) {
        return {
          success: false,
          error: "Mock resolver khong tim thay mapping cho orderCode.",
        };
      }

      return {
        success: true,
        data: item,
      };
    }

    const endpointTemplate = API_ENDPOINTS.PAYMENTS.RESOLVE_ORDER;
    if (!endpointTemplate) {
      return {
        success: false,
        error: "Chua cau hinh endpoint resolve orderCode tren frontend.",
      };
    }

    try {
      const usePathParam = endpointTemplate.includes(":orderCode");
      const endpoint = usePathParam
        ? buildEndpoint(endpointTemplate, { orderCode: normalizedOrderCode })
        : endpointTemplate;

      const response = await this.getApiInstance().get(endpoint, {
        params: usePathParam
          ? undefined
          : {
              orderCode: normalizedOrderCode,
            },
      });

      const normalized = this.normalizeOrderResolution(response.data, normalizedOrderCode);
      if (!normalized) {
        return {
          success: false,
          error: "Backend resolver khong tra du userId/planId hop le.",
        };
      }

      return {
        success: true,
        data: normalized,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Khong the resolve orderCode.",
      };
    }
  }
}

export const paymentManager = new PaymentManager();
