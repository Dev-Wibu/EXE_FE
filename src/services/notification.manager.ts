/**
 * Notification Manager
 * Handles notification CRUD operations
 * Based on schema-from-be.d.ts API specification
 */

import type { ApiResponse, BaseManager, PaginatedResponse, PaginationParams } from "@/interfaces";

import { API_ENDPOINTS, MANAGER_MODE, apiConfig, buildEndpoint } from "@/constants/api.config";
import type { User } from "@/interfaces";
import axios from "axios";

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

// Mock data for development
const mockNotifications: Notification[] = [
  {
    id: 1,
    user: { id: 1, name: "John Doe", email: "john@example.com" },
    title: "Welcome!",
    message: "Welcome to the interview platform",
    isRead: true,
    createAt: new Date().toISOString(),
  },
  {
    id: 2,
    user: { id: 1, name: "John Doe", email: "john@example.com" },
    title: "Session Scheduled",
    message: "Your mock interview has been scheduled",
    isRead: false,
    createAt: new Date().toISOString(),
  },
  {
    id: 3,
    user: { id: 2, name: "Jane Smith", email: "jane@example.com" },
    title: "New Mentor Feedback",
    message: "You have received feedback from your mentor",
    isRead: false,
    createAt: new Date().toISOString(),
  },
];

export class NotificationManager implements BaseManager<Notification> {
  private mode = MANAGER_MODE;
  private api = axios.create(apiConfig);

  /**
   * Get all notifications for a user
   * GET /api/notifications/{id}
   */
  async getAll(
    params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<Notification> | Notification[]>> {
    // Suppress unused variable warning - params not used in mock mode
    void params;

    if (this.mode === "mock") {
      return {
        success: true,
        data: [...mockNotifications],
      };
    }

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
    if (this.mode === "mock") {
      const userNotifications = mockNotifications.filter((n) => n.user?.id === Number(userId));
      return {
        success: true,
        data: userNotifications,
      };
    }

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
    if (this.mode === "mock") {
      const notification = mockNotifications.find((n) => n.id === Number(id));
      if (!notification) {
        return {
          success: false,
          error: "Notification not found",
        };
      }
      return {
        success: true,
        data: notification,
      };
    }

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
    if (this.mode === "mock") {
      const newId = Math.max(...mockNotifications.map((n) => n.id || 0)) + 1;
      const newNotification: Notification = {
        id: newId,
        user: data.user,
        title: data.title,
        message: data.message,
        isRead: false,
        createAt: new Date().toISOString(),
      };
      mockNotifications.push(newNotification);
      return {
        success: true,
        data: newNotification,
      };
    }

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
    if (this.mode === "mock") {
      const notification = mockNotifications.find((n) => n.id === Number(notificationId));
      if (notification) {
        notification.isRead = true;
      }
      return {
        success: true,
        data: true,
      };
    }

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
    if (this.mode === "mock") {
      const index = mockNotifications.findIndex((n) => n.id === Number(_id));
      if (index === -1) {
        return {
          success: false,
          error: "Notification not found",
        };
      }
      mockNotifications.splice(index, 1);
      return {
        success: true,
      };
    }

    return {
      success: false,
      error: "Delete operation not supported for notifications",
    };
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager();
