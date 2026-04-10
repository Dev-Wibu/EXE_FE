/**
 * Dashboard Admin Manager
 * Handles dashboard-specific API operations for administrators
 */

import { API_ENDPOINTS, createApiInstance } from "@/constants/api.config";
import type { ApiResponse, FeatureUsageLog, PaymentEntity, TransactionEntity } from "@/interfaces";

export class DashboardAdminManager {
  private api = createApiInstance();

  /**
   * Get total number of users
   */
  async getTotalUsers(): Promise<ApiResponse<number>> {
    try {
      const response = await this.api.get(API_ENDPOINTS.DASHBOARD.TOTAL_USER);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể lấy tổng số người dùng",
      };
    }
  }

  /**
   * Get total number of mentors
   */
  async getTotalMentors(): Promise<ApiResponse<number>> {
    try {
      const response = await this.api.get(API_ENDPOINTS.DASHBOARD.TOTAL_MENTOR);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể lấy tổng số mentor",
      };
    }
  }

  /**
   * Get total income transactions
   */
  async getTotalIncome(): Promise<ApiResponse<PaymentEntity[]>> {
    try {
      const response = await this.api.get(API_ENDPOINTS.DASHBOARD.TOTAL_INCOME);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể lấy dữ liệu doanh thu",
      };
    }
  }

  /**
   * Get total sessions transactions
   */
  async getTotalSessions(): Promise<ApiResponse<number>> {
    try {
      const response = await this.api.get(API_ENDPOINTS.DASHBOARD.TOTAL_SESSION);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể lấy dữ liệu phiên học",
      };
    }
  }

  /**
   * Get all dashboard transactions
   */
  async getTotalTransactions(): Promise<ApiResponse<TransactionEntity[]>> {
    try {
      const response = await this.api.get(API_ENDPOINTS.DASHBOARD.TOTAL_TRANSACTION);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể lấy nhật ký giao dịch",
      };
    }
  }

  /**
   * Get feature usage logs
   */
  async getFeatureUsageLogs(): Promise<ApiResponse<FeatureUsageLog[]>> {
    try {
      const response = await this.api.get(API_ENDPOINTS.DASHBOARD.FEATURE_USAGE_LOGS);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể lấy nhật ký sử dụng tính năng",
      };
    }
  }
}

// Export singleton instance
export const dashboardAdminManager = new DashboardAdminManager();
