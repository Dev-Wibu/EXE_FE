import type { ApiResponse } from "@/interfaces";
import { fetchClient } from "@/lib/api";
import i18n from "@/lib/i18n";

export interface CodingProblemExample {
  inputs?: string[];
  output?: string;
  explanation?: string;
}

export interface CodingProblem {
  id: number;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  problemStatement?: string;
  rulesAndConstraints?: string[];
  paramTypes?: string[];
  returnType?: string;
  visibleExamples?: CodingProblemExample[];
  executionTimeLimitMs?: number;
  memoryLimitMb?: number;
  codeStubs?: Record<string, string>;
  hiddenTestCases?: {
    inputs?: string[];
    expectedOutput?: string;
    weightPoints?: number;
  }[];
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export class CodingProblemManager {
  /**
   * Get all coding problems
   * GET /api/coding-problems
   */
  async getAll(): Promise<ApiResponse<CodingProblem[]>> {
    try {
      const response = await fetchClient.GET("/api/coding-problems", {}).then((res) => ({
        data: res.data,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      // @ts-expect-error: Backend Swagger schema mismatch
      return { success: true, data: response.data || [] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : i18n.t("problem.loadCodingListFailed"),
      };
    }
  }

  /**
   * Get a coding problem by ID
   * GET /api/coding-problems/{id}
   */
  async getById(id: number | string): Promise<ApiResponse<CodingProblem>> {
    try {
      const response = await fetchClient.GET("/api/coding-problems/{id}", {
        params: { path: { id: Number(id) } },
      }).then((res) => ({
        data: res.data,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      // @ts-expect-error: Backend Swagger schema mismatch
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load coding problem details.",
      };
    }
  }

  /**
   * Create a coding problem
   * POST /api/coding-problems
   */
  async create(data: Partial<CodingProblem>): Promise<ApiResponse<CodingProblem>> {
    try {
      const response = await fetchClient
        .POST("/api/coding-problems", {
          body: data as never,
        })
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));
      // @ts-expect-error: Backend Swagger schema mismatch
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : i18n.t("problem.createCodingFailed"),
      };
    }
  }

  /**
   * Update a coding problem
   * POST /api/coding-problems/{id}
   */
  async update(id: number, data: Partial<CodingProblem>): Promise<ApiResponse<CodingProblem>> {
    try {
      const response = await fetchClient
        // @ts-expect-error: Backend might not have this typed properly yet
        .POST("/api/coding-problems/{id}", {
          params: { path: { id } },
          body: data as never,
        })
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));
      // @ts-expect-error: Backend Swagger schema mismatch
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Cập nhật bài tập thất bại",
      };
    }
  }

  /**
   * Generate a coding problem using AI
   * POST /api/coding-problems/generate
   */
  async generate(request: {
    topic: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    targetLevel: string;
    context?: {
      jobTitle?: string;
      requirement?: string;
      prompting?: string;
    };
  }): Promise<ApiResponse<Partial<CodingProblem>>> {
    try {
      const response = await fetchClient
        .POST("/api/coding-problems/generate", {
          body: request as never,
        })
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));
      // @ts-expect-error: Backend Swagger schema mismatch
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : i18n.t("problem.autoCreateCodingFailed"),
      };
    }
  }
}

export const codingProblemManager = new CodingProblemManager();
