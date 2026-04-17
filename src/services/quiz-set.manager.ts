/**
 * Quiz Set Manager
 * Handles quiz set operations (take quizzes, submit answers, view results)
 * Based on schema-from-be.d.ts API specification
 */

import type { ApiResponse } from "@/interfaces";

import { API_ENDPOINTS, buildEndpoint, createApiInstance } from "@/constants/api.config";
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
  private api = createApiInstance();

  /**
   * Get all quiz sets
   * GET /api/quiz-sets
   */
  async getAll(): Promise<ApiResponse<QuizSet[]>> {
    try {
      const response = await this.api.get(API_ENDPOINTS.QUIZ_SETS.LIST);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tải danh sách bộ trắc nghiệm",
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
      const response = await this.api.get(endpoint);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tải bộ trắc nghiệm",
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
      const response = await this.api.post(API_ENDPOINTS.QUIZ_SETS.CREATE, null, {
        params: { quizId, quizName },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tạo bộ trắc nghiệm",
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
      const response = await this.api.post(API_ENDPOINTS.QUIZ_SETS.CREATE_FULL, items, {
        params: { practiceSetId, QuizName: quizName },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tạo bộ trắc nghiệm đầy đủ",
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
      const response = await this.api.post(API_ENDPOINTS.QUIZ_SETS.CREATE_FULL_AI, null, {
        params: { practiceSetId },
        timeout: 120000,
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
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUIZ_SETS.SUBMIT, { quizId });
      const response = await this.api.post(endpoint, answers);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể nộp bài trắc nghiệm",
      };
    }
  }

  /**
   * Get quiz history for a practice set
   * GET /api/quiz-sets/by-practice-set/{practiceSetId}
   */
  async getByPracticeSet(practiceSetId: number): Promise<ApiResponse<QuizSet[]>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUIZ_SETS.BY_PRACTICE_SET, {
        practiceSetId,
      });
      const response = await this.api.get(endpoint);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tải lịch sử trắc nghiệm",
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
      await this.api.delete(endpoint);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể xóa bộ trắc nghiệm",
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
      const response = await this.api.get(endpoint);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tải mục trắc nghiệm",
      };
    }
  }
}

// Export singleton instance
export const quizSetManager = new QuizSetManager();
