/**
 * Question Manager
 * Handles question bank operations
 */

import type { ApiResponse, BaseManager, PaginatedResponse, PaginationParams } from "@/interfaces";

import { API_ENDPOINTS, buildEndpoint, createApiInstance } from "@/constants/api.config";

export interface PracticeQuestion {
  questionId?: number;
  title?: string;
  content?: string;
  level?: "EASY" | "MEDIUM" | "HARD";
  lesson?: {
    id?: number;
    lessonName?: string;
    description?: string;
    urlTutorial?: string;
  };
  answer?: string;
  hint?: string;
}

export class QuestionManager implements BaseManager<PracticeQuestion> {
  private api = createApiInstance();

  /**
   * Get all question sets
   */
  async getAll(
    params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<PracticeQuestion> | PracticeQuestion[]>> {
    try {
      const response = await this.api.get(API_ENDPOINTS.QUESTION.LIST, { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch questions",
      };
    }
  }

  /**
   * Get question set by ID (with full details including questions)
   */
  async getById(id: string | number): Promise<ApiResponse<PracticeQuestion>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUESTION.DETAIL, { id });
      const response = await this.api.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch question",
      };
    }
  }

  /**
   * Create new question
   * POST /api/practice-questions (JSON body)
   * Backend requires full PracticeQuestion schema including questionId: 0 for creation
   */
  async create(data: Partial<PracticeQuestion>): Promise<ApiResponse<PracticeQuestion>> {
    try {
      // Backend requires questionId: 0 for creation to avoid null int parse error
      const questionPayload = {
        questionId: 0,
        ...data,
      };
      const response = await this.api.post(API_ENDPOINTS.QUESTION.CREATE, questionPayload);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create question",
      };
    }
  }

  /**
   * Update question
   * POST /api/practice-questions (JSON body)
   * Backend requires full PracticeQuestion schema including questionId
   */
  async update(
    id: string | number,
    data: Partial<PracticeQuestion>
  ): Promise<ApiResponse<PracticeQuestion>> {
    try {
      // Backend requires questionId in body for update
      const questionPayload = {
        questionId: Number(id),
        ...data,
      };
      // Use POST for updates (backend treats questionId > 0 as update)
      const response = await this.api.post(API_ENDPOINTS.QUESTION.UPDATE, questionPayload);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update question",
      };
    }
  }

  /**
   * Delete question
   * DELETE /api/practice-questions/{id}
   */
  async delete(id: string | number): Promise<ApiResponse<void>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUESTION.DELETE, { id });
      await this.api.delete(endpoint);
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete question",
      };
    }
  }

  /**
   * Search question sets by text
   */
  async search(
    searchText: string,
    params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<PracticeQuestion> | PracticeQuestion[]>> {
    try {
      const response = await this.api.get(API_ENDPOINTS.QUESTION.LIST, {
        params: { ...params, search: searchText },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to search questions",
      };
    }
  }
  /**
   * Get random questions by level
   * GET /api/practice-questions/random-by-level?level={level}&count={count}
   */
  async getRandomByLevel(level: string, count: number): Promise<ApiResponse<PracticeQuestion[]>> {
    try {
      const response = await this.api.get(API_ENDPOINTS.QUESTION.RANDOM_BY_LEVEL, {
        params: { level, count },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch random questions",
      };
    }
  }

  /**
   * Get questions by category and level
   * GET /api/practice-questions/by-category-level?categoryId={categoryId}&level={level}
   */
  async getByCategoryAndLevel(
    categoryId: number,
    level: string
  ): Promise<ApiResponse<PracticeQuestion[]>> {
    try {
      const response = await this.api.get(API_ENDPOINTS.QUESTION.BY_CATEGORY_LEVEL, {
        params: { categoryId, level },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch questions by category and level",
      };
    }
  }

  /**
   * Bulk create questions
   * POST /api/practice-questions/save-all
   * Body: PracticeQuestion[]
   */
  async saveAll(questions: PracticeQuestion[]): Promise<ApiResponse<PracticeQuestion[]>> {
    try {
      const response = await this.api.post(API_ENDPOINTS.QUESTION.SAVE_ALL, questions);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save questions",
      };
    }
  }
}

// Export singleton instance
export const questionManager = new QuestionManager();
