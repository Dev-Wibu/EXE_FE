/**
 * User Manager
 * Handles user profile and wallet operations
 */

import type { ApiResponse, User, UserSubscriptionResponse } from "@/interfaces";
import type { Transaction, UserProfile, UserSettings, Wallet } from "@/mocks/user.mock";

import {
  API_ENDPOINTS,
  MANAGER_MODE,
  buildEndpoint,
  createApiInstance,
} from "@/constants/api.config";
import * as userMock from "@/mocks/user.mock";

export class UserManager {
  private mode = MANAGER_MODE;
  private api = createApiInstance();

  /**
   * Get user profile
   */
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    if (this.mode === "mock") {
      const profile = await userMock.fetchUserProfile();
      return {
        success: true,
        data: profile,
      };
    }

    try {
      const response = await this.api.get(API_ENDPOINTS.USER.PROFILE);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch profile",
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    if (this.mode === "mock") {
      const result = await userMock.updateUserProfile(data);
      return {
        success: result.success,
        data: result.user,
      };
    }

    try {
      const response = await this.api.post(API_ENDPOINTS.USER.UPDATE_PROFILE, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update profile",
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
    if (this.mode === "mock") {
      const result = await userMock.updatePassword(currentPassword, newPassword);
      return {
        success: result.success,
        data: { message: result.message },
      };
    }

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
        error: error instanceof Error ? error.message : "Failed to update password",
      };
    }
  }

  /**
   * Get user settings
   */
  async getSettings(): Promise<ApiResponse<UserSettings>> {
    if (this.mode === "mock") {
      const settings = await userMock.fetchUserSettings();
      return {
        success: true,
        data: settings,
      };
    }

    try {
      const response = await this.api.get(API_ENDPOINTS.USER.SETTINGS);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch settings",
      };
    }
  }

  /**
   * Update user settings
   */
  async updateSettings(settings: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> {
    if (this.mode === "mock") {
      const result = await userMock.updateUserSettings(settings);
      return {
        success: result.success,
        data: result.settings,
      };
    }

    try {
      const response = await this.api.post(API_ENDPOINTS.USER.SETTINGS, settings);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update settings",
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
        error: error instanceof Error ? error.message : "Failed to fetch wallet",
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
        error: error instanceof Error ? error.message : "Failed to deposit to wallet",
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
        error: error instanceof Error ? error.message : "Failed to subscribe membership plan",
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
        error: error instanceof Error ? error.message : "Failed to fetch active subscription",
      };
    }
  }
}

// Export singleton instance
export const userManager = new UserManager();
