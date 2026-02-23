/**
 * Candidate Profile Manager
 * Handles candidate profile CRUD operations
 * Based on schema-from-be.d.ts API specification
 */

import type { ApiResponse, BaseManager, PaginatedResponse, PaginationParams } from "@/interfaces";

import {
  API_ENDPOINTS,
  MANAGER_MODE,
  buildEndpoint,
  createApiInstance,
} from "@/constants/api.config";
import type { CandidateProfile } from "@/interfaces";

// Mock data for development
const mockCandidateProfiles: CandidateProfile[] = [
  {
    id: 1,
    user: { id: 1, name: "John Doe", email: "john@example.com" },
    targetRole: "Software Engineer",
    targetLevel: "Senior",
    introduction: "Experienced software engineer with a passion for building scalable systems.",
    technicalSkills: ["Java", "TypeScript", "React", "Spring Boot"],
    softSkills: ["Communication", "Leadership", "Problem Solving"],
    tools: ["Git", "Docker", "Kubernetes", "AWS"],
    projects: [
      {
        name: "E-commerce Platform",
        description: "Built a scalable e-commerce platform",
        role: "Lead Developer",
        teamSize: 5,
        usedTools: ["React", "Node.js", "PostgreSQL"],
        outcome: "Served 10k+ daily users",
      },
    ],
    workExperiences: [
      {
        company: "Tech Corp",
        position: "Software Engineer",
        description: "Developed microservices architecture",
        start_date: "2022-01-01",
        end_date: "2025-12-31",
      },
    ],
    educations: [
      {
        school: "FPT University",
        major: "Software Engineering",
        degree: "Bachelor",
        gpa: "3.5",
        start_date: "2018-09-01",
        end_date: "2022-06-01",
      },
    ],
    certifications: ["AWS Solutions Architect", "Kubernetes CKA"],
    achievements: ["Dean's List 2021", "Hackathon Winner 2022"],
    createdAt: "2026-01-10T10:00:00Z",
    updatedAt: "2026-01-15T14:30:00Z",
  },
  {
    id: 2,
    user: { id: 2, name: "Jane Smith", email: "jane@example.com" },
    targetRole: "Product Manager",
    targetLevel: "Mid",
    introduction: "Product manager with strong analytical and leadership skills.",
    technicalSkills: ["SQL", "Python", "Data Analysis"],
    softSkills: ["Stakeholder Management", "Strategic Thinking"],
    tools: ["Jira", "Confluence", "Figma"],
    projects: [
      {
        name: "Mobile App Launch",
        description: "Led the launch of a mobile banking app",
        role: "Product Manager",
        teamSize: 8,
        usedTools: ["Jira", "Figma", "Amplitude"],
        outcome: "100k+ downloads in first month",
      },
    ],
    workExperiences: [
      {
        company: "Fintech Startup",
        position: "Associate PM",
        description: "Managed product roadmap and stakeholder alignment",
        start_date: "2023-06-01",
        end_date: "2025-12-31",
      },
    ],
    educations: [
      {
        school: "RMIT University",
        major: "Business Information Systems",
        degree: "Bachelor",
        gpa: "3.7",
        start_date: "2019-09-01",
        end_date: "2023-06-01",
      },
    ],
    certifications: ["Google Analytics Certified"],
    achievements: ["Best Product Launch 2024"],
    createdAt: "2026-01-12T08:00:00Z",
    updatedAt: "2026-01-16T09:00:00Z",
  },
];

export class CandidateProfileManager implements BaseManager<CandidateProfile> {
  private mode = MANAGER_MODE;
  private api = createApiInstance();

  /**
   * Get all candidate profiles
   * GET /api/candidate-profiles
   */
  async getAll(
    _params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<CandidateProfile> | CandidateProfile[]>> {
    if (this.mode === "mock") {
      return { success: true, data: [...mockCandidateProfiles] };
    }

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
    if (this.mode === "mock") {
      const profile = mockCandidateProfiles.find((p) => p.user?.id === userId);
      if (!profile) {
        return { success: false, error: "Candidate profile not found" };
      }
      return { success: true, data: profile };
    }

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
    if (this.mode === "mock") {
      const newId = Math.max(...mockCandidateProfiles.map((p) => p.id || 0)) + 1;
      const newProfile: CandidateProfile = {
        id: newId,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockCandidateProfiles.push(newProfile);
      return { success: true, data: newProfile };
    }

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
    if (this.mode === "mock") {
      const index = mockCandidateProfiles.findIndex((p) => p.id === Number(id));
      if (index === -1) {
        return { success: false, error: "Candidate profile not found" };
      }
      mockCandidateProfiles[index] = {
        ...mockCandidateProfiles[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      return { success: true, data: mockCandidateProfiles[index] };
    }

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
    if (this.mode === "mock") {
      const index = mockCandidateProfiles.findIndex((p) => p.id === Number(id));
      if (index === -1) {
        return { success: false, error: "Candidate profile not found" };
      }
      mockCandidateProfiles.splice(index, 1);
      return { success: true };
    }

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
