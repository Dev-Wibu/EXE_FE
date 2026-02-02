/**
 * Question Set Item Manager
 * Handles question set item CRUD operations for admin management
 * Based on schema-from-be.d.ts API specification
 */

import type { ApiResponse, BaseManager, PaginatedResponse, PaginationParams } from "@/interfaces";

import {
  API_ENDPOINTS,
  MANAGER_MODE,
  buildEndpoint,
  createApiInstance,
} from "@/constants/api.config";
import type { QuestionSet } from "./question-set.manager";

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
  category?: {
    id?: number;
    categoryName?: string;
    description?: string;
  };
  answer?: string;
  hint?: string;
}

/**
 * QuestionSetItem type based on backend schema
 */
export interface QuestionSetItem {
  questionSetItemId?: number;
  question?: Question;
  questionSet?: QuestionSet;
  orderIndex?: number;
}

/**
 * Form data for create/update operations
 */
export interface QuestionSetItemFormData {
  questionId: number;
  questionSetId: number;
  orderIndex?: number;
}

// Mock data for development
const mockQuestionSetItems: QuestionSetItem[] = [
  {
    questionSetItemId: 1,
    question: {
      questionId: 1,
      title: "What is React?",
      content: "Explain what React is and its main features.",
      level: "EASY",
    },
    questionSet: { questionSetId: 1, questionSetName: "Frontend Developer Interview" },
    orderIndex: 1,
  },
  {
    questionSetItemId: 2,
    question: {
      questionId: 2,
      title: "Virtual DOM",
      content: "Explain how Virtual DOM works in React.",
      level: "MEDIUM",
    },
    questionSet: { questionSetId: 1, questionSetName: "Frontend Developer Interview" },
    orderIndex: 2,
  },
  {
    questionSetItemId: 3,
    question: {
      questionId: 3,
      title: "React Hooks",
      content: "What are React Hooks and why were they introduced?",
      level: "MEDIUM",
    },
    questionSet: { questionSetId: 1, questionSetName: "Frontend Developer Interview" },
    orderIndex: 3,
  },
];

export class QuestionSetItemManager implements BaseManager<QuestionSetItem> {
  private mode = MANAGER_MODE;
  private api = createApiInstance();

  /**
   * Get all question set items
   * GET /api/question-set-items
   */
  async getAll(
    _params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<QuestionSetItem> | QuestionSetItem[]>> {
    if (this.mode === "mock") {
      return {
        success: true,
        data: [...mockQuestionSetItems],
      };
    }

    try {
      const response = await this.api.get(API_ENDPOINTS.QUESTION_SET_ITEMS.LIST, {
        params: _params,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch question set items",
      };
    }
  }

  /**
   * Get question set item by ID
   * GET /api/question-set-items/{id}
   */
  async getById(id: string | number): Promise<ApiResponse<QuestionSetItem>> {
    if (this.mode === "mock") {
      const item = mockQuestionSetItems.find((i) => i.questionSetItemId === Number(id));
      if (!item) {
        return {
          success: false,
          error: "Question set item not found",
        };
      }
      return {
        success: true,
        data: item,
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUESTION_SET_ITEMS.DETAIL, { id });
      const response = await this.api.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch question set item",
      };
    }
  }

  /**
   * Get question set items by question set ID
   * GET /api/question-set-items/by-question-set/{id}
   */
  async getByQuestionSetId(
    questionSetId: string | number
  ): Promise<ApiResponse<QuestionSetItem[]>> {
    if (this.mode === "mock") {
      const items = mockQuestionSetItems.filter(
        (i) => i.questionSet?.questionSetId === Number(questionSetId)
      );
      return {
        success: true,
        data: items,
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUESTION_SET_ITEMS.BY_QUESTION_SET, {
        id: questionSetId,
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
          error instanceof Error ? error.message : "Failed to fetch question set items by set ID",
      };
    }
  }

  /**
   * Create new question set item
   * POST /api/question-set-items (JSON body)
   */
  async create(data: Partial<QuestionSetItem>): Promise<ApiResponse<QuestionSetItem>> {
    if (this.mode === "mock") {
      const newId = Math.max(...mockQuestionSetItems.map((i) => i.questionSetItemId || 0)) + 1;
      const newItem: QuestionSetItem = {
        questionSetItemId: newId,
        question: data.question,
        questionSet: data.questionSet,
        orderIndex: data.orderIndex,
      };
      mockQuestionSetItems.push(newItem);
      return {
        success: true,
        data: newItem,
      };
    }

    try {
      const response = await this.api.post(API_ENDPOINTS.QUESTION_SET_ITEMS.CREATE, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create question set item",
      };
    }
  }

  /**
   * Create multiple question set items
   * POST /api/question-set-items/create-items
   */
  async createBulk(
    questionSet: QuestionSet,
    counts: { easy: number; medium: number; hard: number }
  ): Promise<ApiResponse<QuestionSetItem[]>> {
    if (this.mode === "mock") {
      return {
        success: false,
        error: "Bulk create not supported in mock mode",
      };
    }

    try {
      const response = await this.api.post(
        API_ENDPOINTS.QUESTION_SET_ITEMS.CREATE_BULK,
        questionSet,
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
        error: error instanceof Error ? error.message : "Failed to create question set items",
      };
    }
  }

  /**
   * Update question set item
   * POST /api/question-set-items (JSON body)
   * Note: Backend confirmed POST should be used for updates (not PUT)
   */
  async update(
    id: string | number,
    data: Partial<QuestionSetItem>
  ): Promise<ApiResponse<QuestionSetItem>> {
    if (this.mode === "mock") {
      const index = mockQuestionSetItems.findIndex((i) => i.questionSetItemId === Number(id));
      if (index === -1) {
        return {
          success: false,
          error: "Question set item not found",
        };
      }
      mockQuestionSetItems[index] = { ...mockQuestionSetItems[index], ...data };
      return {
        success: true,
        data: mockQuestionSetItems[index],
      };
    }

    try {
      const itemData: QuestionSetItem = { ...data, questionSetItemId: Number(id) };
      // Note: Backend confirmed POST should be used for updates (not PUT)
      const response = await this.api.post(API_ENDPOINTS.QUESTION_SET_ITEMS.UPDATE, itemData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update question set item",
      };
    }
  }

  /**
   * Delete question set item
   * POST /api/question-set-items/{id}
   * Note: Backend requires POST method for all operations including delete (PUT/DELETE not used)
   */
  async delete(id: string | number): Promise<ApiResponse<void>> {
    if (this.mode === "mock") {
      const index = mockQuestionSetItems.findIndex((i) => i.questionSetItemId === Number(id));
      if (index === -1) {
        return {
          success: false,
          error: "Question set item not found",
        };
      }
      mockQuestionSetItems.splice(index, 1);
      return {
        success: true,
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUESTION_SET_ITEMS.DELETE, { id });
      // Note: Backend requires POST method for delete operations (PUT/DELETE not used)
      await this.api.post(endpoint);
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete question set item",
      };
    }
  }
}

// Export singleton instance
export const questionSetItemManager = new QuestionSetItemManager();
