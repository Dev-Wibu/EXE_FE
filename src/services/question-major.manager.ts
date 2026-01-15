/**
 * Question Major Manager
 * Handles question major (discipline/field) CRUD operations for admin management
 * Based on schema-from-be.d.ts API specification
 */

import type { ApiResponse, BaseManager, PaginatedResponse, PaginationParams } from "@/interfaces";

import { API_ENDPOINTS, MANAGER_MODE, apiConfig, buildEndpoint } from "@/constants/api.config";
import axios from "axios";

/**
 * Type guard to check if a value is a plain object (not array, not null)
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Serialize params for Spring Boot query parameter binding
 * Converts nested objects to dot notation query string format
 *
 * Spring Boot uses @ModelAttribute binding with dot notation:
 * major.id=1&major.majorName=Test (NOT JSON string as parameter value)
 *
 * @param prefix - The prefix for parameter names (e.g., "major")
 * @param obj - The object to serialize
 * @returns Array of URL-encoded parameter strings
 */
function serializeParamsWithDotNotation(prefix: string, obj: Record<string, unknown>): string[] {
  const params: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;

    const paramKey = `${prefix}.${key}`;

    if (isPlainObject(value)) {
      params.push(...serializeParamsWithDotNotation(paramKey, value));
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (isPlainObject(item)) {
          params.push(...serializeParamsWithDotNotation(`${paramKey}[${index}]`, item));
        } else {
          params.push(
            `${encodeURIComponent(`${paramKey}[${index}]`)}=${encodeURIComponent(String(item))}`
          );
        }
      });
    } else {
      params.push(`${encodeURIComponent(paramKey)}=${encodeURIComponent(String(value))}`);
    }
  }

  return params;
}

/**
 * Main serializer function for axios paramsSerializer
 * Converts { major: { id: 1, majorName: "Test" } } to "major.id=1&major.majorName=Test"
 *
 * @param params - The parameters object to serialize
 * @returns URL-encoded query string
 */
function serializeParams(params: Record<string, unknown>): string {
  const allParams: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;

    if (isPlainObject(value)) {
      allParams.push(...serializeParamsWithDotNotation(key, value));
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (isPlainObject(item)) {
          allParams.push(...serializeParamsWithDotNotation(`${key}[${index}]`, item));
        } else {
          allParams.push(
            `${encodeURIComponent(`${key}[${index}]`)}=${encodeURIComponent(String(item))}`
          );
        }
      });
    } else {
      allParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }

  return allParams.join("&");
}

/**
 * Major type based on backend schema
 */
export interface Major {
  id?: number;
  majorName?: string;
  description?: string;
}

/**
 * Form data for create/update operations
 */
export interface MajorFormData {
  majorName: string;
  description?: string;
}

// Mock data for development
const mockMajors: Major[] = [
  { id: 1, majorName: "Software Engineering", description: "Software development and engineering" },
  { id: 2, majorName: "Data Science", description: "Data analysis and machine learning" },
  { id: 3, majorName: "Product Management", description: "Product strategy and management" },
  { id: 4, majorName: "UI/UX Design", description: "User interface and experience design" },
  { id: 5, majorName: "DevOps", description: "Development operations and infrastructure" },
];

export class QuestionMajorManager implements BaseManager<Major> {
  private mode = MANAGER_MODE;
  private api = axios.create(apiConfig);

  /**
   * Get all question majors
   * GET /api/question-majors
   */
  async getAll(
    _params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<Major> | Major[]>> {
    if (this.mode === "mock") {
      return {
        success: true,
        data: [...mockMajors],
      };
    }

    try {
      const response = await this.api.get(API_ENDPOINTS.QUESTION_MAJORS.LIST, { params: _params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch question majors",
      };
    }
  }

  /**
   * Get question major by ID
   * GET /api/question-majors/{id}
   */
  async getById(id: string | number): Promise<ApiResponse<Major>> {
    if (this.mode === "mock") {
      const major = mockMajors.find((m) => m.id === Number(id));
      if (!major) {
        return {
          success: false,
          error: "Question major not found",
        };
      }
      return {
        success: true,
        data: major,
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUESTION_MAJORS.DETAIL, { id });
      const response = await this.api.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch question major",
      };
    }
  }

  /**
   * Create new question major
   * POST /api/question-majors (query param: major with dot notation)
   * Spring Boot expects: major.id=1&major.majorName=Test
   */
  async create(data: Partial<Major>): Promise<ApiResponse<Major>> {
    if (this.mode === "mock") {
      const newId = Math.max(...mockMajors.map((m) => m.id || 0)) + 1;
      const newMajor: Major = {
        id: newId,
        majorName: data.majorName,
        description: data.description,
      };
      mockMajors.push(newMajor);
      return {
        success: true,
        data: newMajor,
      };
    }

    try {
      // Based on schema, createQuestionMajor uses query param with dot notation
      // Use paramsSerializer to convert { major: { majorName: "Test" } }
      // to query string: major.majorName=Test
      const response = await this.api.post(API_ENDPOINTS.QUESTION_MAJORS.CREATE, null, {
        params: { major: data },
        paramsSerializer: serializeParams,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create question major",
      };
    }
  }

  /**
   * Update question major
   * POST /api/question-majors (query param: major with dot notation)
   * Note: Backend confirmed POST should be used for updates (not PUT)
   * Spring Boot expects: major.id=1&major.majorName=Test
   */
  async update(id: string | number, data: Partial<Major>): Promise<ApiResponse<Major>> {
    if (this.mode === "mock") {
      const index = mockMajors.findIndex((m) => m.id === Number(id));
      if (index === -1) {
        return {
          success: false,
          error: "Question major not found",
        };
      }
      mockMajors[index] = { ...mockMajors[index], ...data };
      return {
        success: true,
        data: mockMajors[index],
      };
    }

    try {
      const majorData: Major = { ...data, id: Number(id) };
      // Note: Backend confirmed POST should be used for updates (not PUT)
      // Use paramsSerializer to convert { major: { id: 1, majorName: "Test" } }
      // to query string: major.id=1&major.majorName=Test
      const response = await this.api.post(API_ENDPOINTS.QUESTION_MAJORS.UPDATE, null, {
        params: { major: majorData },
        paramsSerializer: serializeParams,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update question major",
      };
    }
  }

  /**
   * Delete question major
   * POST /api/question-majors/{id}
   * Note: Backend requires POST method for all operations including delete (PUT/DELETE not used)
   */
  async delete(id: string | number): Promise<ApiResponse<void>> {
    if (this.mode === "mock") {
      const index = mockMajors.findIndex((m) => m.id === Number(id));
      if (index === -1) {
        return {
          success: false,
          error: "Question major not found",
        };
      }
      mockMajors.splice(index, 1);
      return {
        success: true,
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.QUESTION_MAJORS.DELETE, { id });
      // Note: Backend requires POST method for delete operations (PUT/DELETE not used)
      await this.api.post(endpoint);
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete question major",
      };
    }
  }
}

// Export singleton instance
export const questionMajorManager = new QuestionMajorManager();
