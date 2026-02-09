/**
 * Question Set Manager
 * Handles question set CRUD operations for admin management
 * Based on schema-from-be.d.ts API specification
 */

import type { ApiResponse, BaseManager, PaginatedResponse, PaginationParams } from "@/interfaces";

import {
  API_ENDPOINTS,
  MANAGER_MODE,
  buildEndpoint,
  createApiInstance,
} from "@/constants/api.config";
import type { Major } from "./question-major.manager";
import type { QuestionSetItem } from "./question-set-item.manager";

/**
 * Question set level enum based on backend schema
 */
export type QuestionSetLevel = "INTERN" | "FRESHER" | "JUNIOR" | "MIDDLE";

/**
 * QuestionSet type based on backend schema
 */
export interface QuestionSet {
  id?: number;
  practiceSetName?: string;
  objective?: string;
  level?: QuestionSetLevel;
  major?: Major;
  startDate?: string;
  user?: { id?: number; name?: string; email?: string; };
}

/**
 * Form data for create/update operations
 */
export interface QuestionSetFormData {
  practiceSetName: string;
  objective?: string;
  level: QuestionSetLevel;
  majorId?: number;
}

// Mock data for development
const mockQuestionSets: QuestionSet[] = [
  {
    id: 1,
    practiceSetName: "Frontend Developer Interview",
    objective: "Assess React and JavaScript skills",
    level: "JUNIOR",
    major: { id: 1, majorName: "Software Engineering" },
  },
  {
    id: 2,
    practiceSetName: "Data Science Fundamentals",
    objective: "Test Python and ML knowledge",
    level: "FRESHER",
    major: { id: 2, majorName: "Data Science" },
  },
  {
    id: 3,
    practiceSetName: "Product Manager Assessment",
    objective: "Evaluate product thinking",
    level: "MIDDLE",
    major: { id: 3, majorName: "Product Management" },
  },
];

export class QuestionSetManager implements BaseManager<QuestionSet> {
  private mode = MANAGER_MODE;
  private api = createApiInstance();

  /**
   * Get all question sets
   * GET /api/practice-sets
   */
  async getAll(
    _params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<QuestionSet> | QuestionSet[]>> {
    if (this.mode === "mock") {
      return {
        success: true,
        data: [...mockQuestionSets],
      };
    }

    try {
      const response = await this.api.get(API_ENDPOINTS.QUESTION_SETS.LIST, { params: _params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch question sets",
      };
    }
  }

  /**
   * Get question set by ID
   * GET /api/practice-sets/{id}
   */
  async getById(id: string | number): Promise<ApiResponse<QuestionSet>> {
    if (this.mode === "mock") {
      const questionSet = mockQuestionSets.find((qs) => qs.id === Number(id));
      if (!questionSet) {
        return {
          success: false,
          error: "Question set not found",
        };
      }
      return {
        success: true,
        data: questionSet,
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUESTION_SETS.DETAIL, { id });
      const response = await this.api.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch question set",
      };
    }
  }

  /**
   * Get question sets by target level
   * GET /api/practice-sets/level/{level}
   */
  async getByLevel(level: QuestionSetLevel): Promise<ApiResponse<QuestionSet[]>> {
    if (this.mode === "mock") {
      const filtered = mockQuestionSets.filter((qs) => qs.level === level);
      return {
        success: true,
        data: filtered,
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUESTION_SETS.BY_LEVEL, { level });
      const response = await this.api.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch question sets by level",
      };
    }
  }

  /**
   * Create new question set
   * POST /api/practice-sets (JSON body)
   * Backend requires full QuestionSet schema including id: 0 for creation
   */
  async create(data: Partial<QuestionSet>): Promise<ApiResponse<QuestionSet>> {
    if (this.mode === "mock") {
      const newId = Math.max(...mockQuestionSets.map((qs) => qs.id || 0)) + 1;
      const newQuestionSet: QuestionSet = {
        id: newId,
        practiceSetName: data.practiceSetName,
        objective: data.objective,
        level: data.level,
        major: data.major,
      };
      mockQuestionSets.push(newQuestionSet);
      return {
        success: true,
        data: newQuestionSet,
      };
    }

    try {
      // Backend requires full QuestionSet schema for creation
      // id: 0 indicates new record creation
      const questionSetPayload: QuestionSet = {
        id: 0, // Required: 0 for creation
        practiceSetName: data.practiceSetName,
        objective: data.objective,
        level: data.level,
        major: data.major,
      };
      const response = await this.api.post(API_ENDPOINTS.QUESTION_SETS.CREATE, questionSetPayload);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create question set",
      };
    }
  }

  /**
   * Update question set
   * POST /api/practice-sets (JSON body)
   * Note: Backend confirmed POST should be used for updates (not PUT)
   */
  async update(id: string | number, data: Partial<QuestionSet>): Promise<ApiResponse<QuestionSet>> {
    if (this.mode === "mock") {
      const index = mockQuestionSets.findIndex((qs) => qs.id === Number(id));
      if (index === -1) {
        return {
          success: false,
          error: "Question set not found",
        };
      }
      mockQuestionSets[index] = { ...mockQuestionSets[index], ...data };
      return {
        success: true,
        data: mockQuestionSets[index],
      };
    }

    try {
      const questionSetData: QuestionSet = { ...data, id: Number(id) };
      // Note: Backend confirmed POST should be used for updates (not PUT)
      const response = await this.api.post(API_ENDPOINTS.QUESTION_SETS.UPDATE, questionSetData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update question set",
      };
    }
  }

  /**
   * Delete question set
   * DELETE /api/practice-sets/{id}
   * Schema provides DELETE endpoint for question sets
   */
  async delete(id: string | number): Promise<ApiResponse<void>> {
    if (this.mode === "mock") {
      const index = mockQuestionSets.findIndex((qs) => qs.id === Number(id));
      if (index === -1) {
        return {
          success: false,
          error: "Question set not found",
        };
      }
      mockQuestionSets.splice(index, 1);
      return {
        success: true,
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUESTION_SETS.DELETE, { id });
      // Use DELETE method as per schema
      await this.api.delete(endpoint);
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete question set",
      };
    }
  }
  /**
   * Get full question set with items
   * GET /api/practice-sets/full-set/{id}
   * Returns PracticeSetResponse = { practiceSet, practiceSetItem[] }
   */
  async getFullSet(
    id: string | number
  ): Promise<
    ApiResponse<{
      practiceSet: QuestionSet;
      practiceSetItem: QuestionSetItem[];
    }>
  > {
    if (this.mode === "mock") {
      return {
        success: false,
        error: "Full set view not supported in mock mode",
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUESTION_SETS.FULL_SET, { id });
      const response = await this.api.get(endpoint);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch full question set",
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
    target: QuestionSetLevel;
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
  }): Promise<ApiResponse<QuestionSet>> {
    if (this.mode === "mock") {
      return {
        success: false,
        error: "Create full set not supported in mock mode",
      };
    }

    try {
      const response = await this.api.post(API_ENDPOINTS.QUESTION_SETS.CREATE_FULL, data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create full question set",
      };
    }
  }
}

// Export singleton instance
export const questionSetManager = new QuestionSetManager();
