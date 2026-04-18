import type { ApiResponse } from "@/interfaces";

import { API_ENDPOINTS, createApiInstance } from "@/constants/api.config";

export type FaceBehaviorStatus =
  | "TURNING_LEFT"
  | "TURNING_RIGHT"
  | "BOWING_HEAD"
  | "LOOKING_UP_HEAD"
  | "TOO_CLOSE"
  | "TOO_FAR"
  | "GLANCING_LEFT"
  | "GLANCING_RIGHT"
  | "LOOKING_UP_EYES"
  | "LOOKING_DOWN_EYES"
  | "NORMAL"
  | "UNKNOWN";

export type FaceBehaviorSource = "analysis" | "proctoring" | "mock";

export type FaceBehaviorAnalyzeMode = "analysis" | "proctoring" | "auto" | "mock";

export interface FaceBehaviorAnalysisResult {
  status: FaceBehaviorStatus;
  warning: boolean;
  source: FaceBehaviorSource;
  analyzedAt: number;
}

export interface AnalyzeFaceBehaviorPayload {
  mode: FaceBehaviorAnalyzeMode;
  imageBlob: Blob;
  sessionKey?: string;
  globalQuestionOrder?: number;
}

const PROCTORING_UNKNOWN_RESULT: FaceBehaviorAnalysisResult = {
  status: "UNKNOWN",
  warning: false,
  source: "proctoring",
  analyzedAt: Date.now(),
};

const FACE_BEHAVIOR_STATUSES: FaceBehaviorStatus[] = [
  "TURNING_LEFT",
  "TURNING_RIGHT",
  "BOWING_HEAD",
  "LOOKING_UP_HEAD",
  "TOO_CLOSE",
  "TOO_FAR",
  "GLANCING_LEFT",
  "GLANCING_RIGHT",
  "LOOKING_UP_EYES",
  "LOOKING_DOWN_EYES",
  "NORMAL",
  "UNKNOWN",
];

const MOCK_WARNING_STATUSES: FaceBehaviorStatus[] = [
  "TURNING_LEFT",
  "TURNING_RIGHT",
  "BOWING_HEAD",
  "LOOKING_UP_HEAD",
  "TOO_CLOSE",
  "TOO_FAR",
  "GLANCING_LEFT",
  "GLANCING_RIGHT",
  "LOOKING_UP_EYES",
  "LOOKING_DOWN_EYES",
];

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return fallback;
};

const toFaceBehaviorStatus = (value?: string): FaceBehaviorStatus => {
  if (!value) {
    return "UNKNOWN";
  }

  const normalized = value.trim().toUpperCase();
  if (FACE_BEHAVIOR_STATUSES.includes(normalized as FaceBehaviorStatus)) {
    return normalized as FaceBehaviorStatus;
  }

  return "UNKNOWN";
};

const normalizeFaceAnalysisResponse = (
  payload: { status?: string; warning?: boolean },
  source: FaceBehaviorSource
): FaceBehaviorAnalysisResult => {
  const status = toFaceBehaviorStatus(payload.status);
  const warning =
    typeof payload.warning === "boolean"
      ? payload.warning
      : status !== "NORMAL" && status !== "UNKNOWN";

  return {
    status,
    warning,
    source,
    analyzedAt: Date.now(),
  };
};

const blobToBase64 = async (blob: Blob): Promise<string> => {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Không thể chuyển đổi ảnh sang base64"));
      }
    };
    reader.onerror = () => reject(new Error("Không thể đọc ảnh để phân tích"));
    reader.readAsDataURL(blob);
  });

  const segments = dataUrl.split(",");
  const base64 = segments.length > 1 ? segments[1] : segments[0];
  if (!base64) {
    throw new Error("Dữ liệu ảnh không hợp lệ");
  }

  return base64;
};

class InterviewFaceAnalysisManager {
  private readonly api = createApiInstance();

  private async analyzeByMultipart(
    imageBlob: Blob
  ): Promise<ApiResponse<FaceBehaviorAnalysisResult>> {
    try {
      const formData = new FormData();
      formData.append("image", imageBlob, `face-frame-${Date.now()}.jpg`);

      const response = await this.api.post<{ status?: string; warning?: boolean }>(
        API_ENDPOINTS.AI_INTERVIEW.FACE_ANALYSIS,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return {
        success: true,
        data: normalizeFaceAnalysisResponse(response.data ?? {}, "analysis"),
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Không thể phân tích hành vi khuôn mặt"),
      };
    }
  }

  private async trackByProctoring(
    payload: AnalyzeFaceBehaviorPayload
  ): Promise<ApiResponse<FaceBehaviorAnalysisResult>> {
    if (!payload.sessionKey) {
      return {
        success: false,
        error: "Thiếu session key để gửi dữ liệu proctoring",
      };
    }

    try {
      const imageBase64 = await blobToBase64(payload.imageBlob);
      const body: {
        sessionKey: string;
        imageBase64: string;
        globalQuestionOrder?: number;
      } = {
        sessionKey: payload.sessionKey,
        imageBase64,
      };

      if (typeof payload.globalQuestionOrder === "number" && payload.globalQuestionOrder >= 0) {
        body.globalQuestionOrder = Math.floor(payload.globalQuestionOrder);
      }

      await this.api.post(API_ENDPOINTS.INTERVIEW_V1.PROCTORING_TRACK, body);

      return {
        success: true,
        data: {
          ...PROCTORING_UNKNOWN_RESULT,
          analyzedAt: Date.now(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: getErrorMessage(error, "Không thể ghi nhận hành vi khuôn mặt"),
      };
    }
  }

  private buildMockResult(): FaceBehaviorAnalysisResult {
    const warningProbability = 0.28;
    const hasWarning = Math.random() < warningProbability;

    if (!hasWarning) {
      return {
        status: "NORMAL",
        warning: false,
        source: "mock",
        analyzedAt: Date.now(),
      };
    }

    const randomIndex = Math.floor(Math.random() * MOCK_WARNING_STATUSES.length);
    return {
      status: MOCK_WARNING_STATUSES[randomIndex],
      warning: true,
      source: "mock",
      analyzedAt: Date.now(),
    };
  }

  async analyze(
    payload: AnalyzeFaceBehaviorPayload
  ): Promise<ApiResponse<FaceBehaviorAnalysisResult>> {
    if (payload.mode === "mock") {
      return {
        success: true,
        data: this.buildMockResult(),
      };
    }

    if (payload.mode === "analysis") {
      return this.analyzeByMultipart(payload.imageBlob);
    }

    if (payload.mode === "proctoring") {
      return this.trackByProctoring(payload);
    }

    const primaryResult = await this.analyzeByMultipart(payload.imageBlob);
    if (primaryResult.success) {
      return primaryResult;
    }

    const fallbackResult = await this.trackByProctoring(payload);
    if (fallbackResult.success) {
      return fallbackResult;
    }

    return {
      success: false,
      error:
        fallbackResult.error ??
        primaryResult.error ??
        "Không thể phân tích hành vi khuôn mặt từ ảnh hiện tại",
    };
  }
}

export const interviewFaceAnalysisManager = new InterviewFaceAnalysisManager();
