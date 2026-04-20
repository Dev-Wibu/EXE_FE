/**
 * Custom hooks for Notification operations
 * Uses React Query for server state and NotificationStore for client state
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getNormalizedErrorMessage } from "@/lib/error-normalizer";
import type { Notification, NotificationFormData } from "@/services/notification.manager";
import { notificationManager } from "@/services/notification.manager";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";

const toTimestamp = (value: string | undefined): number => {
  if (!value) {
    return 0;
  }

  const parsedTime = new Date(value).getTime();
  return Number.isFinite(parsedTime) ? parsedTime : 0;
};

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
        const sortedNotifications = [...response.data].sort(
          (left, right) => toTimestamp(right.createAt) - toTimestamp(left.createAt)
        );

        setNotifications(sortedNotifications);
        return sortedNotifications;
      }
      return [];
    },
    enabled: !!user?.id,
    refetchInterval: 15000,
    staleTime: 5000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
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
    refetchInterval: 15000,
    staleTime: 5000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
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
 * Hook to mark many notifications as read in parallel
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: async (notificationIds: number[]) => {
      const settledResults = await Promise.allSettled(
        notificationIds.map(async (notificationId) => {
          const response = await notificationManager.markAsRead(notificationId);
          if (!response.success) {
            throw new Error(response.error || "Không thể đánh dấu đã đọc");
          }

          return notificationId;
        })
      );

      return {
        settledResults,
        totalCount: notificationIds.length,
      };
    },
    onMutate: () => {
      markAllAsRead();
    },
    onSuccess: ({ settledResults, totalCount }) => {
      const failedCount = settledResults.filter((result) => result.status === "rejected").length;

      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.byUser(user.id) });
        queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.unreadCount(user.id) });
      }

      if (failedCount > 0) {
        toast.warning(`Đã đánh dấu ${totalCount - failedCount}/${totalCount} thông báo.`);
      }
    },
    onError: (error: Error) => {
      toast.error(getNormalizedErrorMessage(error, "Không thể đánh dấu tất cả thông báo đã đọc"));

      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.byUser(user.id) });
        queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.unreadCount(user.id) });
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
      toast.error(getNormalizedErrorMessage(error, "Không thể tạo thông báo"));
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
