/**
 * Question Major Manager
 * Handles question major (discipline/field) CRUD operations for admin management
 * Based on schema-from-be.d.ts API specification
 */

import type { ApiResponse, BaseManager, PaginatedResponse, PaginationParams } from "@/interfaces";

import { API_ENDPOINTS, buildEndpoint, createApiInstance } from "@/constants/api.config";

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
  private api = createApiInstance();

  /**
   * Get all question majors
   * GET /api/question-majors
   */
  async getAll(
    _params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<Major> | Major[]>> {
    try {
      const response = await this.api.get(API_ENDPOINTS.QUESTION_MAJORS.LIST, { params: _params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Không thể tải danh sách chuyên ngành câu hỏi",
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
      const response = await this.api.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tải chuyên ngành câu hỏi",
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
      const response = await this.api.post(API_ENDPOINTS.QUESTION_MAJORS.CREATE, null, { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tạo chuyên ngành câu hỏi",
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
      const response = await this.api.put(API_ENDPOINTS.QUESTION_MAJORS.UPDATE, null, { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể cập nhật chuyên ngành câu hỏi",
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
      await this.api.delete(endpoint);
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể xóa chuyên ngành câu hỏi",
      };
    }
  }
}

// Export singleton instance
export const questionMajorManager = new QuestionMajorManager();
