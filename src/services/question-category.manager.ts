import i18n from "@/lib/i18n";
const t = i18n.t.bind(i18n);
/**
 * Question Category Manager
 * Handles question category CRUD operations for admin management
 * Based on schema-from-be.d.ts API specification
 */

import { API_ENDPOINTS, buildEndpoint } from "@/constants/api.config";
import type { ApiResponse, BaseManager, PaginatedResponse, PaginationParams } from "@/interfaces";
import { fetchClient } from "@/lib/api";

/**
 * QuestionCategory type based on backend schema (QuestionLesson)
 * Schema includes: id, categoryName, description, urlTutorial
 */
export interface QuestionCategory {
  id?: number;
  categoryName?: string;
}

export interface QuestionCategoryFormData {
  categoryName: string;
}
export class QuestionCategoryManager implements BaseManager<QuestionCategory> {
  /**
   * Map backend data to frontend QuestionCategory (categoryName)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapFromBackend(data: any): QuestionCategory {
    return {
      id: data.id,
      categoryName: data.name || data.categoryName,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapArrayFromBackend(data: any[]): QuestionCategory[] {
    return data.map((item) => this.mapFromBackend(item));
  }

  /**
   * Get all question categories
   * GET /api/question-categories
   */
  async getAll(
    _params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<QuestionCategory> | QuestionCategory[]>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any).GET("/api/question-categories", {
        params: _params,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = response.data as any;
      const mapped = Array.isArray(raw) ? this.mapArrayFromBackend(raw) : raw;
      return {
        success: true,
        data: mapped,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToLoadQuestionList"),
      };
    }
  }

  /**
   * Get question category by ID
   * GET /api/question-categories/{id}
   */
  async getById(id: string | number): Promise<ApiResponse<QuestionCategory>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUESTION_CATEGORIES.DETAIL, { id });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any).GET(endpoint, {});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = response.data as any;
      return {
        success: true,
        data: this.mapFromBackend(raw ?? {}),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToLoadQuestionList"),
      };
    }
  }

  /**
   * Create new question category
   * POST /api/question-categories (JSON body)
   */
  async create(data: Partial<QuestionCategory>): Promise<ApiResponse<QuestionCategory>> {
    try {
      const categoryPayload = {
        id: 0,
        name: data.categoryName,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any).POST("/api/question-categories", {
        body: categoryPayload,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = response.data as any;
      return {
        success: true,
        data: this.mapFromBackend(raw ?? {}),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("common.unableToCreateQuestionCategory"),
      };
    }
  }

  /**
   * Update question category
   * PUT /api/question-categories (JSON body)
   */
  async update(
    id: string | number,
    data: Partial<QuestionCategory>
  ): Promise<ApiResponse<QuestionCategory>> {
    try {
      const categoryData = {
        id: Number(id),
        name: data.categoryName,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any).PUT("/api/question-categories", {
        body: categoryData,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = response.data as any;
      return {
        success: true,
        data: this.mapFromBackend(raw ?? {}),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("common.unableToUpdateQuestionList"),
      };
    }
  }

  /**
   * Delete question category
   * DELETE /api/question-categories/{id}
   */
  async delete(id: string | number): Promise<ApiResponse<void>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUESTION_CATEGORIES.DELETE, { id });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (fetchClient as any).DELETE(endpoint, {});
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("common.cannotDeleteQuestionCategories"),
      };
    }
  }
}

// Export singleton instance
export const questionCategoryManager = new QuestionCategoryManager();
