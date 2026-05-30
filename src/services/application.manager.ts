/**
 * Application Service
 * Handles job application operations
 */

import { createApiInstance } from "@/constants/api.config";
import type { ApiResponse } from "@/interfaces";
import axios from "axios";

export interface Application {
  id?: number;
  userId?: number;
  jdId?: number;
  currentRoundOrder?: number;
  status?: "IN_PROGRESS" | "PASSED" | "FAILED" | "SOFT_FAILED";
  overallScore?: number;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

class ApplicationService {
  private api = createApiInstance();

  private extractErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      return error.response?.data?.message || error.message || "Đã xảy ra lỗi";
    }
    if (error instanceof Error) {
      return error.message;
    }
    return "Đã xảy ra lỗi không xác định";
  }

  /**
   * Apply for a job
   * POST /api/applications?jdId={jdId}
   */
  async apply(jdId: number): Promise<ApiResponse<Application>> {
    try {
      const response = await this.api.post(`/api/applications?jdId=${jdId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("[ApplicationService] Apply error:", error);
      const message = this.extractErrorMessage(error);
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Get all applications
   * GET /api/applications
   */
  async getAll(): Promise<ApiResponse<Application[]>> {
    try {
      const response = await this.api.get("/api/applications");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("[ApplicationService] GetAll error:", error);
      return {
        success: false,
        error: this.extractErrorMessage(error),
      };
    }
  }

  /**
   * Get application by ID
   * GET /api/applications/{id}
   */
  async getById(id: number): Promise<ApiResponse<Application>> {
    try {
      const response = await this.api.get(`/api/applications/${id}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("[ApplicationService] GetById error:", error);
      return {
        success: false,
        error: this.extractErrorMessage(error),
      };
    }
  }

  /**
   * Get all applications for current user
   * GET /api/applications/me
   */
  async getMyApplications(): Promise<ApiResponse<Application[]>> {
    try {
      const response = await this.api.get("/api/applications/me");
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("[ApplicationService] GetMyApplications error:", error);
      return {
        success: false,
        error: this.extractErrorMessage(error),
      };
    }
  }
}

export const applicationService = new ApplicationService();
