import i18n from "@/lib/i18n";
const t = i18n.t.bind(i18n);
/**
 * User Manager
 * Handles user profile operations
 */

import type { ApiResponse, User, UserSubscriptionResponse } from "@/interfaces";

import { API_ENDPOINTS, buildEndpoint } from "@/constants/api.config";
import { fetchClient } from "@/lib/api";

type UserProfile = Record<string, unknown>;
type UserSettings = Record<string, unknown>;

export class UserManager {
  /**
   * Get user profile
   */
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    try {
      const response = await fetchClient
        // @ts-expect-error: Backend Swagger schema mismatch
        .GET("/api/users/me", {})
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
        error: error instanceof Error ? error.message : t("general.unableToLoadProfile"),
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    try {
      const response = await fetchClient
        // @ts-expect-error: Backend Swagger schema mismatch
        .POST("/api/users/me", { body: data })
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
        error: error instanceof Error ? error.message : t("general.unableToUpdateProfile"),
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
      const response = await fetchClient
        .POST(
          // @ts-expect-error: Backend Swagger schema mismatch
          "/api/users/password",
          {
            body: {
              currentPassword,
              newPassword,
            },
          }
        )
        .then((res) => ({
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
        error: error instanceof Error ? error.message : t("general.unableToUpdatePassword"),
      };
    }
  }

  /**
   * Get user settings
   */
  async getSettings(): Promise<ApiResponse<UserSettings>> {
    try {
      const response = await fetchClient
        // @ts-expect-error: Backend Swagger schema mismatch
        .GET("/api/users/settings", {})
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
        error: error instanceof Error ? error.message : t("general.unableToLoadSettings"),
      };
    }
  }

  /**
   * Update user settings
   */
  async updateSettings(settings: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> {
    try {
      const response = await fetchClient
        // @ts-expect-error: Backend Swagger schema mismatch
        .POST("/api/users/settings", { body: settings })
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
        error: error instanceof Error ? error.message : t("general.unableToUpdateSettings"),
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
      const response = await fetchClient
        .POST(
          // @ts-expect-error: Backend Swagger schema mismatch
          "/api/users/subscribe",
          {
            params: {
              userId: Number(userId),
              planId: Number(planId),
            },
          }
        )
        .then((res) => ({
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
        error: error instanceof Error ? error.message : t("general.unableToRegisterForMembership"),
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
        error: error instanceof Error ? error.message : t("general.unableToLoadActiveMembership"),
      };
    }
  }
}

// Export singleton instance
export const userManager = new UserManager();
