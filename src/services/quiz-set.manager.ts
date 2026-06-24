import i18n from "@/lib/i18n";
const t = i18n.t.bind(i18n);
/**
 * Quiz Set Manager
 * Handles quiz set operations (take quizzes, submit answers, view results)
 * Based on schema-from-be.d.ts API specification
 */

import { API_ENDPOINTS, buildEndpoint } from "@/constants/api.config";
import type { ApiResponse } from "@/interfaces";
import { fetchClient } from "@/lib/api";
import type { PracticeSet } from "./practice-set.manager";

/**
 * QuizSet type based on backend schema
 */
export interface QuizSet {
  quizId?: number;
  quizName?: string;
  score?: number;
  practiceSet?: PracticeSet;
  createdAt?: string;
  questions?: QuizItem[];
  submitted?: boolean;
}

/**
 * QuizItemResponse from createFullAi — only contains id, question, and options.
 * Use QuizItem when loading an existing quiz via getQuizItems.
 */
export interface QuizItemResponse {
  id?: number;
  question?: string;
  options?: string;
}

/**
 * QuizResponse returned by createFullAi endpoint.
 */
export interface QuizResponse {
  quizId?: number;
  items?: QuizItemResponse[];
}

/**
 * QuizItem type based on backend schema
 */
export interface QuizItem {
  id?: number;
  quizSet?: QuizSet;
  question?: string;
  options?: string;
  correctAnswer?: string;
  userResponse?: string;
  explanation?: string;
}

/**
 * QuizItemCreateRequest for creating quiz items
 */
export interface QuizItemCreateRequest {
  question?: string;
  options?: Record<string, string>;
  correctAnswer?: string;
  explanation?: string;
}
export class QuizSetManager {
  /**
   * Get all quiz sets
   * GET /api/quiz-sets
   */
  async getAll(): Promise<ApiResponse<QuizSet[]>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any).GET("/api/quiz-sets", {});
      const data = response.data;
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToLoadListOf1"),
      };
    }
  }

  /**
   * Get quiz set by ID
   * GET /api/quiz-sets/{quizId}
   */
  async getById(quizId: number): Promise<ApiResponse<QuizSet>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUIZ_SETS.DETAIL, { quizId });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any).GET(endpoint, {});
      const data = response.data;
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToDownloadTestSet"),
      };
    }
  }

  /**
   * Create quiz set
   * POST /api/quiz-sets?quizId={quizId}&quizName={quizName}
   */
  async create(quizId: number, quizName: string): Promise<ApiResponse<QuizSet>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any).POST("/api/quiz-sets", {
        params: { query: { quizId, quizName } },
      });
      const result = response.data;
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToCreateMultipleChoice"),
      };
    }
  }

  /**
   * Create full quiz set with items
   * POST /api/quiz-sets/create-full?practiceSetId={practiceSetId}&QuizName={quizName}
   */
  async createFull(
    practiceSetId: number,
    quizName: string,
    items: QuizItemCreateRequest[]
  ): Promise<ApiResponse<QuizItem[]>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any).POST("/api/quiz-sets/create-full", {
        params: { query: { practiceSetId, quizName: quizName } },
        body: items,
      });
      const data = response.data;
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToCreateFullTest"),
      };
    }
  }

  /**
   * Create full quiz set with AI-generated items
   * POST /api/quiz-sets/create-full-ai?practiceSetId={practiceSetId}
   */
  async createFullAi(practiceSetId: number): Promise<ApiResponse<QuizResponse>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any).POST("/api/quiz-sets/create-full-ai", {
        params: { query: { practiceSetId } },
        timeout: 120000,
      });
      const data = response.data;
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("common.unableToCreateAiTest"),
      };
    }
  }

  /**
   * Submit quiz answers and calculate score
   * POST /api/quiz-sets/submit/{quizId}
   */
  async submit(quizId: number, answers: Record<string, string>): Promise<ApiResponse<QuizSet>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUIZ_SETS.SUBMIT, { quizId });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any).POST(endpoint, { body: answers });
      const result = response.data;
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.cannotSubmitQuiz"),
      };
    }
  }

  /**
   * Get quiz history for a practice set
   * GET /api/quiz-sets/by-practice-set/{practiceSetId}
   */
  async getByPracticeSet(practiceSetId: number): Promise<ApiResponse<QuizSet[]>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any).GET(
        "/api/quiz-sets/by-practice-set/{practiceSetId}",
        {
          params: { path: { practiceSetId } },
        }
      );
      const data = response.data;
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToDownloadQuizHistory"),
      };
    }
  }

  /**
   * Delete quiz set
   * DELETE /api/quiz-sets/{quizId}
   */
  async delete(quizId: number): Promise<ApiResponse<void>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUIZ_SETS.DELETE, { quizId });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (fetchClient as any).DELETE(endpoint, {});
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.cannotDeleteMultipleChoiceSets"),
      };
    }
  }

  /**
   * Get quiz items by quiz set ID
   * GET /api/quiz-set-items/by-quiz-set/{quizSetId}
   */
  async getQuizItems(quizSetId: number): Promise<ApiResponse<QuizItem[]>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUIZ_SETS.ITEMS_BY_QUIZ_SET, { quizSetId });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any).GET(endpoint, {});
      const data = response.data;
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToLoadMultipleChoice"),
      };
    }
  }
}

// Export singleton instance
export const quizSetManager = new QuizSetManager();
