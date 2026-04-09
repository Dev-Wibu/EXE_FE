/**
 * Membership Plan Manager
 * Handles membership plan CRUD operations for admin management
 * Based on schema-from-be.d.ts API specification
 */

import type { ApiResponse, BaseManager, PaginatedResponse, PaginationParams } from "@/interfaces";

import {
  API_ENDPOINTS,
  MANAGER_MODE,
  buildEndpoint,
  createApiInstance,
} from "@/constants/api.config";

/**
 * MemberShipPlan type based on backend schema
 * Schema includes: id, name, price, max_ai_interview, max_practice_sets, max_quiz_sets, durationDays
 */
export interface MemberShipPlan {
  id?: number;
  name?: "NEW" | "FREE" | "BASIC" | "PREMIUM" | "TEST";
  price?: number;
  max_ai_interview?: number;
  max_practice_sets?: number;
  max_quiz_sets?: number;
  durationDays?: number;
}

/**
 * Form data for create/update operations
 */
export interface MemberShipPlanFormData {
  name: "NEW" | "FREE" | "BASIC" | "PREMIUM" | "TEST";
  price: number;
  max_ai_interview: number;
  max_practice_sets: number;
  max_quiz_sets: number;
  durationDays: number;
}

// Mock data for development
const mockPlans: MemberShipPlan[] = [
  {
    id: 1,
    name: "FREE",
    price: 0,
    max_ai_interview: 1,
    max_practice_sets: 2,
    max_quiz_sets: 2,
    durationDays: 30,
  },
  {
    id: 2,
    name: "NEW",
    price: 4000,
    max_ai_interview: 5,
    max_practice_sets: 10,
    max_quiz_sets: 10,
    durationDays: 30,
  },
  {
    id: 3,
    name: "BASIC",
    price: 99000,
    max_ai_interview: 15,
    max_practice_sets: 30,
    max_quiz_sets: 30,
    durationDays: 30,
  },
  {
    id: 4,
    name: "PREMIUM",
    price: 199000,
    max_ai_interview: -1,
    max_practice_sets: -1,
    max_quiz_sets: -1,
    durationDays: 30,
  },
];

export class MemberShipPlanManager implements BaseManager<MemberShipPlan> {
  private mode = MANAGER_MODE;
  private api = createApiInstance();

  /**
   * Get all membership plans
   * GET /api/membership-plans
   */
  async getAll(
    _params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<MemberShipPlan> | MemberShipPlan[]>> {
    if (this.mode === "mock") {
      return { success: true, data: [...mockPlans] };
    }

    try {
      const response = await this.api.get(API_ENDPOINTS.MEMBERSHIP_PLANS.LIST, {
        params: _params,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tải danh sách gói thành viên",
      };
    }
  }

  /**
   * Get membership plan by ID
   * GET /api/membership-plans/{id}
   */
  async getById(id: string | number): Promise<ApiResponse<MemberShipPlan>> {
    if (this.mode === "mock") {
      const plan = mockPlans.find((p) => p.id === Number(id));
      if (!plan) return { success: false, error: "Không tìm thấy gói thành viên" };
      return { success: true, data: plan };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.MEMBERSHIP_PLANS.DETAIL, { id });
      const response = await this.api.get(endpoint);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tải gói thành viên",
      };
    }
  }

  /**
   * Create new membership plan
   * POST /api/membership-plans (JSON body)
   */
  async create(data: Partial<MemberShipPlan>): Promise<ApiResponse<MemberShipPlan>> {
    if (this.mode === "mock") {
      const newId = Math.max(...mockPlans.map((p) => p.id || 0)) + 1;
      const newPlan: MemberShipPlan = { id: newId, ...data };
      mockPlans.push(newPlan);
      return { success: true, data: newPlan };
    }

    try {
      // Backend requires id: 0 for creation (primitive int, not nullable)
      const payload = { ...data, id: 0 };
      const response = await this.api.post(API_ENDPOINTS.MEMBERSHIP_PLANS.CREATE, payload);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể tạo gói thành viên",
      };
    }
  }

  /**
   * Update membership plan
   * PUT /api/membership-plans (JSON body)
   */
  async update(
    id: string | number,
    data: Partial<MemberShipPlan>
  ): Promise<ApiResponse<MemberShipPlan>> {
    if (this.mode === "mock") {
      const index = mockPlans.findIndex((p) => p.id === Number(id));
      if (index === -1) return { success: false, error: "Không tìm thấy gói thành viên" };
      mockPlans[index] = { ...mockPlans[index], ...data };
      return { success: true, data: mockPlans[index] };
    }

    try {
      const payload = { ...data, id: Number(id) };
      const response = await this.api.put(API_ENDPOINTS.MEMBERSHIP_PLANS.UPDATE, payload);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể cập nhật gói thành viên",
      };
    }
  }

  /**
   * Delete membership plan
   * DELETE /api/membership-plans/{id}
   */
  async delete(id: string | number): Promise<ApiResponse<void>> {
    if (this.mode === "mock") {
      const index = mockPlans.findIndex((p) => p.id === Number(id));
      if (index === -1) return { success: false, error: "Không tìm thấy gói thành viên" };
      mockPlans.splice(index, 1);
      return { success: true };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.MEMBERSHIP_PLANS.DELETE, { id });
      await this.api.delete(endpoint);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Không thể xóa gói thành viên",
      };
    }
  }
}

// Export singleton instance
export const memberShipPlanManager = new MemberShipPlanManager();
