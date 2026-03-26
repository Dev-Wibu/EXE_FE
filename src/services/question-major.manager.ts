/**
 * Question Major Manager
 * Handles question major (discipline/field) CRUD operations for admin management
 * Based on schema-from-be.d.ts API specification
 */

import type { ApiResponse, BaseManager, PaginatedResponse, PaginationParams } from "@/interfaces";

import {
  API_ENDPOINTS,
  MANAGER_MODE,
  buildEndpoint,
  createApiInstance,
} from "@/constants/api.config";

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

// Mock data for development
const mockMajors: Major[] = [
  { id: 1, majorName: "Software Engineering", description: "Software development and engineering" },
  { id: 2, majorName: "Data Science", description: "Data analysis and machine learning" },
  { id: 3, majorName: "Product Management", description: "Product strategy and management" },
  { id: 4, majorName: "UI/UX Design", description: "User interface and experience design" },
  { id: 5, majorName: "DevOps", description: "Development operations and infrastructure" },
];

export class QuestionMajorManager implements BaseManager<Major> {
  private mode = MANAGER_MODE;
  private api = createApiInstance();

  /**
   * Get all question majors
   * GET /api/question-majors
   */
  async getAll(
    _params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<Major> | Major[]>> {
    if (this.mode === "mock") {
      return {
        success: true,
        data: [...mockMajors],
      };
    }

    try {
      const response = await this.api.get(API_ENDPOINTS.QUESTION_MAJORS.LIST, { params: _params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch question majors",
      };
    }
  }

  /**
   * Get question major by ID
   * GET /api/question-majors/{id}
   */
  async getById(id: string | number): Promise<ApiResponse<Major>> {
    if (this.mode === "mock") {
      const major = mockMajors.find((m) => m.id === Number(id));
      if (!major) {
        return {
          success: false,
          error: "Question major not found",
        };
      }
      return {
        success: true,
        data: major,
      };
    }

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
        error: error instanceof Error ? error.message : "Failed to fetch question major",
      };
    }
  }

  async create(data: Partial<Major>): Promise<ApiResponse<Major>> {
    if (this.mode === "mock") {
      const newId = Math.max(...mockMajors.map((m) => m.id || 0)) + 1;
      const newMajor: Major = {
        id: newId,
        majorName: data.majorName,
        description: data.description,
      };
      mockMajors.push(newMajor);
      return {
        success: true,
        data: newMajor,
      };
    }

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
        error: error instanceof Error ? error.message : "Failed to create question major",
      };
    }
  }

  async update(id: string | number, data: Partial<Major>): Promise<ApiResponse<Major>> {
    if (this.mode === "mock") {
      const index = mockMajors.findIndex((m) => m.id === Number(id));
      if (index === -1) {
        return {
          success: false,
          error: "Question major not found",
        };
      }
      mockMajors[index] = { ...mockMajors[index], ...data };
      return {
        success: true,
        data: mockMajors[index],
      };
    }

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
        error: error instanceof Error ? error.message : "Failed to update question major",
      };
    }
  }

  /**
   * Delete question major
   * DELETE /api/majors/{id}
   * Schema provides DELETE endpoint for majors
   */
  async delete(id: string | number): Promise<ApiResponse<void>> {
    if (this.mode === "mock") {
      const index = mockMajors.findIndex((m) => m.id === Number(id));
      if (index === -1) {
        return {
          success: false,
          error: "Question major not found",
        };
      }
      mockMajors.splice(index, 1);
      return {
        success: true,
      };
    }

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
        error: error instanceof Error ? error.message : "Failed to delete question major",
      };
    }
  }
}

// Export singleton instance
export const questionMajorManager = new QuestionMajorManager();
