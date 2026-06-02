import i18n from "@/lib/i18n";
const t = i18n.t.bind(i18n);
/**
 * Dashboard Admin Manager
 * Handles dashboard-specific API operations for administrators
 */

import type { ApiResponse, PaymentEntity } from "@/interfaces";
import { fetchClient } from "@/lib/api";

export class DashboardAdminManager {
  /**
   * Get total number of users
   */
  async getTotalUsers(): Promise<ApiResponse<number>> {
    try {
      const response = await fetchClient.GET("/api/dashboard/total-user", {}).then((res) => ({
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
        error: error instanceof Error ? error.message : t("general.unableToGetTotalNumber"),
      };
    }
  }

  /**
   * Get total number of mentors
   */
  async getTotalMentors(): Promise<ApiResponse<number>> {
    try {
      const response = await fetchClient.GET("/api/dashboard/total-mentor", {}).then((res) => ({
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
        error: error instanceof Error ? error.message : t("general.itIsNotPossibleTo"),
      };
    }
  }

  /**
   * Get total income transactions
   */
  async getTotalIncome(): Promise<ApiResponse<PaymentEntity[]>> {
    try {
      const response = await fetchClient.GET("/api/dashboard/total-income", {}).then((res) => ({
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
        error: error instanceof Error ? error.message : t("general.unableToGetRevenueData"),
      };
    }
  }

  /**
   * Get total sessions transactions
   */
  async getTotalSessions(): Promise<ApiResponse<number>> {
    try {
      const response = await fetchClient.GET("/api/dashboard/total-session", {}).then((res) => ({
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
        error: error instanceof Error ? error.message : t("general.unableToGetSessionData"),
      };
    }
  }
}

// Export singleton instance
export const dashboardAdminManager = new DashboardAdminManager();
