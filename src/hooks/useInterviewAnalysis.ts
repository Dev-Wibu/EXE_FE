import { useMutation } from "@tanstack/react-query";

import { interviewAnalysisManager } from "@/services/interview-analysis.manager";

export const useAnalyzeFaceBehavior = () =>
  useMutation({
    mutationFn: async (image: File) => {
      const response = await interviewAnalysisManager.analyzeFaceBehavior(image);
      if (!response.success) {
        throw new Error(response.error || "Khong the phan tich hanh vi khuon mat");
      }
      return response.data;
    },
  });
