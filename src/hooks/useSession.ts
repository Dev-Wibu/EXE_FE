/**
 * Custom hooks for Session operations
 * Uses React Query for server state
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { Session } from "@/interfaces";
import type { SessionCreationRequest } from "@/services/session.manager";
import { sessionManager } from "@/services/session.manager";
import { useAuthStore } from "@/stores/authStore";

// Query Keys
export const SESSION_QUERY_KEYS = {
  all: ["sessions"] as const,
  byId: (id: number) => ["sessions", id] as const,
  byUser: (userId: number) => ["sessions", "user", userId] as const,
};

/**
 * Hook to fetch all sessions
 */
export const useSessions = () => {
  return useQuery({
    queryKey: SESSION_QUERY_KEYS.all,
    queryFn: async (): Promise<Session[]> => {
      const response = await sessionManager.getAll();
      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          return response.data;
        }
        // If paginated response, extract items array
        if ("items" in response.data && Array.isArray(response.data.items)) {
          return response.data.items;
        }
      }
      return [];
    },
  });
};

/**
 * Hook to fetch session by ID
 */
export const useSessionById = (id: number) => {
  return useQuery({
    queryKey: SESSION_QUERY_KEYS.byId(id),
    queryFn: async () => {
      const response = await sessionManager.getById(id);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || "Không tìm thấy phiên phỏng vấn");
    },
    enabled: !!id,
  });
};

/**
 * Hook to fetch sessions for current user
 */
export const useUserSessions = () => {
  const user = useAuthStore((state) => state.user);

  return useQuery({
    queryKey: SESSION_QUERY_KEYS.byUser(user?.id || 0),
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await sessionManager.getByUserId(user.id);
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    },
    enabled: !!user?.id,
  });
};

/**
 * Hook to fetch sessions by user ID
 */
export const useSessionsByUserId = (userId: number) => {
  return useQuery({
    queryKey: SESSION_QUERY_KEYS.byUser(userId),
    queryFn: async () => {
      if (!userId) return [];
      const response = await sessionManager.getByUserId(userId);
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    },
    enabled: !!userId,
  });
};

/**
 * Hook to fetch completed sessions for current user (for review/feedback)
 */
export const useCompletedUserSessions = () => {
  const { data: sessions = [], ...rest } = useUserSessions();

  // Filter completed sessions
  const completedSessions = sessions.filter((session) => session.status === "COMPLETED");

  return {
    data: completedSessions,
    ...rest,
  };
};

/**
 * Hook to create a session
 */
export const useCreateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SessionCreationRequest) => {
      const response = await sessionManager.create(data);
      if (!response.success) {
        throw new Error(response.error || "Không thể tạo phiên phỏng vấn");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEYS.all });
      toast.success("Đã tạo phiên phỏng vấn thành công");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

/**
 * Hook to update a session
 */
export const useUpdateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Session> }) => {
      const response = await sessionManager.update(id, data);
      if (!response.success) {
        throw new Error(response.error || "Không thể cập nhật phiên phỏng vấn");
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: SESSION_QUERY_KEYS.byId(variables.id),
      });
      toast.success("Đã cập nhật phiên phỏng vấn");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

/**
 * Hook to cancel a session
 */
export const useCancelSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await sessionManager.delete(id);
      if (!response.success) {
        throw new Error(response.error || "Không thể hủy phiên phỏng vấn");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEYS.all });
      toast.success("Đã hủy phiên phỏng vấn");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Re-export types
export type { Session, SessionCreationRequest };
