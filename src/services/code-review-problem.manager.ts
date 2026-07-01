import type { ApiResponse } from "@/interfaces";
import { fetchClient } from "@/lib/api";
import i18n from "@/lib/i18n";

export interface CodeFile {
  filename?: string;
  content?: string;
  language?: string;
}

export interface ExpectedIssue {
  filename?: string;
  lineNumber?: number;
  severity?: "CRITICAL" | "WARNING" | "INFO";
  description?: string;
}

export interface CodeReviewProblem {
  id: number;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  language?: string;
  problemStatement?: string;
  files?: CodeFile[];
  expectedIssues?: ExpectedIssue[];
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export class CodeReviewProblemManager {
  /**
   * Get all code review problems
   * GET /api/code-review-problems
   */
  async getAll(): Promise<ApiResponse<CodeReviewProblem[]>> {
    try {
      const response = await fetchClient.GET("/api/code-review-problems", {}).then((res) => ({
        data: res.data,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      // @ts-expect-error: Backend Swagger schema mismatch
      return { success: true, data: response.data || [] };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : i18n.t("problem.loadCodeReviewListFailed"),
      };
    }
  }

  /**
   * Get code review problem by id
   * GET /api/code-review-problems/{id}
   */
  async getById(id: number): Promise<ApiResponse<CodeReviewProblem>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const endpoint = `/api/code-review-problems/${encodeURIComponent(id)}` as any;
      const response = await fetchClient.GET(endpoint, {}).then((res) => ({
        data: res.data,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : i18n.t("problem.loadCodeReviewDetailsFailed"),
      };
    }
  }

  /**
   * Create a code review problem
   * POST /api/code-review-problems
   */
  async create(data: Partial<CodeReviewProblem>): Promise<ApiResponse<CodeReviewProblem>> {
    try {
      const response = await fetchClient
        .POST("/api/code-review-problems", {
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
        error: error instanceof Error ? error.message : i18n.t("problem.createCodeReviewFailed"),
      };
    }
  }

  /**
   * Update a code review problem
   * PUT /api/code-review-problems/{id}
   */
  async update(
    id: number,
    data: Partial<CodeReviewProblem>
  ): Promise<ApiResponse<CodeReviewProblem>> {
    try {
      const payload = { ...data, id };
      const response = await fetchClient
        .POST("/api/code-review-problems", {
          body: payload as never,
        })
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : i18n.t("adminCodeReviewProblem.updateFailed"),
      };
    }
  }

  /**
   * Generate a code review problem using AI
   * POST /api/code-review-problems/generate
   */
  async generate(request: {
    topic: string;
    difficulty?: "EASY" | "MEDIUM" | "HARD";
    targetLevel: string;
    programmingLanguage: string;
    context?: {
      jobTitle?: string;
      requirement?: string;
      prompting?: string;
    };
  }): Promise<ApiResponse<Partial<CodeReviewProblem>>> {
    try {
      const response = await fetchClient
        .POST("/api/code-review-problems/generate", {
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
        error:
          error instanceof Error ? error.message : i18n.t("problem.autoCreateCodeReviewFailed"),
      };
    }
  }
}

export const codeReviewProblemManager = new CodeReviewProblemManager();
