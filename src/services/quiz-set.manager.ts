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
      const response = await fetchClient.GET("/api/quiz-sets", {}).then((res) => ({
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
      const endpoint = buildEndpoint(API_ENDPOINTS.QUIZ_SETS.DETAIL, {
        quizId,
      });
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
        error: error instanceof Error ? error.message : t("general.unableToDownloadTestSet"),
      };
    }
  }

  /**
   * Create quiz set
   * POST /api/quiz-sets?quizId={quizId}&quizName={quizName}
   * Note: Uses query params, NOT JSON body
   */
  async create(quizId: number, quizName: string): Promise<ApiResponse<QuizSet>> {
    try {
      const response = await fetchClient
        .POST("/api/quiz-sets", {
          params: {
            // @ts-expect-error: Backend Swagger schema mismatch
            quizId,
            quizName,
          },
        })
        .then((res) => ({
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
        error: error instanceof Error ? error.message : t("general.unableToCreateMultipleChoice"),
      };
    }
  }

  /**
   * Create full quiz set with items
   * POST /api/quiz-sets/create-full?practiceSetId={practiceSetId}&QuizName={quizName}
   * Body: QuizItemCreateRequest[]
   * Note: Uses BOTH query params AND JSON body
   */
  async createFull(
    practiceSetId: number,
    quizName: string,
    items: QuizItemCreateRequest[]
  ): Promise<ApiResponse<QuizItem[]>> {
    try {
      const response = await fetchClient
        .POST(
          "/api/quiz-sets/create-full",
          // @ts-expect-error: Backend Swagger schema mismatch
          {
            ...{
              params: {
                practiceSetId,
                QuizName: quizName,
              },
            },
            body: items,
          }
        )
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
        error: error instanceof Error ? error.message : t("general.unableToCreateFullTest"),
      };
    }
  }

  /**
   * Create full quiz set with AI-generated items
   * POST /api/quiz-sets/create-full-ai?practiceSetId={practiceSetId}
   * No body needed — AI generates the questions from the practice set content
   */
  async createFullAi(practiceSetId: number): Promise<ApiResponse<QuizResponse>> {
    try {
      // AI generation can take significantly longer than the default 30s timeout
      const response = await fetchClient
        .POST("/api/quiz-sets/create-full-ai", {
          params: {
            query: { practiceSetId },
          },
          timeout: 120000,
        })
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
        error: error instanceof Error ? error.message : t("common.unableToCreateAiTest"),
      };
    }
  }

  /**
   * Submit quiz answers and calculate score
   * POST /api/quiz-sets/submit/{quizId}
   * Body: Record<string, string> (question → answer mapping)
   */
  async submit(quizId: number, answers: Record<string, string>): Promise<ApiResponse<QuizSet>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUIZ_SETS.SUBMIT, {
        quizId,
      });
      const response = await fetchClient
        // @ts-expect-error: Backend Swagger schema mismatch
        .POST(endpoint, { body: answers })
        .then((res) => ({
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
      const endpoint = "/api/quiz-sets/by-practice-set/{practiceSetId}";
      const response = await fetchClient
        .GET(endpoint, {
          params: { path: { practiceSetId } },
        })
        .then((res) => ({
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
      const endpoint = buildEndpoint(API_ENDPOINTS.QUIZ_SETS.DELETE, {
        quizId,
      });
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
      const endpoint = buildEndpoint(API_ENDPOINTS.QUIZ_SETS.ITEMS_BY_QUIZ_SET, {
        quizSetId,
      });
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
        error: error instanceof Error ? error.message : t("general.unableToLoadMultipleChoice"),
      };
    }
  }
}

// Export singleton instance
export const quizSetManager = new QuizSetManager();
