/**
 * Notification Manager
 * Handles notification CRUD operations
 * Based on schema-from-be.d.ts API specification
 */

import { API_ENDPOINTS, buildEndpoint, createApiInstance } from "@/constants/api.config";
import type {
  ApiResponse,
  BaseManager,
  PaginatedResponse,
  PaginationParams,
  User,
} from "@/interfaces";

/**
 * Notification type based on backend schema
 */
export interface Notification {
  id?: number;
  user?: User;
  title?: string;
  message?: string;
  isRead?: boolean;
  createAt?: string;
}

/**
 * Form data for create operations
 */
export interface NotificationFormData {
  userId: number;
  title: string;
  message: string;
}

export class NotificationManager implements BaseManager<Notification> {
  private api = createApiInstance();

  /**
   * Get all notifications for a user
   * GET /api/notifications/{id}
   */
  async getAll(
    params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<Notification> | Notification[]>> {
    // Suppress unused variable warning - params not used in mock mode
    void params;

    // Note: This endpoint requires userId in path
    return {
      success: false,
      error: "Use getByUserId method instead",
    };
  }

  /**
   * Get notifications by user ID
   * GET /api/notifications/{id}
   */
  async getByUserId(userId: string | number): Promise<ApiResponse<Notification[]>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.NOTIFICATIONS.LIST, { id: userId });
      const response = await this.api.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch notifications",
      };
    }
  }

  /**
   * Get notification by ID
   * Note: The schema doesn't have a specific single notification endpoint
   */
  async getById(id: string | number): Promise<ApiResponse<Notification>> {
    void id;

    return {
      success: false,
      error: "Single notification fetch not supported by API",
    };
  }

  /**
   * Create new notification
   * POST /api/notifications (JSON body)
   * Backend requires full Notification schema including id: 0 for creation
   */
  async create(data: Partial<Notification>): Promise<ApiResponse<Notification>> {
    try {
      // Backend requires full Notification schema for creation
      // id: 0 indicates new record creation
      const notificationPayload: Notification = {
        id: 0, // Required: 0 for creation
        user: data.user,
        title: data.title,
        message: data.message,
        isRead: data.isRead ?? false,
        createAt: data.createAt ?? new Date().toISOString(),
      };
      const response = await this.api.post(API_ENDPOINTS.NOTIFICATIONS.CREATE, notificationPayload);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create notification",
      };
    }
  }

  /**
   * Mark notification as read
   * GET /api/notifications/check-read/{notificationId}
   */
  async markAsRead(notificationId: string | number): Promise<ApiResponse<boolean>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.NOTIFICATIONS.CHECK_READ, { notificationId });
      const response = await this.api.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to mark notification as read",
      };
    }
  }

  /**
   * Update notification (not supported by current API)
   */
  async update(
    id: string | number,
    data: Partial<Notification>
  ): Promise<ApiResponse<Notification>> {
    // Suppress unused variable warnings - update not supported
    void id;
    void data;

    return {
      success: false,
      error: "Update operation not supported for notifications",
    };
  }

  /**
   * Delete notification (not supported by current API)
   */
  async delete(_id: string | number): Promise<ApiResponse<void>> {
    void _id;

    return {
      success: false,
      error: "Delete operation not supported for notifications",
    };
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager();
