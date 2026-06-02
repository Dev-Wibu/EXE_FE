import type {
  ApiResponse,
  CreateJobDescriptionRequest,
  JobDescription,
  JobDescriptionLevel,
  JobDescriptionStatus,
  UpdateJobDescriptionRequest,
} from "@/interfaces";

import { API_ENDPOINTS, buildEndpoint } from "@/constants/api.config";
import { fetchClient } from "@/lib/api";

export interface JobDescriptionSearchParams {
  keyword?: string;
  status?: JobDescriptionStatus;
  level?: JobDescriptionLevel;
  salaryMin?: number;
  salaryMax?: number;
}

export class JobDescriptionManager {
  async getAll(): Promise<ApiResponse<JobDescription[]>> {
    try {
      const response = await fetchClient.GET("/api/job-descriptions", {}).then((res) => ({
        data: res.data,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Khong the tai danh sach mo ta cong viec",
      };
    }
  }

  async getById(id: number | string): Promise<ApiResponse<JobDescription>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.JOB_DESCRIPTIONS.DETAIL, { id });
      // @ts-expect-error: Backend Swagger schema mismatch
      const response = await fetchClient.GET(endpoint, {}).then((res) => ({
        data: res.data,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      // @ts-expect-error: Backend Swagger schema mismatch
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Khong the tai mo ta cong viec",
      };
    }
  }

  async search(params?: JobDescriptionSearchParams): Promise<ApiResponse<JobDescription[]>> {
    try {
      const response = await fetchClient
        .GET("/api/job-descriptions/search", {
          // @ts-expect-error: Backend Swagger schema mismatch
          params,
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
        error: error instanceof Error ? error.message : "Khong the tim kiem mo ta cong viec",
      };
    }
  }

  async getByCompanyId(companyId: number | string): Promise<ApiResponse<JobDescription[]>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.JOB_DESCRIPTIONS.BY_COMPANY, { companyId });
      // @ts-expect-error: Backend Swagger schema mismatch
      const response = await fetchClient.GET(endpoint, {}).then((res) => ({
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
          error instanceof Error ? error.message : "Khong the tai mo ta cong viec theo cong ty",
      };
    }
  }

  async create(data: CreateJobDescriptionRequest): Promise<ApiResponse<JobDescription>> {
    try {
      const response = await fetchClient
        .POST("/api/job-descriptions", { body: data as unknown as never })
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Khong the tao mo ta cong viec",
      };
    }
  }

  async update(data: UpdateJobDescriptionRequest): Promise<ApiResponse<JobDescription>> {
    try {
      const response = await fetchClient
        .PUT("/api/job-descriptions", { body: data })
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Khong the cap nhat mo ta cong viec",
      };
    }
  }

  async softDelete(id: number | string): Promise<ApiResponse<Record<string, string>>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.JOB_DESCRIPTIONS.SOFT_DELETE, { id });
      // @ts-expect-error: Backend Swagger schema mismatch
      const response = await fetchClient.DELETE(endpoint, {}).then((res) => ({
        data: res.data,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      // @ts-expect-error: Backend Swagger schema mismatch
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Khong the xoa mo ta cong viec",
      };
    }
  }
}

export const jobDescriptionManager = new JobDescriptionManager();
