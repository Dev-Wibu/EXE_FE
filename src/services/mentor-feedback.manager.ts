/**
 * Mentor Feedback Manager
 * Handles mentor feedback CRUD operations
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
 * MentorFeedback type based on backend schema
 */
export interface MentorFeedback {
  id?: number;
  session?: Session;
  mentor?: Mentor;
  user?: User;
  rating?: number;
  comment?: string;
}

/**
 * Create mentor feedback request based on backend schema
 */
export interface CreateMentorFeedbackRequest {
  sessionId?: number;
  mentorId?: number;
  userId?: number;
  rating?: number;
  comment?: string;
}

/**
 * Update mentor feedback request based on backend schema
 */
export interface UpdateMentorFeedbackRequest {
  id?: number;
  rating?: number;
  comment?: string;
}

// Mock data for development
const mockMentorFeedbacks: MentorFeedback[] = [
  {
    id: 1,
    session: { id: 1, roomName: "interview-1" },
    mentor: { id: 1, name: "Mentor A", email: "mentorA@example.com" },
    user: { id: 1, name: "John Doe", email: "john@example.com" },
    rating: 5,
    comment: "Excellent mentor! Very helpful and patient.",
  },
  {
    id: 2,
    session: { id: 2, roomName: "interview-2" },
    mentor: { id: 1, name: "Mentor A", email: "mentorA@example.com" },
    user: { id: 2, name: "Jane Smith", email: "jane@example.com" },
    rating: 4,
    comment: "Great session, learned a lot about system design.",
  },
  {
    id: 3,
    session: { id: 3, roomName: "interview-3" },
    mentor: { id: 2, name: "Mentor B", email: "mentorB@example.com" },
    user: { id: 1, name: "John Doe", email: "john@example.com" },
    rating: 5,
    comment: "Very professional and knowledgeable.",
  },
];

export class MentorFeedbackManager implements BaseManager<MentorFeedback> {
  private mode = MANAGER_MODE;
  private api = createApiInstance();

  /**
   * Get all mentor feedbacks
   * GET /api/mentor-feedbacks
   */
  async getAll(
    _params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<MentorFeedback> | MentorFeedback[]>> {
    if (this.mode === "mock") {
      return {
        success: true,
        data: [...mockMentorFeedbacks],
      };
    }

    try {
      const response = await this.api.get(API_ENDPOINTS.MENTOR_FEEDBACKS.LIST, { params: _params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch mentor feedbacks",
      };
    }
  }

  /**
   * Get mentor feedback by session ID
   * GET /api/mentor-feedbacks/{id}
   */
  async getById(id: string | number): Promise<ApiResponse<MentorFeedback>> {
    if (this.mode === "mock") {
      const feedback = mockMentorFeedbacks.find((f) => f.id === Number(id));
      if (!feedback) {
        return {
          success: false,
          error: "Mentor feedback not found",
        };
      }
      return {
        success: true,
        data: feedback,
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.MENTOR_FEEDBACKS.DETAIL, { id });
      const response = await this.api.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch mentor feedback",
      };
    }
  }

  /**
   * Get all feedbacks for a specific mentor
   * GET /api/mentor-feedbacks/mentor/{mentorId}
   */
  async getByMentorId(mentorId: string | number): Promise<ApiResponse<MentorFeedback[]>> {
    if (this.mode === "mock") {
      const feedbacks = mockMentorFeedbacks.filter((f) => f.mentor?.id === Number(mentorId));
      return {
        success: true,
        data: feedbacks,
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.MENTOR_FEEDBACKS.BY_MENTOR, { mentorId });
      const response = await this.api.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch feedbacks for mentor",
      };
    }
  }

  /**
   * Create new mentor feedback
   * POST /api/mentor-feedbacks (JSON body with CreateMentorFeedbackRequest)
   */
  async create(
    data: Partial<MentorFeedback> | CreateMentorFeedbackRequest
  ): Promise<ApiResponse<MentorFeedback>> {
    if (this.mode === "mock") {
      const newId = Math.max(...mockMentorFeedbacks.map((f) => f.id || 0)) + 1;
      const newFeedback: MentorFeedback = {
        id: newId,
        ...(data as Partial<MentorFeedback>),
      };
      mockMentorFeedbacks.push(newFeedback);
      return {
        success: true,
        data: newFeedback,
      };
    }

    try {
      const response = await this.api.post(API_ENDPOINTS.MENTOR_FEEDBACKS.CREATE, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create mentor feedback",
      };
    }
  }

  /**
   * Update mentor feedback
   * PUT /api/mentor-feedbacks (JSON body with UpdateMentorFeedbackRequest)
   */
  async update(
    id: string | number,
    data: Partial<MentorFeedback> | UpdateMentorFeedbackRequest
  ): Promise<ApiResponse<MentorFeedback>> {
    if (this.mode === "mock") {
      const index = mockMentorFeedbacks.findIndex((f) => f.id === Number(id));
      if (index === -1) {
        return {
          success: false,
          error: "Mentor feedback not found",
        };
      }
      mockMentorFeedbacks[index] = { ...mockMentorFeedbacks[index], ...data };
      return {
        success: true,
        data: mockMentorFeedbacks[index],
      };
    }

    try {
      const updateData: UpdateMentorFeedbackRequest = {
        id: Number(id),
        ...(data as UpdateMentorFeedbackRequest),
      };
      const response = await this.api.put(API_ENDPOINTS.MENTOR_FEEDBACKS.UPDATE, updateData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update mentor feedback",
      };
    }
  }

  /**
   * Delete mentor feedback (not supported by current API)
   */
  async delete(id: string | number): Promise<ApiResponse<void>> {
    if (this.mode === "mock") {
      const index = mockMentorFeedbacks.findIndex((f) => f.id === Number(id));
      if (index === -1) {
        return {
          success: false,
          error: "Mentor feedback not found",
        };
      }
      mockMentorFeedbacks.splice(index, 1);
      return {
        success: true,
      };
    }

    return {
      success: false,
      error: "Delete operation not supported for mentor feedbacks",
    };
  }
}

// Export singleton instance
export const mentorFeedbackManager = new MentorFeedbackManager();
