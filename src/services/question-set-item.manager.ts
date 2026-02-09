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
 * QuestionSetItem type based on backend schema
 */
export interface QuestionSetItem {
  id?: number;
  practiceQuestion?: Question;
  practiceSet?: QuestionSet;
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
    id: 1,
    practiceQuestion: {
      questionId: 1,
      title: "What is React?",
      content: "Explain what React is and its main features.",
      level: "EASY",
    },
    practiceSet: { id: 1, practiceSetName: "Frontend Developer Interview" },
    orderIndex: 1,
  },
  {
    id: 2,
    practiceQuestion: {
      questionId: 2,
      title: "Virtual DOM",
      content: "Explain how Virtual DOM works in React.",
      level: "MEDIUM",
    },
    practiceSet: { id: 1, practiceSetName: "Frontend Developer Interview" },
    orderIndex: 2,
  },
  {
    id: 3,
    practiceQuestion: {
      questionId: 3,
      title: "React Hooks",
      content: "What are React Hooks and why were they introduced?",
      level: "MEDIUM",
    },
    practiceSet: { id: 1, practiceSetName: "Frontend Developer Interview" },
    orderIndex: 3,
  },
];

export class QuestionSetItemManager implements BaseManager<QuestionSetItem> {
  private mode = MANAGER_MODE;
  private api = createApiInstance();

  /**
   * Get all question set items
   * GET /api/practice-set-items
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
   * GET /api/practice-set-items/{id}
   */
  async getById(id: string | number): Promise<ApiResponse<QuestionSetItem>> {
    if (this.mode === "mock") {
      const item = mockQuestionSetItems.find((i) => i.id === Number(id));
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
   * GET /api/practice-set-items/by-question-set/{id}
   */
  async getByQuestionSetId(
    questionSetId: string | number
  ): Promise<ApiResponse<QuestionSetItem[]>> {
    if (this.mode === "mock") {
      const items = mockQuestionSetItems.filter(
        (i) => i.practiceSet?.id === Number(questionSetId)
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
   * POST /api/practice-set-items (JSON body)
   */
  async create(data: Partial<QuestionSetItem>): Promise<ApiResponse<QuestionSetItem>> {
    if (this.mode === "mock") {
      const newId = Math.max(...mockQuestionSetItems.map((i) => i.id || 0)) + 1;
      const newItem: QuestionSetItem = {
        id: newId,
        practiceQuestion: data.practiceQuestion,
        practiceSet: data.practiceSet,
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
   * POST /api/practice-set-items/create-items
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
   * POST /api/practice-set-items (JSON body)
   * Note: Backend confirmed POST should be used for updates (not PUT)
   */
  async update(
    id: string | number,
    data: Partial<QuestionSetItem>
  ): Promise<ApiResponse<QuestionSetItem>> {
    if (this.mode === "mock") {
      const index = mockQuestionSetItems.findIndex((i) => i.id === Number(id));
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
      const itemData: QuestionSetItem = { ...data, id: Number(id) };
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
   * POST /api/practice-set-items/{id}
   * Note: Backend requires POST method for all operations including delete (PUT/DELETE not used)
   */
  async delete(id: string | number): Promise<ApiResponse<void>> {
    if (this.mode === "mock") {
      const index = mockQuestionSetItems.findIndex((i) => i.id === Number(id));
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
