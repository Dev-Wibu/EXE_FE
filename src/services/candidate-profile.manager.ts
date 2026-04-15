/**
 * Candidate Profile Manager
 * Handles candidate profile CRUD operations
 * Based on schema-from-be.d.ts API specification
 */

import type { ApiResponse, BaseManager, PaginatedResponse, PaginationParams } from "@/interfaces";

import { API_ENDPOINTS, buildEndpoint, createApiInstance } from "@/constants/api.config";
import type { CandidateProfile } from "@/interfaces";

export class CandidateProfileManager implements BaseManager<CandidateProfile> {
  private api = createApiInstance();

  /**
   * Get all candidate profiles
   * GET /api/candidate-profiles
   */
  async getAll(
    _params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<CandidateProfile> | CandidateProfile[]>> {
    try {
      const response = await this.api.get(API_ENDPOINTS.CANDIDATE_PROFILES.LIST, {
        params: _params,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch candidate profiles",
      };
    }
  }

  /**
   * Get candidate profile by user ID
   * GET /api/candidate-profiles/{userId}
   */
  async getByUserId(userId: number): Promise<ApiResponse<CandidateProfile>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.CANDIDATE_PROFILES.DETAIL, { userId });
      const response = await this.api.get(endpoint);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch candidate profile",
      };
    }
  }

  /**
   * Create candidate profile
   * POST /api/candidate-profiles
   */
  async create(data: Partial<CandidateProfile>): Promise<ApiResponse<CandidateProfile>> {
    try {
      const response = await this.api.post(API_ENDPOINTS.CANDIDATE_PROFILES.CREATE, data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create candidate profile",
      };
    }
  }

  /**
   * Update candidate profile
   * PUT /api/candidate-profiles
   */
  async update(
    id: string | number,
    data: Partial<CandidateProfile>
  ): Promise<ApiResponse<CandidateProfile>> {
    try {
      const updateData = { id: Number(id), ...data };
      const response = await this.api.post(API_ENDPOINTS.CANDIDATE_PROFILES.UPDATE, updateData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update candidate profile",
      };
    }
  }

  /**
   * Get candidate profile by ID
   * Uses getByUserId internally
   */
  async getById(id: string | number): Promise<ApiResponse<CandidateProfile>> {
    return this.getByUserId(Number(id));
  }

  /**
   * Delete candidate profile (not supported by current API)
   */
  async delete(id: string | number): Promise<ApiResponse<void>> {
    void id;

    return {
      success: false,
      error: "Delete operation not supported for candidate profiles",
    };
  }
}

// Export singleton instance
export const candidateProfileManager = new CandidateProfileManager();

// React Query hooks using $api
import { $api } from "@/lib/api";

export const useCandidateProfiles = () => $api.useQuery("get", "/api/candidate-profiles");
export const useCandidateProfile = (userId: number) =>
  $api.useQuery("get", "/api/candidate-profiles/{userId}", { params: { path: { userId } } });
export const useCreateCandidateProfile = () => $api.useMutation("post", "/api/candidate-profiles");
export const useUpdateCandidateProfile = () => $api.useMutation("put", "/api/candidate-profiles");
