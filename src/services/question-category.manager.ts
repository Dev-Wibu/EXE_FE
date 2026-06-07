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
import type { components } from "../../schema-from-be";

/**
 * QuestionCategory type based on backend schema (QuestionLesson)
 * Schema includes: id, categoryName, description, urlTutorial
 */
export interface QuestionCategory {
  id?: number;
  categoryName?: string;
  description?: string;
  urlTutorial?: string;
}

/**
 * Form data for create/update operations
 */
export interface QuestionCategoryFormData {
  categoryName: string;
  description?: string;
  urlTutorial?: string;
}
export class QuestionCategoryManager implements BaseManager<QuestionCategory> {
  /**
   * Map backend QuestionLesson (lessonName) to frontend QuestionCategory (categoryName)
   */

  private mapFromBackend(data: components["schemas"]["QuestionLesson"]): QuestionCategory {
    return {
      id: data.id,
      categoryName: data.lessonName,
      description: data.description,
      urlTutorial: data.urlTutorial,
    };
  }

  private mapArrayFromBackend(data: components["schemas"]["QuestionLesson"][]): QuestionCategory[] {
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
      const response = await fetchClient
        .GET("/api/question-categories", {
          // @ts-expect-error: Backend Swagger schema mismatch
          params: _params,
        })
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));
      const raw = response.data;
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
      const endpoint = buildEndpoint(API_ENDPOINTS.QUESTION_CATEGORIES.DETAIL, {
        id,
      });
      // @ts-expect-error: dynamic endpoint string doesn't match PathsWithMethod<paths,"get"> — schema mismatch for /api/question-categories/{id}
      const response = await fetchClient.GET(endpoint, {}).then((res) => ({
        data: res.data as components["schemas"]["QuestionLesson"] | undefined,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      return {
        success: true,
        data: this.mapFromBackend(response.data ?? {}),
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
   * Backend requires full QuestionLesson schema including id: 0 for creation
   */
  async create(data: Partial<QuestionCategory>): Promise<ApiResponse<QuestionCategory>> {
    try {
      // Backend requires full QuestionLesson schema for creation
      // id: 0 indicates new record creation
      // Map categoryName → lessonName (backend schema uses QuestionLesson.lessonName)
      const categoryPayload = {
        id: 0,
        // Required: 0 for creation
        lessonName: data.categoryName,
        description: data.description,
        urlTutorial: data.urlTutorial ?? "",
      };
      const response = await fetchClient
        .POST("/api/question-categories", { body: categoryPayload })
        .then((res) => ({
          data: res.data as components["schemas"]["QuestionLesson"] | undefined,
          status: res.response?.status,
          headers: res.response?.headers,
        }));
      return {
        success: true,
        data: this.mapFromBackend(response.data ?? {}),
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
      // Map categoryName → lessonName (backend schema uses QuestionLesson.lessonName)
      const categoryData = {
        id: Number(id),
        lessonName: data.categoryName,
        description: data.description,
        urlTutorial: data.urlTutorial,
      };
      const response = await fetchClient
        .PUT("/api/question-categories", { body: categoryData })
        .then((res) => ({
          data: res.data as components["schemas"]["QuestionLesson"] | undefined,
          status: res.response?.status,
          headers: res.response?.headers,
        }));
      return {
        success: true,
        data: this.mapFromBackend(response.data ?? {}),
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
   * Schema provides DELETE endpoint for question categories
   */
  async delete(id: string | number): Promise<ApiResponse<void>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUESTION_CATEGORIES.DELETE, {
        id,
      });
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
        error: error instanceof Error ? error.message : t("common.cannotDeleteQuestionCategories"),
      };
    }
  }
}

// Export singleton instance
export const questionCategoryManager = new QuestionCategoryManager();
