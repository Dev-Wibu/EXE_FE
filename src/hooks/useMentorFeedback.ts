/**
 * Custom hooks for Mentor Feedback operations
 * Uses React Query for server state
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  CreateMentorFeedbackRequest,
  MentorFeedback,
  UpdateMentorFeedbackRequest,
} from "@/services/mentor-feedback.manager";
import { mentorFeedbackManager } from "@/services/mentor-feedback.manager";

// Query Keys
export const FEEDBACK_QUERY_KEYS = {
  all: ["mentor-feedbacks"] as const,
  byId: (id: number) => ["mentor-feedbacks", id] as const,
  byMentor: (mentorId: number) => ["mentor-feedbacks", "mentor", mentorId] as const,
  byUser: (userId: number) => ["mentor-feedbacks", "user", userId] as const,
  bySession: (sessionId: number) => ["mentor-feedbacks", "session", sessionId] as const,
};

/**
 * Hook to fetch all mentor feedbacks
 */
export const useMentorFeedbacks = () => {
  return useQuery({
    queryKey: FEEDBACK_QUERY_KEYS.all,
    queryFn: async (): Promise<MentorFeedback[]> => {
      const response = await mentorFeedbackManager.getAll();
      if (response.success && response.data) {
        // Handle both array and paginated response
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
 * Hook to fetch mentor feedback by ID
 */
export const useMentorFeedbackById = (id: number) => {
  return useQuery({
    queryKey: FEEDBACK_QUERY_KEYS.byId(id),
    queryFn: async () => {
      const response = await mentorFeedbackManager.getById(id);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || "Không tìm thấy phản hồi");
    },
    enabled: !!id,
  });
};

/**
 * Hook to fetch feedbacks by mentor ID
 */
export const useMentorFeedbacksByMentor = (mentorId: number) => {
  return useQuery({
    queryKey: FEEDBACK_QUERY_KEYS.byMentor(mentorId),
    queryFn: async () => {
      const response = await mentorFeedbackManager.getByMentorId(mentorId);
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    },
    enabled: !!mentorId,
  });
};

/**
 * Hook to fetch feedbacks by user ID
 */
export const useMentorFeedbacksByUser = (userId: number) => {
  const { data: allFeedbacks = [], ...rest } = useMentorFeedbacks();

  // Filter feedbacks by user ID
  const userFeedbacks = allFeedbacks.filter(
    (feedback: MentorFeedback) => feedback.user?.id === userId
  );

  return {
    data: userFeedbacks,
    ...rest,
  };
};

/**
 * Hook to fetch feedback by session ID
 */
export const useMentorFeedbackBySession = (sessionId: number) => {
  const { data: allFeedbacks = [], ...rest } = useMentorFeedbacks();

  // Find feedback for this session
  const sessionFeedback = allFeedbacks.find(
    (feedback: MentorFeedback) => feedback.session?.id === sessionId
  );

  return {
    data: sessionFeedback,
    ...rest,
  };
};

/**
 * Hook to create a mentor feedback
 */
export const useCreateMentorFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMentorFeedbackRequest) => {
      const response = await mentorFeedbackManager.create(data);
      if (!response.success) {
        throw new Error(response.error || "Không thể tạo phản hồi");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEEDBACK_QUERY_KEYS.all });
      toast.success("Đã gửi phản hồi thành công");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

/**
 * Hook to update a mentor feedback
 */
export const useUpdateMentorFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateMentorFeedbackRequest }) => {
      const response = await mentorFeedbackManager.update(id, data);
      if (!response.success) {
        throw new Error(response.error || "Không thể cập nhật phản hồi");
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: FEEDBACK_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: FEEDBACK_QUERY_KEYS.byId(variables.id),
      });
      toast.success("Đã cập nhật phản hồi thành công");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

/**
 * Hook to delete a mentor feedback (Admin only)
 */
export const useDeleteMentorFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await mentorFeedbackManager.delete(id);
      if (!response.success) {
        throw new Error(response.error || "Không thể xóa phản hồi");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FEEDBACK_QUERY_KEYS.all });
      toast.success("Đã xóa phản hồi");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

/**
 * Calculate average rating from feedbacks
 */
export const calculateAverageFeedbackRating = (feedbacks: MentorFeedback[]): number => {
  if (!feedbacks.length) return 0;
  const total = feedbacks.reduce((sum, feedback) => sum + (feedback.rating || 0), 0);
  return total / feedbacks.length;
};

// Re-export types for convenience
export type { CreateMentorFeedbackRequest, MentorFeedback, UpdateMentorFeedbackRequest };
