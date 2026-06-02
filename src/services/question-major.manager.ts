import i18n from "@/lib/i18n";
const t = i18n.t.bind(i18n);
/**
 * Question Major Manager
 * Handles question major (discipline/field) CRUD operations for admin management
 * Based on schema-from-be.d.ts API specification
 */

import type { ApiResponse, BaseManager, PaginatedResponse, PaginationParams } from "@/interfaces";

import { API_ENDPOINTS, buildEndpoint } from "@/constants/api.config";
import { fetchClient } from "@/lib/api";

/**
 * Major type based on backend schema
 */
export interface Major {
  id?: number;
  majorName?: string;
  description?: string;
}

/**
 * Form data for create/update operations
 */
export interface MajorFormData {
  majorName: string;
  description?: string;
}

export class QuestionMajorManager implements BaseManager<Major> {
  /**
   * Get all question majors
   * GET /api/question-majors
   */
  async getAll(
    _params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<Major> | Major[]>> {
    try {
      const response = await fetchClient
        // @ts-expect-error: Backend Swagger schema mismatch
        .GET("/api/majors", { params: _params })
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
        error: error instanceof Error ? error.message : t("general.unableToLoadListOf"),
      };
    }
  }

  /**
   * Get question major by ID
   * GET /api/question-majors/{id}
   */
  async getById(id: string | number): Promise<ApiResponse<Major>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUESTION_MAJORS.DETAIL, { id });
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
        error: error instanceof Error ? error.message : t("general.unableToLoadQuestionMajor"),
      };
    }
  }

  async create(data: Partial<Major>): Promise<ApiResponse<Major>> {
    try {
      // Backend requires query params for creation
      // id: 0 indicates new record creation
      const params = {
        id: 0,
        majorName: data.majorName,
        description: data.description || "",
      };
      const response = await fetchClient.POST("/api/majors", { body: params }).then((res) => ({
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
        error: error instanceof Error ? error.message : t("general.unableToCreateQuestionMajor"),
      };
    }
  }

  async update(id: string | number, data: Partial<Major>): Promise<ApiResponse<Major>> {
    try {
      // Backend requires query params for updates
      const params = {
        id: Number(id),
        majorName: data.majorName,
        description: data.description || "",
      };
      // Use PUT method as per schema for update
      const response = await fetchClient.PUT("/api/majors", { body: params }).then((res) => ({
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
        error: error instanceof Error ? error.message : t("general.unableToUpdateQuestionMajor"),
      };
    }
  }

  /**
   * Delete question major
   * DELETE /api/majors/{id}
   * Schema provides DELETE endpoint for majors
   */
  async delete(id: string | number): Promise<ApiResponse<void>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUESTION_MAJORS.DELETE, { id });
      // Use DELETE method as per schema
      // @ts-expect-error: Backend Swagger schema mismatch
      await fetchClient.DELETE(endpoint, {}).then((res) => ({
        data: res.data,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.cannotDeleteQuestionMajor"),
      };
    }
  }
}

// Export singleton instance
export const questionMajorManager = new QuestionMajorManager();
