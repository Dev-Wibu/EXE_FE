/**
 * Mentor Review Manager
 * Handles mentor review CRUD operations
 * Based on schema-from-be.d.ts API specification
 */

import type { ApiResponse, BaseManager, PaginatedResponse, PaginationParams } from "@/interfaces";

import { API_ENDPOINTS, buildEndpoint, createApiInstance } from "@/constants/api.config";
import type { Mentor, Session, User } from "@/interfaces";

/**
 * MentorReview type based on backend schema
 */
export interface MentorReview {
  id?: number;
  session?: Session;
  mentor?: Mentor;
  user?: User;
  rating?: number;
  situationNote?: string;
  taskNote?: string;
  actionNote?: string;
  resultNote?: string;
  strength?: string;
  weakness?: string;
  improve?: string;
}

/**
 * Create mentor review request based on backend schema
 */
export interface CreateMentorReviewRequest {
  sessionId?: number;
  mentorId?: number;
  userId?: number;
  rating?: number;
  situationNote?: string;
  taskNote?: string;
  actionNote?: string;
  resultNote?: string;
  strength?: string;
  weakness?: string;
  improve?: string;
}

/**
 * Update mentor review request based on backend schema
 */
export interface UpdateMentorReviewRequest {
  id?: number;
  rating?: number;
  situationNote?: string;
  taskNote?: string;
  actionNote?: string;
  resultNote?: string;
  strength?: string;
  weakness?: string;
  improve?: string;
}

export class MentorReviewManager implements BaseManager<MentorReview> {
  private api = createApiInstance();

  /**
   * Get all mentor reviews
   * GET /api/mentor-reviews
   */
  async getAll(
    _params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<MentorReview> | MentorReview[]>> {
    try {
      const response = await this.api.get(API_ENDPOINTS.MENTOR_REVIEWS.LIST, { params: _params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch mentor reviews",
      };
    }
  }

  /**
   * Get mentor review by ID
   * GET /api/mentor-reviews/{id}
   */
  async getById(id: string | number): Promise<ApiResponse<MentorReview>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.MENTOR_REVIEWS.DETAIL, { id });
      const response = await this.api.get(endpoint);

      if (!response.data || typeof response.data !== "object") {
        return {
          success: false,
          error: "Không tìm thấy đánh giá",
        };
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const responseData = (error as { response?: { data?: { message?: string; error?: string } } })
        ?.response?.data;
      const apiMessage = responseData?.message || responseData?.error;
      const errorMessage =
        typeof apiMessage === "string" && apiMessage.trim().length > 0
          ? apiMessage
          : error instanceof Error
            ? error.message
            : "Failed to fetch mentor review";

      return {
        success: false,
        error: /not found|no value present/i.test(errorMessage)
          ? "Không tìm thấy đánh giá"
          : errorMessage,
      };
    }
  }

  /**
   * Create new mentor review
   * POST /api/mentor-reviews (JSON body with CreateMentorReviewRequest)
   */
  async create(
    data: Partial<MentorReview> | CreateMentorReviewRequest
  ): Promise<ApiResponse<MentorReview>> {
    try {
      const response = await this.api.post(API_ENDPOINTS.MENTOR_REVIEWS.CREATE, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create mentor review",
      };
    }
  }

  /**
   * Update mentor review
   * PUT /api/mentor-reviews (JSON body with UpdateMentorReviewRequest)
   */
  async update(
    id: string | number,
    data: Partial<MentorReview> | UpdateMentorReviewRequest
  ): Promise<ApiResponse<MentorReview>> {
    try {
      const updateData: UpdateMentorReviewRequest = {
        id: Number(id),
        ...(data as UpdateMentorReviewRequest),
      };
      const response = await this.api.put(API_ENDPOINTS.MENTOR_REVIEWS.UPDATE, updateData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update mentor review",
      };
    }
  }

  /**
   * Delete mentor review (not supported by current API)
   */
  async delete(id: string | number): Promise<ApiResponse<void>> {
    void id;

    return {
      success: false,
      error: "Delete operation not supported for mentor reviews",
    };
  }
}

// Export singleton instance
export const mentorReviewManager = new MentorReviewManager();
