import type { ApiResponse } from "@/interfaces";
import { fetchClient } from "@/lib/api";

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
        error: error instanceof Error ? error.message : "Không thể tải danh sách bài tập lập trình",
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
        error: error instanceof Error ? error.message : "Không thể tạo bài tập lập trình",
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
        error: error instanceof Error ? error.message : "Không thể tạo tự động bài tập lập trình",
      };
    }
  }
}

export const codingProblemManager = new CodingProblemManager();
