import i18n from "@/lib/i18n";
const t = i18n.t.bind(i18n);
/**
 * Practice Set Manager
 * Handles practice set CRUD operations for admin management
 * Based on schema-from-be.d.ts API specification
 */

import { API_ENDPOINTS, buildEndpoint } from "@/constants/api.config";
import type { ApiResponse, BaseManager, PaginatedResponse, PaginationParams } from "@/interfaces";
import { fetchClient } from "@/lib/api";
import type { PracticeSetItem } from "./practice-set-item.manager";
import type { Major } from "./question-major.manager";

/**
 * Practice set level enum based on backend schema
 */
export type PracticeSetLevel = "INTERN" | "FRESHER" | "JUNIOR" | "MIDDLE";

/**
 * A question embedded inside a PracticeSet returned by the session endpoint
 * GET /api/practice-sets/interview-session/{id}
 */
export interface SessionQuestion {
  questionId?: number;
  title?: string;
  content?: string;
  level?: "EASY" | "MEDIUM" | "HARD";
  lesson?: {
    id?: number;
    lessonName?: string;
    description?: string | null;
    urlTutorial?: string | null;
  };
  answer?: string;
  hint?: string;
}

/**
 * Lightweight response shape returned by /api/practice-sets/user/{userId}
 */
export interface PracticeSetResponse {
  id?: number;
  practiceSetName?: string;
  objective?: string;
  level?: PracticeSetLevel;
  startDate?: string;
  interviewSessionId?: number;
  questions?: Array<{
    questionId?: number;
    title?: string;
    content?: string;
    level?: "EASY" | "MEDIUM" | "HARD";
    lessonName?: string;
    answer?: string;
    hint?: string;
  }>;
  quizzes?: Array<{
    quizId?: number;
    quizName?: string;
    index?: number;
    submit?: boolean;
  }>;
}

/**
 * PracticeSet type based on backend schema
 */
export interface PracticeSet {
  id?: number;
  practiceSetName?: string;
  objective?: string;
  level?: PracticeSetLevel;
  major?: Major;
  startDate?: string;
  dateNumber?: number;
  user?: {
    id?: number;
    name?: string;
    email?: string;
  };
  interviewSessionId?: number;
  questions?: SessionQuestion[];
}

/**
 * Form data for create/update operations
 */
export interface PracticeSetFormData {
  practiceSetName: string;
  objective?: string;
  level: PracticeSetLevel;
  majorId?: number;
}
export class PracticeSetManager implements BaseManager<PracticeSet> {
  async getAll(
    _params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<PracticeSet> | PracticeSet[]>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any).GET("/api/practice-sets", {
        params: _params,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToLoadReviewSet3"),
      };
    }
  }

  async getById(id: string | number): Promise<ApiResponse<PracticeSet>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.PRACTICE_SETS.DETAIL, { id });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any).GET(endpoint, {});
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToLoadReviewKit"),
      };
    }
  }

  async getByLevel(level: PracticeSetLevel): Promise<ApiResponse<PracticeSet[]>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.PRACTICE_SETS.BY_LEVEL, { level });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any).GET(endpoint, {});
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToDownloadReviewKits"),
      };
    }
  }

  async create(data: Partial<PracticeSet>): Promise<ApiResponse<PracticeSet>> {
    try {
      const practiceSetPayload: PracticeSet = {
        id: 0,
        practiceSetName: data.practiceSetName,
        objective: data.objective,
        level: data.level,
        major: data.major,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any).POST("/api/practice-sets", {
        body: practiceSetPayload,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToCreateReviewSet2"),
      };
    }
  }

  async update(id: string | number, data: Partial<PracticeSet>): Promise<ApiResponse<PracticeSet>> {
    try {
      const practiceSetData: PracticeSet = { ...data, id: Number(id) };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any).PUT("/api/practice-sets", {
        body: practiceSetData,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToUpdateReviewSet1"),
      };
    }
  }

  async delete(id: string | number): Promise<ApiResponse<void>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.PRACTICE_SETS.DELETE, { id });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (fetchClient as any).DELETE(endpoint, {});
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.cannotDeleteReviewSet"),
      };
    }
  }

  async getFullSet(
    id: string | number
  ): Promise<ApiResponse<{ practiceSet: PracticeSet; practiceSetItem: PracticeSetItem[] }>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.PRACTICE_SETS.FULL_SET, { id });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any).GET(endpoint, {});
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToDownloadFullReview"),
      };
    }
  }

  async getByInterviewSession(
    interviewSessionId: number
  ): Promise<ApiResponse<PracticeSetResponse[]>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.PRACTICE_SETS.BY_INTERVIEW_SESSION, {
        interviewSessionId,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any).GET(endpoint, {});
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToLoadSessionTraining"),
      };
    }
  }

  async createByAI(data: {
    aiInterviewId?: number;
    dateNumber: number;
  }): Promise<ApiResponse<PracticeSet>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any).POST("/api/practice-sets/create-by-ai", {
        body: data,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.cannotCreateAiTrainingRoutes"),
      };
    }
  }

  async getByUser(userId: number): Promise<ApiResponse<PracticeSetResponse[]>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.PRACTICE_SETS.BY_USER, { userId });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any).GET(endpoint, {});
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("common.unableToLoadPracticeSetList"),
      };
    }
  }

  async createFull(data: {
    practiceSetName: string;
    objective?: string;
    target: PracticeSetLevel;
    majorId?: number;
    dateNumber?: number;
    questions?: Array<{
      title?: string;
      content?: string;
      level?: "EASY" | "MEDIUM" | "HARD";
      lessonName?: string;
      answer?: string;
      hint?: string;
    }>;
  }): Promise<ApiResponse<PracticeSet>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any).POST("/api/practice-sets/create-full", {
        body: data,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.cannotCreateFullReviewSet"),
      };
    }
  }
}

// Export singleton instance
export const practiceSetManager = new PracticeSetManager();
