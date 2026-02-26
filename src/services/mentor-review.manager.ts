/**
 * Mentor Review Manager
 * Handles mentor review CRUD operations
 * Based on schema-from-be.d.ts API specification
 */

import type { ApiResponse, BaseManager, PaginatedResponse, PaginationParams } from "@/interfaces";

import {
  API_ENDPOINTS,
  MANAGER_MODE,
  buildEndpoint,
  createApiInstance,
} from "@/constants/api.config";
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

// Mock data for development
const mockMentorReviews: MentorReview[] = [
  {
    id: 1,
    session: { id: 1, roomName: "interview-1" },
    mentor: { id: 1, name: "Mentor A", email: "mentorA@example.com" },
    user: { id: 1, name: "John Doe", email: "john@example.com" },
    rating: 4,
    situationNote: "Candidate faced a challenging problem",
    taskNote: "Required to design a system",
    actionNote: "Used good problem-solving approach",
    resultNote: "Successfully completed the task",
    strength: "Good communication skills",
    weakness: "Need to improve time management",
    improve: "Practice more system design questions",
  },
  {
    id: 2,
    session: { id: 2, roomName: "interview-2" },
    mentor: { id: 2, name: "Mentor B", email: "mentorB@example.com" },
    user: { id: 2, name: "Jane Smith", email: "jane@example.com" },
    rating: 5,
    situationNote: "Excellent behavioral interview",
    taskNote: "Describe leadership experience",
    actionNote: "Provided specific examples",
    resultNote: "Demonstrated strong leadership",
    strength: "Leadership and teamwork",
    weakness: "Could elaborate more on technical aspects",
    improve: "Combine technical with behavioral examples",
  },
];

export class MentorReviewManager implements BaseManager<MentorReview> {
  private mode = MANAGER_MODE;
  private api = createApiInstance();

  /**
   * Get all mentor reviews
   * GET /api/mentor-reviews
   */
  async getAll(
    _params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<MentorReview> | MentorReview[]>> {
    if (this.mode === "mock") {
      return {
        success: true,
        data: [...mockMentorReviews],
      };
    }

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
    if (this.mode === "mock") {
      const review = mockMentorReviews.find((r) => r.id === Number(id));
      if (!review) {
        return {
          success: false,
          error: "Mentor review not found",
        };
      }
      return {
        success: true,
        data: review,
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.MENTOR_REVIEWS.DETAIL, { id });
      const response = await this.api.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch mentor review",
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
    if (this.mode === "mock") {
      const newId = Math.max(...mockMentorReviews.map((r) => r.id || 0)) + 1;
      const newReview: MentorReview = {
        id: newId,
        ...(data as Partial<MentorReview>),
      };
      mockMentorReviews.push(newReview);
      return {
        success: true,
        data: newReview,
      };
    }

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
    if (this.mode === "mock") {
      const index = mockMentorReviews.findIndex((r) => r.id === Number(id));
      if (index === -1) {
        return {
          success: false,
          error: "Mentor review not found",
        };
      }
      mockMentorReviews[index] = { ...mockMentorReviews[index], ...data };
      return {
        success: true,
        data: mockMentorReviews[index],
      };
    }

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
    if (this.mode === "mock") {
      const index = mockMentorReviews.findIndex((r) => r.id === Number(id));
      if (index === -1) {
        return {
          success: false,
          error: "Mentor review not found",
        };
      }
      mockMentorReviews.splice(index, 1);
      return {
        success: true,
      };
    }

    return {
      success: false,
      error: "Delete operation not supported for mentor reviews",
    };
  }
}

// Export singleton instance
export const mentorReviewManager = new MentorReviewManager();
