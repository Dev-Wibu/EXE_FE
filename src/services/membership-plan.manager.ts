/**
 * Membership Plan Manager
 * Handles membership plan CRUD operations for admin management
 * Based on schema-from-be.d.ts API specification
 */

import type { ApiResponse, BaseManager, PaginatedResponse, PaginationParams } from "@/interfaces";

import { API_ENDPOINTS, buildEndpoint, createApiInstance } from "@/constants/api.config";

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

export class MemberShipPlanManager implements BaseManager<MemberShipPlan> {
  private api = createApiInstance();

  /**
   * Get all membership plans
   * GET /api/membership-plans
   */
  async getAll(
    _params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<MemberShipPlan> | MemberShipPlan[]>> {
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
