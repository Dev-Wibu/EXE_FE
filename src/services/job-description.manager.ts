import type {
  ApiResponse,
  CreateJobDescriptionRequest,
  JobDescription,
  JobDescriptionLevel,
  JobDescriptionStatus,
  UpdateJobDescriptionRequest,
} from "@/interfaces";

import { API_ENDPOINTS, buildEndpoint, createApiInstance } from "@/constants/api.config";

export interface JobDescriptionSearchParams {
  keyword?: string;
  status?: JobDescriptionStatus;
  level?: JobDescriptionLevel;
  salaryMin?: number;
  salaryMax?: number;
}

export class JobDescriptionManager {
  private api = createApiInstance();

  async getAll(): Promise<ApiResponse<JobDescription[]>> {
    try {
      const response = await this.api.get<JobDescription[]>(API_ENDPOINTS.JOB_DESCRIPTIONS.LIST);
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
      const response = await this.api.get<JobDescription>(endpoint);
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
      const response = await this.api.get<JobDescription[]>(API_ENDPOINTS.JOB_DESCRIPTIONS.SEARCH, {
        params,
      });
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
      const response = await this.api.get<JobDescription[]>(endpoint);
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
      const response = await this.api.post<JobDescription>(
        API_ENDPOINTS.JOB_DESCRIPTIONS.CREATE,
        data
      );
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
      const response = await this.api.put<JobDescription>(
        API_ENDPOINTS.JOB_DESCRIPTIONS.UPDATE,
        data
      );
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
      const response = await this.api.delete<Record<string, string>>(endpoint);
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
