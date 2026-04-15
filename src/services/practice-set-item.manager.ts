/**
 * Practice Set Item Manager
 * Handles practice set item CRUD operations for admin management
 * Based on schema-from-be.d.ts API specification
 */

import type { ApiResponse, BaseManager, PaginatedResponse, PaginationParams } from "@/interfaces";

import { API_ENDPOINTS, buildEndpoint, createApiInstance } from "@/constants/api.config";
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
  private api = createApiInstance();

  /**
   * Get all practice set items
   * GET /api/practice-set-items
   */
  async getAll(
    _params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<PracticeSetItem> | PracticeSetItem[]>> {
    try {
      const response = await this.api.get(API_ENDPOINTS.PRACTICE_SET_ITEMS.LIST, {
        params: _params,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch practice set items",
      };
    }
  }

  /**
   * Get practice set item by ID
   * GET /api/practice-set-items/{id}
   */
  async getById(id: string | number): Promise<ApiResponse<PracticeSetItem>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.PRACTICE_SET_ITEMS.DETAIL, { id });
      const response = await this.api.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch practice set item",
      };
    }
  }

  /**
   * Get practice set items by practice set ID
   * GET /api/practice-set-items/by-question-set/{id}
   */
  async getByPracticeSetId(
    practiceSetId: string | number
  ): Promise<ApiResponse<PracticeSetItem[]>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.PRACTICE_SET_ITEMS.BY_QUESTION_SET, {
        id: practiceSetId,
      });
      const response = await this.api.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch practice set items by set ID",
      };
    }
  }

  /**
   * Create new practice set item
   * POST /api/practice-set-items (JSON body)
   */
  async create(data: Partial<PracticeSetItem>): Promise<ApiResponse<PracticeSetItem>> {
    try {
      const response = await this.api.post(API_ENDPOINTS.PRACTICE_SET_ITEMS.CREATE, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create practice set item",
      };
    }
  }

  /**
   * Create multiple practice set items
   * POST /api/practice-set-items/create-items
   */
  async createBulk(
    practiceSet: PracticeSet,
    counts: { easy: number; medium: number; hard: number }
  ): Promise<ApiResponse<PracticeSetItem[]>> {
    try {
      const response = await this.api.post(
        API_ENDPOINTS.PRACTICE_SET_ITEMS.CREATE_BULK,
        practiceSet,
        {
          params: counts,
        }
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create practice set items",
      };
    }
  }

  /**
   * Update practice set item
   * PUT /api/practice-set-items (JSON body)
   */
  async update(
    id: string | number,
    data: Partial<PracticeSetItem>
  ): Promise<ApiResponse<PracticeSetItem>> {
    try {
      const itemData: PracticeSetItem = { ...data, id: Number(id) };
      const response = await this.api.put(API_ENDPOINTS.PRACTICE_SET_ITEMS.UPDATE, itemData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update practice set item",
      };
    }
  }

  /**
   * Delete practice set item
   * POST /api/practice-set-items/{id}
   */
  async delete(id: string | number): Promise<ApiResponse<void>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.PRACTICE_SET_ITEMS.DELETE, { id });
      await this.api.post(endpoint);
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete practice set item",
      };
    }
  }
}

// Export singleton instance
export const practiceSetItemManager = new PracticeSetItemManager();
