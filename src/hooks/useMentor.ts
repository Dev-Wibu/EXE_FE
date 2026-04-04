/**
 * Custom hooks for Mentor operations
 * Uses React Query for server state
 */

import { useQuery } from "@tanstack/react-query";

import type { Mentor } from "@/interfaces";
import { mentorManager } from "@/services/mentor.manager";

// Query Keys
export const MENTOR_QUERY_KEYS = {
  all: ["mentors"] as const,
  byId: (id: number) => ["mentors", id] as const,
};

/**
 * Hook to fetch all mentors
 */
export const useMentors = () => {
  return useQuery({
    queryKey: MENTOR_QUERY_KEYS.all,
    queryFn: async (): Promise<Mentor[]> => {
      const response = await mentorManager.getAll();
      if (response.success && response.data) {
        if (Array.isArray(response.data)) {
          return response.data;
        }
        if ("data" in response.data && Array.isArray(response.data.data)) {
          return response.data.data;
        }
      }
      return [];
    },
  });
};

/**
 * Hook to fetch mentor by ID
 */
export const useMentorById = (id: number) => {
  return useQuery({
    queryKey: MENTOR_QUERY_KEYS.byId(id),
    queryFn: async () => {
      const response = await mentorManager.getById(id);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.error || "Không tìm thấy mentor");
    },
    enabled: !!id,
  });
};
