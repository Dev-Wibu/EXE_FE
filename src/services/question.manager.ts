/**
 * Question Manager
 * Handles question bank operations
 */

import type { ApiResponse, BaseManager, PaginatedResponse, PaginationParams } from "@/interfaces";
import type { QuestionSet, QuestionSetDetail } from "@/mocks/questions.mock";

import { API_ENDPOINTS, MANAGER_MODE, apiConfig, buildEndpoint } from "@/constants/api.config";
import * as questionMock from "@/mocks/questions.mock";
import axios from "axios";

export class QuestionManager implements BaseManager<QuestionSet> {
  private mode = MANAGER_MODE;
  private api = axios.create(apiConfig);

  /**
   * Get all question sets
   */
  async getAll(
    params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<QuestionSet> | QuestionSet[]>> {
    if (this.mode === "mock") {
      const questions = await questionMock.fetchQuestionSets();
      void params;
      return {
        success: true,
        data: questions,
      };
    }

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
  async getById(id: string | number): Promise<ApiResponse<QuestionSetDetail>> {
    if (this.mode === "mock") {
      const questionSet = await questionMock.fetchQuestionSetDetail(Number(id));
      if (!questionSet) {
        return {
          success: false,
          error: "Question set not found",
        };
      }
      return {
        success: true,
        data: questionSet,
      };
    }

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
   * Create new question set
   */
  async create(data: Partial<QuestionSet>): Promise<ApiResponse<QuestionSet>> {
    if (this.mode === "mock") {
      void data;
      return {
        success: false,
        error: "Create operation not supported in mock mode",
      };
    }

    try {
      const response = await this.api.post(API_ENDPOINTS.QUESTION.CREATE, data);
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
   * Update question set
   */
  async update(id: string | number, data: Partial<QuestionSet>): Promise<ApiResponse<QuestionSet>> {
    if (this.mode === "mock") {
      void id;
      void data;
      return {
        success: false,
        error: "Update operation not supported in mock mode",
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUESTION.UPDATE, { id });
      // Note: Backend confirmed POST should be used for updates (not PUT)
      const response = await this.api.post(endpoint, data);
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
   * Delete question set
   * POST /api/questions/{id}
   * Note: Backend requires POST method for all operations including delete (PUT/DELETE not used)
   */
  async delete(id: string | number): Promise<ApiResponse<void>> {
    if (this.mode === "mock") {
      void id;
      return {
        success: false,
        error: "Delete operation not supported in mock mode",
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUESTION.DELETE, { id });
      // Note: Backend requires POST method for delete operations (PUT/DELETE not used)
      await this.api.post(endpoint);
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
  ): Promise<ApiResponse<PaginatedResponse<QuestionSet> | QuestionSet[]>> {
    if (this.mode === "mock") {
      const questions = await questionMock.fetchQuestionSets();
      // Simple mock search filter
      const filtered = questions.filter(
        (q: QuestionSet) =>
          q.title.toLowerCase().includes(searchText.toLowerCase()) ||
          q.description.toLowerCase().includes(searchText.toLowerCase())
      );
      void params;
      return {
        success: true,
        data: filtered,
      };
    }

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
}

// Export singleton instance
export const questionManager = new QuestionManager();
