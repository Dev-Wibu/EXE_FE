/**
 * Question Category Manager
 * Handles question category CRUD operations for admin management
 * Based on schema-from-be.d.ts API specification
 */

import type { ApiResponse, BaseManager, PaginatedResponse, PaginationParams } from "@/interfaces";

import { API_ENDPOINTS, MANAGER_MODE, apiConfig, buildEndpoint } from "@/constants/api.config";
import axios from "axios";

/**
 * QuestionCategory type based on backend schema
 */
export interface QuestionCategory {
  id?: number;
  categoryName?: string;
  description?: string;
}

/**
 * Form data for create/update operations
 */
export interface QuestionCategoryFormData {
  categoryName: string;
  description?: string;
}

// Mock data for development
const mockQuestionCategories: QuestionCategory[] = [
  { id: 1, categoryName: "Technical Skills", description: "Questions about technical knowledge" },
  {
    id: 2,
    categoryName: "Behavioral",
    description: "Questions about behavior and soft skills",
  },
  {
    id: 3,
    categoryName: "Problem Solving",
    description: "Questions about problem-solving abilities",
  },
  { id: 4, categoryName: "Communication", description: "Questions about communication skills" },
  { id: 5, categoryName: "Leadership", description: "Questions about leadership experience" },
];

export class QuestionCategoryManager implements BaseManager<QuestionCategory> {
  private mode = MANAGER_MODE;
  private api = axios.create(apiConfig);

  /**
   * Get all question categories
   * GET /api/question-categories
   */
  async getAll(
    _params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<QuestionCategory> | QuestionCategory[]>> {
    if (this.mode === "mock") {
      return {
        success: true,
        data: [...mockQuestionCategories],
      };
    }

    try {
      const response = await this.api.get(API_ENDPOINTS.QUESTION_CATEGORIES.LIST, {
        params: _params,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch question categories",
      };
    }
  }

  /**
   * Get question category by ID
   * GET /api/question-categories/{id}
   */
  async getById(id: string | number): Promise<ApiResponse<QuestionCategory>> {
    if (this.mode === "mock") {
      const category = mockQuestionCategories.find((c) => c.id === Number(id));
      if (!category) {
        return {
          success: false,
          error: "Question category not found",
        };
      }
      return {
        success: true,
        data: category,
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUESTION_CATEGORIES.DETAIL, { id });
      const response = await this.api.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch question category",
      };
    }
  }

  /**
   * Create new question category
   * POST /api/question-categories (JSON body)
   */
  async create(data: Partial<QuestionCategory>): Promise<ApiResponse<QuestionCategory>> {
    if (this.mode === "mock") {
      const newId = Math.max(...mockQuestionCategories.map((c) => c.id || 0)) + 1;
      const newCategory: QuestionCategory = {
        id: newId,
        categoryName: data.categoryName,
        description: data.description,
      };
      mockQuestionCategories.push(newCategory);
      return {
        success: true,
        data: newCategory,
      };
    }

    try {
      const response = await this.api.post(API_ENDPOINTS.QUESTION_CATEGORIES.CREATE, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create question category",
      };
    }
  }

  /**
   * Update question category
   * POST /api/question-categories (JSON body)
   * Note: Backend confirmed POST should be used for updates (not PUT)
   */
  async update(
    id: string | number,
    data: Partial<QuestionCategory>
  ): Promise<ApiResponse<QuestionCategory>> {
    if (this.mode === "mock") {
      const index = mockQuestionCategories.findIndex((c) => c.id === Number(id));
      if (index === -1) {
        return {
          success: false,
          error: "Question category not found",
        };
      }
      mockQuestionCategories[index] = { ...mockQuestionCategories[index], ...data };
      return {
        success: true,
        data: mockQuestionCategories[index],
      };
    }

    try {
      const categoryData: QuestionCategory = { ...data, id: Number(id) };
      // Note: Backend confirmed POST should be used for updates (not PUT)
      const response = await this.api.post(API_ENDPOINTS.QUESTION_CATEGORIES.UPDATE, categoryData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update question category",
      };
    }
  }

  /**
   * Delete question category
   * POST /api/question-categories/{id}
   * Note: Backend requires POST method for all operations including delete (PUT/DELETE not used)
   */
  async delete(id: string | number): Promise<ApiResponse<void>> {
    if (this.mode === "mock") {
      const index = mockQuestionCategories.findIndex((c) => c.id === Number(id));
      if (index === -1) {
        return {
          success: false,
          error: "Question category not found",
        };
      }
      mockQuestionCategories.splice(index, 1);
      return {
        success: true,
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUESTION_CATEGORIES.DELETE, { id });
      // Note: Backend requires POST method for delete operations (PUT/DELETE not used)
      await this.api.post(endpoint);
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete question category",
      };
    }
  }
}

// Export singleton instance
export const questionCategoryManager = new QuestionCategoryManager();
