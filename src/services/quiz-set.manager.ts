/**
 * Quiz Set Manager
 * Handles quiz set operations (take quizzes, submit answers, view results)
 * Based on schema-from-be.d.ts API specification
 */

import type { ApiResponse } from "@/interfaces";

import {
  API_ENDPOINTS,
  MANAGER_MODE,
  buildEndpoint,
  createApiInstance,
} from "@/constants/api.config";
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
  submitted?: boolean;
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
  private mode = MANAGER_MODE;
  private api = createApiInstance();

  /**
   * Get all quiz sets
   * GET /api/quiz-sets
   */
  async getAll(): Promise<ApiResponse<QuizSet[]>> {
    if (this.mode === "mock") {
      return {
        success: true,
        data: [],
      };
    }

    try {
      const response = await this.api.get(API_ENDPOINTS.QUIZ_SETS.LIST);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch quiz sets",
      };
    }
  }

  /**
   * Get quiz set by ID
   * GET /api/quiz-sets/{quizId}
   */
  async getById(quizId: number): Promise<ApiResponse<QuizSet>> {
    if (this.mode === "mock") {
      return {
        success: false,
        error: "Quiz set not found in mock mode",
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUIZ_SETS.DETAIL, { quizId });
      const response = await this.api.get(endpoint);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch quiz set",
      };
    }
  }

  /**
   * Create quiz set
   * POST /api/quiz-sets?quizId={quizId}&quizName={quizName}
   * Note: Uses query params, NOT JSON body
   */
  async create(quizId: number, quizName: string): Promise<ApiResponse<QuizSet>> {
    if (this.mode === "mock") {
      return {
        success: false,
        error: "Create quiz set not supported in mock mode",
      };
    }

    try {
      const response = await this.api.post(API_ENDPOINTS.QUIZ_SETS.CREATE, null, {
        params: { quizId, quizName },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create quiz set",
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
    if (this.mode === "mock") {
      return {
        success: false,
        error: "Create full quiz set not supported in mock mode",
      };
    }

    try {
      const response = await this.api.post(API_ENDPOINTS.QUIZ_SETS.CREATE_FULL, items, {
        params: { practiceSetId, QuizName: quizName },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create full quiz set",
      };
    }
  }

  /**
   * Create full quiz set with AI-generated items
   * POST /api/quiz-sets/create-full-ai?practiceSetId={practiceSetId}
   * No body needed — AI generates the questions from the practice set content
   */
  async createFullAi(practiceSetId: number): Promise<ApiResponse<QuizItem[]>> {
    if (this.mode === "mock") {
      return {
        success: false,
        error: "Create AI quiz set not supported in mock mode",
      };
    }

    try {
      const response = await this.api.post(API_ENDPOINTS.QUIZ_SETS.CREATE_FULL_AI, null, {
        params: { practiceSetId },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tạo bài kiểm tra AI",
      };
    }
  }

  /**
   * Submit quiz answers and calculate score
   * POST /api/quiz-sets/submit/{quizId}
   * Body: Record<string, string> (question → answer mapping)
   */
  async submit(quizId: number, answers: Record<string, string>): Promise<ApiResponse<QuizSet>> {
    if (this.mode === "mock") {
      return {
        success: false,
        error: "Submit quiz not supported in mock mode",
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUIZ_SETS.SUBMIT, { quizId });
      const response = await this.api.post(endpoint, answers);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to submit quiz",
      };
    }
  }

  /**
   * Get quiz history for a practice set
   * GET /api/quiz-sets/by-practice-set/{practiceSetId}
   */
  async getByPracticeSet(practiceSetId: number): Promise<ApiResponse<QuizSet[]>> {
    if (this.mode === "mock") {
      return {
        success: true,
        data: [],
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUIZ_SETS.BY_PRACTICE_SET, {
        practiceSetId,
      });
      const response = await this.api.get(endpoint);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch quiz history",
      };
    }
  }

  /**
   * Delete quiz set
   * DELETE /api/quiz-sets/{quizId}
   */
  async delete(quizId: number): Promise<ApiResponse<void>> {
    if (this.mode === "mock") {
      return {
        success: false,
        error: "Delete quiz set not supported in mock mode",
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUIZ_SETS.DELETE, { quizId });
      await this.api.delete(endpoint);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete quiz set",
      };
    }
  }

  /**
   * Get quiz items by quiz set ID
   * GET /api/quiz-set-items/by-quiz-set/{quizSetId}
   */
  async getQuizItems(quizSetId: number): Promise<ApiResponse<QuizItem[]>> {
    if (this.mode === "mock") {
      return {
        success: true,
        data: [],
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUIZ_SETS.ITEMS_BY_QUIZ_SET, {
        quizSetId,
      });
      const response = await this.api.get(endpoint);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch quiz items",
      };
    }
  }
}

// Export singleton instance
export const quizSetManager = new QuizSetManager();
