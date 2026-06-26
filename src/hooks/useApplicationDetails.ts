import { getNormalizedErrorMessage } from "@/lib/error-normalizer";
import { applicationDetailManager } from "@/services/application-detail.manager";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { components } from "../../schema-from-be";

export type ApplicationDetail = components["schemas"]["ApplicationDetail"];

export interface HrScoreParams {
  applicationDetailId: number;
  isPass: boolean;
  note: string;
  score: number;
}

// ============================================================
// Query Hooks
// ============================================================

/**
 * Get all application details (all rounds) for a specific application
 * GET /api/application-details/application/{applicationId}
 */
export const useApplicationDetails = (applicationId: number, enabled = true) => {
  return useQuery({
    queryKey: ["applicationDetails", "byApplicationId", applicationId],
    queryFn: async (): Promise<ApplicationDetail[]> => {
      const result = await applicationDetailManager.getByApplicationId(applicationId);
      if (!result.success) throw new Error(result.error);
      return result.data ?? [];
    },
    enabled: enabled && applicationId > 0,
    staleTime: 30_000,
  });
};

/**
 * Get a single application detail by ID
 * GET /api/application-details/{id}
 */
export const useApplicationDetail = (id: number, enabled = true) => {
  return useQuery({
    queryKey: ["applicationDetails", "byId", id],
    queryFn: async (): Promise<ApplicationDetail | null> => {
      const result = await applicationDetailManager.getById(id);
      if (!result.success) throw new Error(result.error);
      return result.data ?? null;
    },
    enabled: enabled && id > 0,
    staleTime: 30_000,
  });
};

/**
 * Get all application details assigned to current reviewer (Staff)
 * GET /api/application-details/reviewer
 */
export const useApplicationDetailsForReviewer = (enabled = true) => {
  return useQuery({
    queryKey: ["applicationDetails", "forReviewer"],
    queryFn: async (): Promise<ApplicationDetail[]> => {
      const result = await applicationDetailManager.getForReviewer();
      if (!result.success) throw new Error(result.error);
      return result.data ?? [];
    },
    enabled,
    staleTime: 30_000,
  });
};

// ============================================================
// Mutation Hooks
// ============================================================

/**
 * HR/Admin scores a candidate's application round
 * PUT /api/application-details/hr-score
 */
export const useHrScore = (options?: {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: HrScoreParams) => {
      const result = await applicationDetailManager.hrScore(params);
      if (!result.success) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: (_data, variables) => {
      toast.success("Đã chấm điểm thành công!");
      queryClient.invalidateQueries({ queryKey: ["applicationDetails"] });
      queryClient.invalidateQueries({
        queryKey: ["applicationDetails", "byApplicationId", variables.applicationDetailId],
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      const message = getNormalizedErrorMessage(error);
      toast.error(message);
      options?.onError?.(message);
    },
  });
};
