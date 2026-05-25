import type { ApiResponse, FaceAnalysisResponse } from "@/interfaces";

import { API_ENDPOINTS, createApiInstance } from "@/constants/api.config";

export class InterviewAnalysisManager {
  private api = createApiInstance();

  async analyzeFaceBehavior(image: File): Promise<ApiResponse<FaceAnalysisResponse>> {
    try {
      const formData = new FormData();
      formData.append("image", image);

      const response = await this.api.post<FaceAnalysisResponse>(
        API_ENDPOINTS.INTERVIEW_ANALYSIS.FACE_BEHAVIOR,
        formData,
        {
          headers: { "Content-Type": undefined },
        }
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Khong the phan tich hanh vi khuon mat",
      };
    }
  }
}

export const interviewAnalysisManager = new InterviewAnalysisManager();
