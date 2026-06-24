import i18n from "@/lib/i18n";
const t = i18n.t.bind(i18n);
/**
 * Question Manager
 * Handles question bank operations
 */

import { API_ENDPOINTS, buildEndpoint } from "@/constants/api.config";
import type { ApiResponse, BaseManager, PaginatedResponse, PaginationParams } from "@/interfaces";
import { fetchClient } from "@/lib/api";

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
  async getAll(
    params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<PracticeQuestion> | PracticeQuestion[]>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any)["GET"]("/api/practice-questions", { params });
      const data = response.data;
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToLoadQuestion"),
      };
    }
  }

  async getById(id: string | number): Promise<ApiResponse<PracticeQuestion>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUESTION.DETAIL, { id });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any)["GET"](endpoint, {});
      const data = response.data;
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToLoadQuestion"),
      };
    }
  }

  async create(data: Partial<PracticeQuestion>): Promise<ApiResponse<PracticeQuestion>> {
    try {
      const questionPayload = { questionId: 0, ...data };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any)["POST"]("/api/practice-questions", {
        body: questionPayload,
      });
      const result = response.data;
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("common.cannotCreateQuestion"),
      };
    }
  }

  async update(
    id: string | number,
    data: Partial<PracticeQuestion>
  ): Promise<ApiResponse<PracticeQuestion>> {
    try {
      const questionPayload = { questionId: Number(id), ...data };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any)["PUT"](`/api/practice-questions/${id}`, {
        body: questionPayload,
      });
      const result = response.data;
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("common.unableToUpdateQuestion"),
      };
    }
  }

  async delete(id: string | number): Promise<ApiResponse<void>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUESTION.DELETE, { id });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (fetchClient as any)["DELETE"](endpoint, {});
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("common.questionCannotBeDeleted"),
      };
    }
  }

  async search(
    searchText: string,
    params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<PracticeQuestion> | PracticeQuestion[]>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any)["GET"]("/api/practice-questions", {
        params: { ...params, search: searchText },
      });
      const data = response.data;
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.cannotSearchForQuestion"),
      };
    }
  }

  async getRandomByLevel(level: string, count: number): Promise<ApiResponse<PracticeQuestion[]>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any)["GET"](
        "/api/practice-questions/random-by-level",
        { params: { level, count } }
      );
      const data = response.data;
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("common.unableToLoadRandomQuestions"),
      };
    }
  }

  async getByCategoryAndLevel(
    categoryId: number,
    level: string
  ): Promise<ApiResponse<PracticeQuestion[]>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any)["GET"](
        "/api/practice-questions/by-category-level",
        { params: { categoryId, level } }
      );
      const data = response.data;
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.questionsByCategoryAndLevel"),
      };
    }
  }

  async saveAll(data: Partial<PracticeQuestion>[]): Promise<ApiResponse<PracticeQuestion[]>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any)["POST"]("/api/practice-questions/save-all", {
        body: data,
      });
      const result = response.data;
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("common.unableToSaveAllQuestions"),
      };
    }
  }
}

// Export singleton instance
export const questionManager = new QuestionManager();
