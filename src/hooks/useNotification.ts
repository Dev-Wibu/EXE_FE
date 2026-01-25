/**
 * Custom hooks for Notification operations
 * Uses React Query for server state and NotificationStore for client state
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { Notification, NotificationFormData } from "@/services/notification.manager";
import { notificationManager } from "@/services/notification.manager";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";

// Query Keys
export const NOTIFICATION_QUERY_KEYS = {
  all: ["notifications"] as const,
  byUser: (userId: number) => ["notifications", "user", userId] as const,
  unreadCount: (userId: number) => ["notifications", "unread", userId] as const,
};

/**
 * Hook to fetch notifications for current user
 */
export const useNotifications = () => {
  const user = useAuthStore((state) => state.user);
  const setNotifications = useNotificationStore((state) => state.setNotifications);

  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.byUser(user?.id || 0),
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await notificationManager.getByUserId(user.id);
      if (response.success && response.data) {
        setNotifications(response.data);
        return response.data;
      }
      return [];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
};

/**
 * Hook to get unread notification count
 */
export const useUnreadCount = () => {
  const user = useAuthStore((state) => state.user);
  const setUnreadCount = useNotificationStore((state) => state.setUnreadCount);

  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.unreadCount(user?.id || 0),
    queryFn: async () => {
      if (!user?.id) return 0;
      const response = await notificationManager.getByUserId(user.id);
      if (response.success && response.data) {
        const count = response.data.filter((n) => !n.isRead).length;
        setUnreadCount(count);
        return count;
      }
      return 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 10000,
  });
};

/**
 * Hook to mark notification as read
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await notificationManager.markAsRead(notificationId);
      if (!response.success) {
        throw new Error(response.error || "Không thể đánh dấu đã đọc");
      }
      return response.data;
    },
    onSuccess: (_, notificationId) => {
      // Update local state immediately
      markAsRead(notificationId);
      // Invalidate queries to refetch
      if (user?.id) {
        queryClient.invalidateQueries({
          queryKey: NOTIFICATION_QUERY_KEYS.byUser(user.id),
        });
        queryClient.invalidateQueries({
          queryKey: NOTIFICATION_QUERY_KEYS.unreadCount(user.id),
        });
      }
    },
  });
};

/**
 * Hook to create notification (Admin only)
 */
export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: NotificationFormData) => {
      const response = await notificationManager.create({
        user: { id: data.userId },
        title: data.title,
        message: data.message,
      });
      if (!response.success) {
        throw new Error(response.error || "Không thể tạo thông báo");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
      toast.success("Đã gửi thông báo thành công");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

/**
 * Hook to get notification by ID
 */
export const useNotificationById = (id: number) => {
  return useQuery({
    queryKey: [...NOTIFICATION_QUERY_KEYS.all, id],
    queryFn: async () => {
      const response = await notificationManager.getById(id);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || "Không tìm thấy thông báo");
    },
    enabled: !!id,
  });
};

// Re-export types for convenience
export type { Notification, NotificationFormData };
