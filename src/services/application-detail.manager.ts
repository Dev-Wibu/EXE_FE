import type { ApiResponse } from "@/interfaces";
import { fetchClient } from "@/lib/api";
import i18n from "@/lib/i18n";
import type { components } from "../../schema-from-be";

const t = i18n.t.bind(i18n);

export type SubmissionResult = components["schemas"]["SubmissionResult"];
export type ApplicationDetail = components["schemas"]["ApplicationDetail"];

export interface SubmitApplicationDetailParams {
  applicationId: number;
  textContent?: string;
  file?: File;
  quizAnswers?: string[];
  compileRequest?: string; // JSON string for coding submissions
}

export interface HrScoreParams {
  applicationDetailId: number;
  isPass: boolean;
  note: string;
  score: number;
}

export interface CodeReviewSubmission {
  filename: string;
  lineNumber: number;
  severity: string;
  description: string;
}

export interface CodeReviewEvaluateParams {
  applicationId: number;
  roundId: number;
  submissions: CodeReviewSubmission[];
}

export class ApplicationDetailManager {
  private extractErrorMessage(error: unknown): string {
    if (error && typeof error === "object" && "response" in error) {
      return (
        // @ts-expect-error: Backend Swagger schema mismatch
        error.response?.data?.message ||
        // @ts-expect-error: Backend Swagger schema mismatch
        error.message ||
        t("common.anErrorHasOccurred")
      );
    }
    if (error instanceof Error) {
      return error.message;
    }
    return t("general.anUnknownErrorHasOccurred");
  }

  /**
   * Submit application detail (CV screening, quiz answers, email, coding, etc.)
   * POST /api/application-details/submit (multipart/form-data)
   */
  async submit(params: SubmitApplicationDetailParams): Promise<ApiResponse<SubmissionResult>> {
    try {
      const formData = new FormData();
      formData.append("applicationId", String(params.applicationId));
      if (params.textContent) {
        formData.append("textContent", params.textContent);
      }
      if (params.file) {
        formData.append("file", params.file);
      }
      if (params.quizAnswers && params.quizAnswers.length > 0) {
        params.quizAnswers.forEach((ans) => formData.append("quizAnswers", ans));
      }
      if (params.compileRequest) {
        formData.append("compileRequest", params.compileRequest);
      }

      const response = await fetchClient
        .POST("/api/application-details/submit", {
          headers: {
            "Content-Type": undefined,
          },
          body: formData as unknown as Record<string, unknown>,
        })
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));

      return {
        success: true,
        data: response.data as SubmissionResult,
      };
    } catch (error) {
      console.error("[ApplicationDetailManager] submit error:", error);
      return {
        success: false,
        error: this.extractErrorMessage(error),
      };
    }
  }

  /**
   * HR/Admin scores and approves/rejects a candidate's application round
   * POST /api/application-details/hr-score?applicationDetailId=&isPass=&note=&score=
   */
  async hrScore(params: HrScoreParams): Promise<ApiResponse<ApplicationDetail>> {
    try {
      const response = await fetchClient.POST("/api/application-details/hr-score", {
        params: {
          query: {
            applicationDetailId: params.applicationDetailId,
            isPass: params.isPass,
            note: params.note,
            score: params.score,
          },
        },
      });
      return {
        success: true,
        data: response.data as ApplicationDetail,
      };
    } catch (error) {
      // Handle empty JSON body (BE returns 200 with no body)
      if (
        error instanceof SyntaxError ||
        (error instanceof Error && error.message.includes("JSON"))
      ) {
        return {
          success: true,
          data: undefined as unknown as ApplicationDetail,
        };
      }
      console.error("[ApplicationDetailManager] hrScore error:", error);
      return {
        success: false,
        error: this.extractErrorMessage(error),
      };
    }
  }

  /**
   * Get all application details (all rounds) for a specific application
   * GET /api/application-details/application/{applicationId}
   */
  async getByApplicationId(applicationId: number): Promise<ApiResponse<ApplicationDetail[]>> {
    try {
      const response = await fetchClient.GET(
        "/api/application-details/application/{applicationId}",
        {
          params: { path: { applicationId } },
        }
      );
      return {
        success: true,
        data: (response.data ?? []) as ApplicationDetail[],
      };
    } catch (error) {
      console.error("[ApplicationDetailManager] getByApplicationId error:", error);
      return {
        success: false,
        error: this.extractErrorMessage(error),
      };
    }
  }

  /**
   * Get a single application detail by ID
   * GET /api/application-details/{id}
   */
  async getById(id: number): Promise<ApiResponse<ApplicationDetail | null>> {
    try {
      const response = await fetchClient.GET("/api/application-details/{id}", {
        params: { path: { id } },
      });
      return {
        success: true,
        data: response.data as ApplicationDetail,
      };
    } catch (error) {
      console.error("[ApplicationDetailManager] getById error:", error);
      return {
        success: false,
        error: this.extractErrorMessage(error),
      };
    }
  }

  /**
   * Submit Code Review evaluation
   * POST /api/application-details/code-review/evaluate
   */
  async submitCodeReview(params: CodeReviewEvaluateParams): Promise<ApiResponse<SubmissionResult>> {
    try {
      const response = await fetchClient.POST("/api/application-details/code-review/evaluate", {
        body: {
          applicationId: params.applicationId,
          roundId: params.roundId,
          submissions: params.submissions.map((s) => ({
            filename: s.filename,
            lineNumber: s.lineNumber,
            severity: s.severity,
            description: s.description,
          })),
        } as never,
      });
      return {
        success: true,
        data: response.data as SubmissionResult,
      };
    } catch (error) {
      console.error("[ApplicationDetailManager] submitCodeReview error:", error);
      return {
        success: false,
        error: this.extractErrorMessage(error),
      };
    }
  }

  /**
   * Get all application details assigned to current reviewer (Staff)
   * GET /api/application-details/reviewer
   */
  async getForReviewer(): Promise<ApiResponse<ApplicationDetail[]>> {
    try {
      const response = await fetchClient.GET("/api/application-details/reviewer", {});
      return {
        success: true,
        data: (response.data ?? []) as ApplicationDetail[],
      };
    } catch (error) {
      console.error("[ApplicationDetailManager] getForReviewer error:", error);
      return {
        success: false,
        error: this.extractErrorMessage(error),
      };
    }
  }
}

export const applicationDetailManager = new ApplicationDetailManager();
