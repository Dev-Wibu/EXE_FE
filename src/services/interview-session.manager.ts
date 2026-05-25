import type {
  ApiResponse,
  InterviewConfigOptions,
  InterviewSession,
  InterviewSessionRedis,
  InterviewSetupRequest,
  JobRequirementData,
} from "@/interfaces";

import { API_ENDPOINTS, buildEndpoint, createApiInstance } from "@/constants/api.config";

export class InterviewSessionManager {
  private api = createApiInstance();

  async getConfigOptions(): Promise<ApiResponse<InterviewConfigOptions>> {
    try {
      const response = await this.api.get<InterviewConfigOptions>(
        API_ENDPOINTS.INTERVIEW_SESSIONS.CONFIG_OPTIONS
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Khong the tai cau hinh phong van",
      };
    }
  }

  async generateJobRequirement(jobDescription: string): Promise<ApiResponse<JobRequirementData>> {
    try {
      const response = await this.api.post<JobRequirementData>(
        API_ENDPOINTS.INTERVIEW_SESSIONS.GENERATE_JOB_REQUIREMENT,
        jobDescription
      );
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Khong the tao yeu cau cong viec",
      };
    }
  }

  async createSession(data: InterviewSetupRequest): Promise<ApiResponse<string>> {
    try {
      const response = await this.api.post<string>(API_ENDPOINTS.INTERVIEW_SESSIONS.CREATE, data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Khong the tao phien phong van",
      };
    }
  }

  async getById(sessionId: number | string): Promise<ApiResponse<InterviewSession>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.INTERVIEW_SESSIONS.DETAIL, { sessionId });
      const response = await this.api.get<InterviewSession>(endpoint);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Khong the tai phien phong van",
      };
    }
  }

  async getByUserId(userId: number | string): Promise<ApiResponse<InterviewSession[]>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.INTERVIEW_SESSIONS.USER_SESSIONS, { userId });
      const response = await this.api.get<InterviewSession[]>(endpoint);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Khong the tai danh sach phong van",
      };
    }
  }

  async getFromCache(sessionKey: string): Promise<ApiResponse<InterviewSessionRedis>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.INTERVIEW_SESSIONS.CACHE, { sessionKey });
      const response = await this.api.get<InterviewSessionRedis>(endpoint);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Khong the tai trang thai phong van",
      };
    }
  }
}

export const interviewSessionManager = new InterviewSessionManager();
