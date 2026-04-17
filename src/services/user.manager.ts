/**
 * User Manager
 * Handles user profile and wallet operations
 */

import type { ApiResponse, User, UserSubscriptionResponse } from "@/interfaces";

import { API_ENDPOINTS, buildEndpoint, createApiInstance } from "@/constants/api.config";

type UserProfile = Record<string, unknown>;
type UserSettings = Record<string, unknown>;
type Wallet = Record<string, unknown>;
type Transaction = Record<string, unknown>;

export class UserManager {
  private api = createApiInstance();

  /**
   * Get user profile
   */
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    try {
      const response = await this.api.get(API_ENDPOINTS.USER.PROFILE);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tải hồ sơ",
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    try {
      const response = await this.api.post(API_ENDPOINTS.USER.UPDATE_PROFILE, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể cập nhật hồ sơ",
      };
    }
  }

  /**
   * Update user password
   */
  async updatePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await this.api.post(API_ENDPOINTS.USER.UPDATE_PASSWORD, {
        currentPassword,
        newPassword,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể cập nhật mật khẩu",
      };
    }
  }

  /**
   * Get user settings
   */
  async getSettings(): Promise<ApiResponse<UserSettings>> {
    try {
      const response = await this.api.get(API_ENDPOINTS.USER.SETTINGS);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tải cài đặt",
      };
    }
  }

  /**
   * Update user settings
   */
  async updateSettings(settings: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> {
    try {
      const response = await this.api.post(API_ENDPOINTS.USER.SETTINGS, settings);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể cập nhật cài đặt",
      };
    }
  }

  /**
   * Get user wallet
   */
  async getWallet(): Promise<ApiResponse<Wallet>> {
    try {
      const response = await this.api.get(API_ENDPOINTS.USER.WALLET);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tải ví",
      };
    }
  }

  /**
   * Deposit to wallet
   */
  async depositToWallet(amount: number): Promise<ApiResponse<Transaction>> {
    try {
      const response = await this.api.post(API_ENDPOINTS.USER.DEPOSIT, { amount });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể nạp tiền vào ví",
      };
    }
  }

  /**
   * Subscribe a user to a membership plan.
   * POST /api/users/subscribe?userId=&planId=
   */
  async subscribePlan(
    userId: number | string,
    planId: number | string
  ): Promise<ApiResponse<User>> {
    try {
      const response = await this.api.post(API_ENDPOINTS.USER.SUBSCRIBE, null, {
        params: {
          userId: Number(userId),
          planId: Number(planId),
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể đăng ký gói thành viên",
      };
    }
  }

  /**
   * Get active subscription and remaining quotas of a user.
   * GET /api/users/{userId}/subscription
   */
  async getActiveSubscription(
    userId: number | string
  ): Promise<ApiResponse<UserSubscriptionResponse>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.USER.ACTIVE_SUBSCRIPTION, {
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
        error:
          error instanceof Error ? error.message : "Không thể tải gói thành viên đang hoạt động",
      };
    }
  }
}

// Export singleton instance
export const userManager = new UserManager();
