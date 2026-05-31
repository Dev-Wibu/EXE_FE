import i18n from "@/lib/i18n";
const t = i18n.t.bind(i18n);
/**
 * Practice Set Manager
 * Handles practice set CRUD operations for admin management
 * Based on schema-from-be.d.ts API specification
 */

import { API_ENDPOINTS, buildEndpoint, createApiInstance } from "@/constants/api.config";
import type { ApiResponse, BaseManager, PaginatedResponse, PaginationParams } from "@/interfaces";
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
 * Does NOT include `major` or `user` fields.
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
  /** Populated when fetched via /api/practice-sets/interview-session/{id} */
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
  private api = createApiInstance();

  /**
   * Get all practice sets
   * GET /api/practice-sets
   */
  async getAll(
    _params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<PracticeSet> | PracticeSet[]>> {
    try {
      const response = await this.api.get(API_ENDPOINTS.PRACTICE_SETS.LIST, {
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

  /**
   * Get practice set by ID
   * GET /api/practice-sets/{id}
   */
  async getById(id: string | number): Promise<ApiResponse<PracticeSet>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.PRACTICE_SETS.DETAIL, {
        id,
      });
      const response = await this.api.get(endpoint);
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

  /**
   * Get practice sets by target level
   * GET /api/practice-sets/level/{level}
   */
  async getByLevel(level: PracticeSetLevel): Promise<ApiResponse<PracticeSet[]>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.PRACTICE_SETS.BY_LEVEL, {
        level,
      });
      const response = await this.api.get(endpoint);
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

  /**
   * Create new practice set
   * POST /api/practice-sets (JSON body)
   * Backend requires full PracticeSet schema including id: 0 for creation
   */
  async create(data: Partial<PracticeSet>): Promise<ApiResponse<PracticeSet>> {
    try {
      // Backend requires full PracticeSet schema for creation
      // id: 0 indicates new record creation
      const practiceSetPayload: PracticeSet = {
        id: 0,
        // Required: 0 for creation
        practiceSetName: data.practiceSetName,
        objective: data.objective,
        level: data.level,
        major: data.major,
      };
      const response = await this.api.post(API_ENDPOINTS.PRACTICE_SETS.CREATE, practiceSetPayload);
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

  /**
   * Update practice set
   * PUT /api/practice-sets (JSON body)
   */
  async update(id: string | number, data: Partial<PracticeSet>): Promise<ApiResponse<PracticeSet>> {
    try {
      const practiceSetData: PracticeSet = {
        ...data,
        id: Number(id),
      };
      const response = await this.api.put(API_ENDPOINTS.PRACTICE_SETS.UPDATE, practiceSetData);
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

  /**
   * Delete practice set
   * DELETE /api/practice-sets/{id}
   * Schema provides DELETE endpoint for practice sets
   */
  async delete(id: string | number): Promise<ApiResponse<void>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.PRACTICE_SETS.DELETE, {
        id,
      });
      // Use DELETE method as per schema
      await this.api.delete(endpoint);
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.cannotDeleteReviewSet"),
      };
    }
  }
  /**
   * Get full practice set with items
   * GET /api/practice-sets/full-set/{id}
   * Returns PracticeSetResponse = { practiceSet, practiceSetItem[] }
   */
  async getFullSet(id: string | number): Promise<
    ApiResponse<{
      practiceSet: PracticeSet;
      practiceSetItem: PracticeSetItem[];
    }>
  > {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.PRACTICE_SETS.FULL_SET, {
        id,
      });
      const response = await this.api.get(endpoint);
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

  /**
   * Get all practice sets for a given interview session
   * GET /api/practice-sets/interview-session/{interviewSessionId}
   */
  async getByInterviewSession(
    interviewSessionId: number
  ): Promise<ApiResponse<PracticeSetResponse[]>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.PRACTICE_SETS.BY_INTERVIEW_SESSION, {
        interviewSessionId,
      });
      const response = await this.api.get(endpoint);
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

  /**
   * Generate a practice set via AI from a completed interview session
   * POST /api/practice-sets/create-by-ai
   * Body: PracticeGenerateRequest — session must be COMPLETED with a result
   */
  async createByAI(data: {
    aiInterviewId?: number;
    dateNumber: number;
  }): Promise<ApiResponse<PracticeSet>> {
    try {
      const response = await this.api.post(API_ENDPOINTS.PRACTICE_SETS.CREATE_BY_AI, data);
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

  /**
   * Get all practice sets belonging to a specific user
   * GET /api/practice-sets/user/{userId}
   */
  async getByUser(userId: number): Promise<ApiResponse<PracticeSetResponse[]>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.PRACTICE_SETS.BY_USER, {
        userId,
      });
      const response = await this.api.get(endpoint);
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

  /**
   * Create full practice set with questions
   * POST /api/practice-sets/create-full
   * Body: PracticeRequest
   */
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
      const response = await this.api.post(API_ENDPOINTS.PRACTICE_SETS.CREATE_FULL, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToCreateAFull"),
      };
    }
  }
}

// Export singleton instance
export const practiceSetManager = new PracticeSetManager();
