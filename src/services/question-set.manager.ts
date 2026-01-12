/**
 * Question Set Manager
 * Handles question set CRUD operations for admin management
 * Based on schema-from-be.d.ts API specification
 */

import type { ApiResponse, BaseManager, PaginatedResponse, PaginationParams } from "@/interfaces";

import { API_ENDPOINTS, MANAGER_MODE, apiConfig, buildEndpoint } from "@/constants/api.config";
import axios from "axios";
import type { Major } from "./question-major.manager";

/**
 * Question set level enum based on backend schema
 */
export type QuestionSetLevel = "INTERN" | "FRESHER" | "JUNIOR" | "MIDDLE";

/**
 * QuestionSet type based on backend schema
 */
export interface QuestionSet {
  questionSetId?: number;
  questionSetName?: string;
  objective?: string;
  level?: QuestionSetLevel;
  major?: Major;
}

/**
 * Form data for create/update operations
 */
export interface QuestionSetFormData {
  questionSetName: string;
  objective?: string;
  level: QuestionSetLevel;
  majorId?: number;
}

// Mock data for development
const mockQuestionSets: QuestionSet[] = [
  {
    questionSetId: 1,
    questionSetName: "Frontend Developer Interview",
    objective: "Assess React and JavaScript skills",
    level: "JUNIOR",
    major: { id: 1, majorName: "Software Engineering" },
  },
  {
    questionSetId: 2,
    questionSetName: "Data Science Fundamentals",
    objective: "Test Python and ML knowledge",
    level: "FRESHER",
    major: { id: 2, majorName: "Data Science" },
  },
  {
    questionSetId: 3,
    questionSetName: "Product Manager Assessment",
    objective: "Evaluate product thinking",
    level: "MIDDLE",
    major: { id: 3, majorName: "Product Management" },
  },
];

export class QuestionSetManager implements BaseManager<QuestionSet> {
  private mode = MANAGER_MODE;
  private api = axios.create(apiConfig);

  /**
   * Get all question sets
   * GET /api/question-sets
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
   * GET /api/question-sets/{id}
   */
  async getById(id: string | number): Promise<ApiResponse<QuestionSet>> {
    if (this.mode === "mock") {
      const questionSet = mockQuestionSets.find((qs) => qs.questionSetId === Number(id));
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
   * GET /api/question-sets/level/{level}
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
      const endpoint = `/api/question-sets/level/${level}`;
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
   * POST /api/question-sets (JSON body)
   */
  async create(data: Partial<QuestionSet>): Promise<ApiResponse<QuestionSet>> {
    if (this.mode === "mock") {
      const newId = Math.max(...mockQuestionSets.map((qs) => qs.questionSetId || 0)) + 1;
      const newQuestionSet: QuestionSet = {
        questionSetId: newId,
        questionSetName: data.questionSetName,
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
      const response = await this.api.post(API_ENDPOINTS.QUESTION_SETS.CREATE, data);
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
   * POST /api/question-sets (JSON body)
   * Note: Backend confirmed POST should be used for updates (not PUT)
   */
  async update(id: string | number, data: Partial<QuestionSet>): Promise<ApiResponse<QuestionSet>> {
    if (this.mode === "mock") {
      const index = mockQuestionSets.findIndex((qs) => qs.questionSetId === Number(id));
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
      const questionSetData: QuestionSet = { ...data, questionSetId: Number(id) };
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
   * DELETE /api/question-sets/{id}
   */
  async delete(id: string | number): Promise<ApiResponse<void>> {
    if (this.mode === "mock") {
      const index = mockQuestionSets.findIndex((qs) => qs.questionSetId === Number(id));
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
}

// Export singleton instance
export const questionSetManager = new QuestionSetManager();
