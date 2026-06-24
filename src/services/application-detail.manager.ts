import type { ApiResponse } from "@/interfaces";
import { fetchClient } from "@/lib/api";
import i18n from "@/lib/i18n";
import type { components } from "../../schema-from-be";

const t = i18n.t.bind(i18n);

export type SubmissionResult = components["schemas"]["SubmissionResult"];

export interface SubmitApplicationDetailParams {
  applicationId: number;
  textContent?: string;
  file?: File;
  quizAnswers?: string[];
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
   * Submit application detail (CV screening, quiz answers, etc.)
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

      const response = await fetchClient
        .POST("/api/application-details/submit", {
          headers: {
            // Let browser set Content-Type with proper multipart boundary
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
}

export const applicationDetailManager = new ApplicationDetailManager();
