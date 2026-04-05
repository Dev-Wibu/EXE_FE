import type { ApiResponse, ManagerMode, TransactionEntity } from "@/interfaces";

import {
  API_ENDPOINTS,
  MANAGER_MODE,
  buildEndpoint,
  createApiInstance,
} from "@/constants/api.config";

const SKELETON_REDIRECT_BASE = "/payment";

let mockTransactions: TransactionEntity[] = [
  {
    id: 1001,
    amount: 199000,
    description: "Thanh toan goi PREMIUM (skeleton)",
    transactionCode: "TXN-SKEL-1001",
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    transactionType: false,
    currentBalance: 1200000,
  },
  {
    id: 1002,
    amount: 500000,
    description: "Nap vi qua PayOS (skeleton)",
    transactionCode: "TXN-SKEL-1002",
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    transactionType: true,
    currentBalance: 1700000,
  },
];

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeAmount = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.round(value);
};

const buildTransactionCode = (): string => {
  return `TXN-SKEL-${Date.now().toString(36).toUpperCase()}`;
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
  private mode: ManagerMode;
  private api: ReturnType<typeof createApiInstance> | null;

  constructor(mode: ManagerMode = MANAGER_MODE) {
    this.mode = mode;
    this.api = this.mode === "api" ? createApiInstance() : null;
  }

  private getApiInstance() {
    return this.api ?? createApiInstance();
  }

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

  private getSkeletonRedirectUrl(transactionCode: string, status: "PAID" | "CANCELLED"): string {
    const query = new URLSearchParams({
      orderCode: transactionCode,
      status,
      source: "transaction-skeleton",
      mode: this.mode,
    });

    return `${SKELETON_REDIRECT_BASE}/${status === "PAID" ? "success" : "cancel"}?${query.toString()}`;
  }

  async getAll(): Promise<ApiResponse<TransactionEntity[]>> {
    if (this.mode === "mock") {
      await delay();
      return {
        success: true,
        data: [...mockTransactions],
        message: "Skeleton mode: chua ket noi API that cho giao dich.",
      };
    }

    try {
      const response = await this.getApiInstance().get(API_ENDPOINTS.TRANSACTIONS.LIST);
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
    if (this.mode === "mock") {
      await delay();

      const item = mockTransactions.find((tx) => tx.transactionCode === transactionCode);
      if (!item) {
        return {
          success: false,
          error: "Khong tim thay giao dich trong skeleton store.",
        };
      }

      return {
        success: true,
        data: item,
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.TRANSACTIONS.DETAIL, {
        transactionCode,
      });
      const response = await this.getApiInstance().get(endpoint);
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
    if (this.mode === "mock") {
      await delay();
      return {
        success: true,
        data: [...mockTransactions],
        message: `Skeleton mode: danh sach giao dich mo phong cho user ${userId}.`,
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.TRANSACTIONS.BY_USER, {
        userId: Number(userId),
      });
      const response = await this.getApiInstance().get(endpoint);
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

    if (this.mode === "mock") {
      await delay();

      const transactionCode = buildTransactionCode();
      const currentBalance = (mockTransactions[0]?.currentBalance || 0) + normalizedAmount;

      mockTransactions = [
        {
          id: Date.now(),
          amount: normalizedAmount,
          description: `Nap vi (skeleton transfer-in) cho user ${userId}`,
          transactionCode,
          createdAt: new Date().toISOString(),
          transactionType: true,
          currentBalance,
        },
        ...mockTransactions,
      ];

      return {
        success: true,
        data: this.getSkeletonRedirectUrl(transactionCode, "PAID"),
        message: "Skeleton mode: da tao link thanh toan gia lap transfer-in.",
      };
    }

    try {
      const response = await this.getApiInstance().post(
        API_ENDPOINTS.TRANSACTIONS.TRANSFER_IN,
        null,
        {
          params: {
            amount: normalizedAmount,
            userId: Number(userId),
          },
        }
      );

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

    if (this.mode === "mock") {
      await delay();

      const currentBalance = mockTransactions[0]?.currentBalance || 0;
      if (currentBalance < normalizedAmount) {
        return {
          success: false,
          error: "So du vi khong du de thanh toan.",
        };
      }

      const transactionCode = buildTransactionCode();
      mockTransactions = [
        {
          id: Date.now(),
          amount: normalizedAmount,
          description: `Thanh toan tu vi (skeleton transfer-out) cho user ${userId}`,
          transactionCode,
          createdAt: new Date().toISOString(),
          transactionType: false,
          currentBalance: currentBalance - normalizedAmount,
        },
        ...mockTransactions,
      ];

      return {
        success: true,
        data: this.getSkeletonRedirectUrl(transactionCode, "PAID"),
        message: "Skeleton mode: da tao ket qua thanh toan gia lap transfer-out.",
      };
    }

    try {
      const response = await this.getApiInstance().post(
        API_ENDPOINTS.TRANSACTIONS.TRANSFER_OUT,
        null,
        {
          params: {
            amount: normalizedAmount,
            userId: Number(userId),
          },
        }
      );

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
    if (this.mode === "mock") {
      await delay();

      mockTransactions = mockTransactions.filter((tx) => tx.transactionCode !== transactionCode);

      return {
        success: true,
        message: "Skeleton mode: da xoa giao dich (neu co) theo transactionCode.",
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.TRANSACTIONS.DELETE, {
        transactionCode,
      });
      await this.getApiInstance().delete(endpoint);
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
