import type { ApiResponse, Application } from "@/interfaces";

import { API_ENDPOINTS, buildEndpoint, createApiInstance } from "@/constants/api.config";

export class ApplicationManager {
  private api = createApiInstance();

  async getAll(): Promise<ApiResponse<Application[]>> {
    try {
      const response = await this.api.get<Application[]>(API_ENDPOINTS.APPLICATIONS.LIST);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Khong the tai danh sach ung tuyen",
      };
    }
  }

  async getById(id: number | string): Promise<ApiResponse<Application>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.APPLICATIONS.DETAIL, { id });
      const response = await this.api.get<Application>(endpoint);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Khong the tai ho so ung tuyen",
      };
    }
  }

  async getMine(): Promise<ApiResponse<Application[]>> {
    try {
      const response = await this.api.get<Application[]>(API_ENDPOINTS.APPLICATIONS.MY);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Khong the tai ho so ung tuyen cua ban",
      };
    }
  }

  async apply(jdId: number): Promise<ApiResponse<Application>> {
    try {
      const response = await this.api.post<Application>(API_ENDPOINTS.APPLICATIONS.APPLY, null, {
        params: { jdId },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Khong the ung tuyen vao cong viec",
      };
    }
  }
}

export const applicationManager = new ApplicationManager();
