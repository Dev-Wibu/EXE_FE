/**
 * Custom hooks for Mentor Review operations
 * Uses React Query for server state
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  CreateMentorReviewRequest,
  MentorReview,
  UpdateMentorReviewRequest,
} from "@/services/mentor-review.manager";
import { mentorReviewManager } from "@/services/mentor-review.manager";

// Query Keys
export const REVIEW_QUERY_KEYS = {
  all: ["mentor-reviews"] as const,
  byId: (id: number) => ["mentor-reviews", id] as const,
  byMentor: (mentorId: number) => ["mentor-reviews", "mentor", mentorId] as const,
  byUser: (userId: number) => ["mentor-reviews", "user", userId] as const,
  bySession: (sessionId: number) => ["mentor-reviews", "session", sessionId] as const,
};

/**
 * Hook to fetch all mentor reviews
 */
export const useMentorReviews = () => {
  return useQuery({
    queryKey: REVIEW_QUERY_KEYS.all,
    queryFn: async (): Promise<MentorReview[]> => {
      const response = await mentorReviewManager.getAll();
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
 * Hook to fetch mentor review by ID
 */
export const useMentorReviewById = (id: number) => {
  return useQuery({
    queryKey: REVIEW_QUERY_KEYS.byId(id),
    queryFn: async () => {
      const response = await mentorReviewManager.getById(id);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || "Không tìm thấy đánh giá");
    },
    enabled: !!id,
  });
};

/**
 * Hook to fetch reviews by mentor ID
 */
export const useMentorReviewsByMentor = (mentorId: number) => {
  const { data: allReviews = [], ...rest } = useMentorReviews();

  // Filter reviews by mentor ID
  const mentorReviews = allReviews.filter((review: MentorReview) => review.mentor?.id === mentorId);

  return {
    data: mentorReviews,
    ...rest,
  };
};

/**
 * Hook to fetch reviews by user ID
 */
export const useMentorReviewsByUser = (userId: number) => {
  const { data: allReviews = [], ...rest } = useMentorReviews();

  // Filter reviews by user ID
  const userReviews = allReviews.filter((review: MentorReview) => review.user?.id === userId);

  return {
    data: userReviews,
    ...rest,
  };
};

/**
 * Hook to fetch review by session ID
 */
export const useMentorReviewBySession = (sessionId: number) => {
  const { data: allReviews = [], ...rest } = useMentorReviews();

  // Find review for this session
  const sessionReview = allReviews.find((review: MentorReview) => review.session?.id === sessionId);

  return {
    data: sessionReview,
    ...rest,
  };
};

/**
 * Hook to create a mentor review
 */
export const useCreateMentorReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMentorReviewRequest) => {
      const response = await mentorReviewManager.create(data);
      if (!response.success) {
        throw new Error(response.error || "Không thể tạo đánh giá");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REVIEW_QUERY_KEYS.all });
      toast.success("Đã gửi đánh giá thành công");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

/**
 * Hook to update a mentor review
 */
export const useUpdateMentorReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateMentorReviewRequest }) => {
      const response = await mentorReviewManager.update(id, data);
      if (!response.success) {
        throw new Error(response.error || "Không thể cập nhật đánh giá");
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: REVIEW_QUERY_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: REVIEW_QUERY_KEYS.byId(variables.id),
      });
      toast.success("Đã cập nhật đánh giá thành công");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

/**
 * Hook to delete a mentor review (Admin only)
 */
export const useDeleteMentorReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await mentorReviewManager.delete(id);
      if (!response.success) {
        throw new Error(response.error || "Không thể xóa đánh giá");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REVIEW_QUERY_KEYS.all });
      toast.success("Đã xóa đánh giá");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

/**
 * Calculate average rating from reviews
 */
export const calculateAverageRating = (reviews: MentorReview[]): number => {
  if (!reviews.length) return 0;
  const total = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
  return total / reviews.length;
};

// Re-export types for convenience
export type { CreateMentorReviewRequest, MentorReview, UpdateMentorReviewRequest };
