import i18n from "@/lib/i18n";
const t = i18n.t.bind(i18n);
/**
 * Practice Set Item Manager
 * Handles practice set item CRUD operations for admin management
 * Based on schema-from-be.d.ts API specification
 */

import { API_ENDPOINTS, buildEndpoint } from "@/constants/api.config";
import type { ApiResponse, BaseManager, PaginatedResponse, PaginationParams } from "@/interfaces";
import { fetchClient } from "@/lib/api";
import type { PracticeSet } from "./practice-set.manager";

/**
 * Question level enum based on backend schema
 */
export type QuestionLevel = "EASY" | "MEDIUM" | "HARD";

/**
 * Question type based on backend schema
 */
export interface Question {
  questionId?: number;
  title?: string;
  content?: string;
  level?: QuestionLevel;
  lesson?: {
    id?: number;
    lessonName?: string;
    description?: string;
    urlTutorial?: string;
  };
  answer?: string;
  hint?: string;
}

/**
 * PracticeSetItem type based on backend schema
 */
export interface PracticeSetItem {
  id?: number;
  practiceQuestion?: Question;
  practiceSet?: PracticeSet;
  orderIndex?: number;
}

/**
 * Form data for create/update operations
 */
export interface PracticeSetItemFormData {
  questionId: number;
  practiceSetId: number;
  orderIndex?: number;
}

export class PracticeSetItemManager implements BaseManager<PracticeSetItem> {
  async getAll(
    _params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<PracticeSetItem> | PracticeSetItem[]>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any).GET("/api/practice-set-items", {
        params: _params,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToLoadReviewSet"),
      };
    }
  }

  async getById(id: string | number): Promise<ApiResponse<PracticeSetItem>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.PRACTICE_SET_ITEMS.DETAIL, { id });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any).GET(endpoint, {});
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToLoadReviewSet1"),
      };
    }
  }

  async getByPracticeSetId(
    practiceSetId: string | number
  ): Promise<ApiResponse<PracticeSetItem[]>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.PRACTICE_SET_ITEMS.BY_QUESTION_SET, {
        id: practiceSetId,
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
        error: error instanceof Error ? error.message : t("general.unableToLoadReviewSet2"),
      };
    }
  }

  async create(data: Partial<PracticeSetItem>): Promise<ApiResponse<PracticeSetItem>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any).POST("/api/practice-set-items", { body: data });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToCreateReviewSet"),
      };
    }
  }

  async createBulk(
    practiceSet: PracticeSet,
    counts: { easy: number; medium: number; hard: number }
  ): Promise<ApiResponse<PracticeSetItem[]>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any).POST("/api/practice-set-items/create-items", {
        params: counts,
        body: practiceSet,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToCreateReviewSet1"),
      };
    }
  }

  async update(
    id: string | number,
    data: Partial<PracticeSetItem>
  ): Promise<ApiResponse<PracticeSetItem>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.PRACTICE_SET_ITEMS.DETAIL, { id });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (fetchClient as any).PUT(endpoint, { body: data });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToUpdateReviewSet"),
      };
    }
  }

  async delete(id: string | number): Promise<ApiResponse<void>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.PRACTICE_SET_ITEMS.DELETE, { id });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (fetchClient as any).DELETE(endpoint, {});
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.reviewSetCannotBeDeleted"),
      };
    }
  }
}

// Export singleton instance
export const practiceSetItemManager = new PracticeSetItemManager();
