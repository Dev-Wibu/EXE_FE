/**
 * Practice Set Manager
 * Handles practice set CRUD operations for admin management
 * Based on schema-from-be.d.ts API specification
 */

import type { ApiResponse, BaseManager, PaginatedResponse, PaginationParams } from "@/interfaces";

import {
  API_ENDPOINTS,
  MANAGER_MODE,
  buildEndpoint,
  createApiInstance,
} from "@/constants/api.config";
import type { PracticeSetItem } from "./practice-set-item.manager";
import type { Major } from "./question-major.manager";

/**
 * Practice set level enum based on backend schema
 */
export type PracticeSetLevel = "INTERN" | "FRESHER" | "JUNIOR" | "MIDDLE";

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
  user?: { id?: number; name?: string; email?: string };
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

// Mock data for development
const mockPracticeSets: PracticeSet[] = [
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

export class PracticeSetManager implements BaseManager<PracticeSet> {
  private mode = MANAGER_MODE;
  private api = createApiInstance();

  /**
   * Get all practice sets
   * GET /api/practice-sets
   */
  async getAll(
    _params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<PracticeSet> | PracticeSet[]>> {
    if (this.mode === "mock") {
      return {
        success: true,
        data: [...mockPracticeSets],
      };
    }

    try {
      const response = await this.api.get(API_ENDPOINTS.PRACTICE_SETS.LIST, { params: _params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch practice sets",
      };
    }
  }

  /**
   * Get practice set by ID
   * GET /api/practice-sets/{id}
   */
  async getById(id: string | number): Promise<ApiResponse<PracticeSet>> {
    if (this.mode === "mock") {
      const practiceSet = mockPracticeSets.find((qs) => qs.id === Number(id));
      if (!practiceSet) {
        return {
          success: false,
          error: "Practice set not found",
        };
      }
      return {
        success: true,
        data: practiceSet,
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.PRACTICE_SETS.DETAIL, { id });
      const response = await this.api.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch practice set",
      };
    }
  }

  /**
   * Get practice sets by target level
   * GET /api/practice-sets/level/{level}
   */
  async getByLevel(level: PracticeSetLevel): Promise<ApiResponse<PracticeSet[]>> {
    if (this.mode === "mock") {
      const filtered = mockPracticeSets.filter((qs) => qs.level === level);
      return {
        success: true,
        data: filtered,
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.PRACTICE_SETS.BY_LEVEL, { level });
      const response = await this.api.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch practice sets by level",
      };
    }
  }

  /**
   * Create new practice set
   * POST /api/practice-sets (JSON body)
   * Backend requires full PracticeSet schema including id: 0 for creation
   */
  async create(data: Partial<PracticeSet>): Promise<ApiResponse<PracticeSet>> {
    if (this.mode === "mock") {
      const newId = Math.max(...mockPracticeSets.map((qs) => qs.id || 0)) + 1;
      const newPracticeSet: PracticeSet = {
        id: newId,
        practiceSetName: data.practiceSetName,
        objective: data.objective,
        level: data.level,
        major: data.major,
      };
      mockPracticeSets.push(newPracticeSet);
      return {
        success: true,
        data: newPracticeSet,
      };
    }

    try {
      // Backend requires full PracticeSet schema for creation
      // id: 0 indicates new record creation
      const practiceSetPayload: PracticeSet = {
        id: 0, // Required: 0 for creation
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
        error: error instanceof Error ? error.message : "Failed to create practice set",
      };
    }
  }

  /**
   * Update practice set
   * PUT /api/practice-sets (JSON body)
   */
  async update(id: string | number, data: Partial<PracticeSet>): Promise<ApiResponse<PracticeSet>> {
    if (this.mode === "mock") {
      const index = mockPracticeSets.findIndex((qs) => qs.id === Number(id));
      if (index === -1) {
        return {
          success: false,
          error: "Practice set not found",
        };
      }
      mockPracticeSets[index] = { ...mockPracticeSets[index], ...data };
      return {
        success: true,
        data: mockPracticeSets[index],
      };
    }

    try {
      const practiceSetData: PracticeSet = { ...data, id: Number(id) };
      const response = await this.api.put(API_ENDPOINTS.PRACTICE_SETS.UPDATE, practiceSetData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update practice set",
      };
    }
  }

  /**
   * Delete practice set
   * DELETE /api/practice-sets/{id}
   * Schema provides DELETE endpoint for practice sets
   */
  async delete(id: string | number): Promise<ApiResponse<void>> {
    if (this.mode === "mock") {
      const index = mockPracticeSets.findIndex((qs) => qs.id === Number(id));
      if (index === -1) {
        return {
          success: false,
          error: "Practice set not found",
        };
      }
      mockPracticeSets.splice(index, 1);
      return {
        success: true,
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.PRACTICE_SETS.DELETE, { id });
      // Use DELETE method as per schema
      await this.api.delete(endpoint);
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete practice set",
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
    if (this.mode === "mock") {
      return {
        success: false,
        error: "Full set view not supported in mock mode",
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.PRACTICE_SETS.FULL_SET, { id });
      const response = await this.api.get(endpoint);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch full practice set",
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
    if (this.mode === "mock") {
      return {
        success: false,
        error: "Create full set not supported in mock mode",
      };
    }

    try {
      const response = await this.api.post(API_ENDPOINTS.PRACTICE_SETS.CREATE_FULL, data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create full practice set",
      };
    }
  }
}

// Export singleton instance
export const practiceSetManager = new PracticeSetManager();
