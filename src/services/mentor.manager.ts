/**
 * Mentor Manager
 * Handles mentor CRUD operations
 * Based on schema-from-be.d.ts API specification
 */

import type {
  ApiResponse,
  BaseManager,
  Mentor,
  PaginatedResponse,
  PaginationParams,
} from "@/interfaces";

import { API_ENDPOINTS, MANAGER_MODE, apiConfig, buildEndpoint } from "@/constants/api.config";
import * as mentorMock from "@/mocks/mentors.mock";
import axios from "axios";

// Re-export Mentor type for convenience
export type { Mentor } from "@/interfaces";

/**
 * MentorInfo type for create operations (matches backend schema)
 */
export interface MentorInfo {
  id?: number;
  name?: string;
  email?: string;
  password?: string;
  bio?: string;
  expertise?: string;
  yearsOfExperience?: number;
  linkedInUrl?: string;
  currentCompany?: string;
}

/**
 * Extended mentor data for creation with file uploads
 */
export interface CreateMentorData extends MentorInfo {
  avatar?: File;
  identityFile?: File;
  degreeFile?: File;
  otherFile?: File;
}

// Local mutable array for mock CRUD operations
let mockMentorsData: Mentor[] | null = null;

export class MentorManager implements BaseManager<Mentor> {
  private mode = MANAGER_MODE;
  private api = axios.create(apiConfig);

  /**
   * Transform mock mentor data to backend schema format
   */
  private transformMockMentor(mockMentor: mentorMock.Mentor): Mentor {
    return {
      id: mockMentor.id,
      name: mockMentor.name,
      email: `${mockMentor.name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      role: "MENTOR",
      bio: `${mockMentor.position} at ${mockMentor.company}`,
      expertise: mockMentor.skills.join(", "),
      currentCompany: mockMentor.company,
      totalSession: mockMentor.totalSessions,
      active: true,
      avatarUrl: mockMentor.avatar || undefined,
    };
  }

  /**
   * Get mock mentors data, initializing if needed
   */
  private async getMockMentors(): Promise<Mentor[]> {
    if (!mockMentorsData) {
      const mockMentors = await mentorMock.fetchMentors();
      mockMentorsData = mockMentors.map((m) => this.transformMockMentor(m));
    }
    return mockMentorsData;
  }

  /**
   * Get all mentors
   * GET /api/mentors
   */
  async getAll(
    _params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<Mentor> | Mentor[]>> {
    if (this.mode === "mock") {
      const mentors = await this.getMockMentors();
      return {
        success: true,
        data: [...mentors],
      };
    }

    try {
      const response = await this.api.get(API_ENDPOINTS.MENTOR.LIST, { params: _params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch mentors",
      };
    }
  }

  /**
   * Get mentor by ID
   * GET /api/mentors/{id}
   */
  async getById(id: string | number): Promise<ApiResponse<Mentor>> {
    if (this.mode === "mock") {
      const mentors = await this.getMockMentors();
      const mentor = mentors.find((m) => m.id === Number(id));
      if (!mentor) {
        return {
          success: false,
          error: "Mentor not found",
        };
      }
      return {
        success: true,
        data: { ...mentor },
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.MENTOR.DETAIL, { id });
      const response = await this.api.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch mentor",
      };
    }
  }

  /**
   * Create new mentor
   * POST /api/mentors (multipart/form-data)
   * According to schema: { data: MentorInfo, avatar?: File, identityFile?: File, degreeFile?: File, otherFile?: File }
   */
  async create(_data: Partial<Mentor> | CreateMentorData): Promise<ApiResponse<Mentor>> {
    if (this.mode === "mock") {
      // Ensure mock data is initialized
      await this.getMockMentors();
      // Use robust ID generation
      const newId = Date.now() + Math.floor(Math.random() * 1000);
      const newMentor: Mentor = {
        id: newId,
        name: _data.name,
        email: _data.email,
        role: "MENTOR",
        bio: _data.bio,
        expertise: _data.expertise,
        yearsOfExperience: _data.yearsOfExperience,
        linkedInUrl: _data.linkedInUrl,
        currentCompany: _data.currentCompany,
        rate: (_data as Mentor).rate,
        totalSession: 0,
        active: (_data as Mentor).active !== false,
      };
      mockMentorsData?.push(newMentor);
      return {
        success: true,
        data: newMentor,
      };
    }

    try {
      // According to schema, createMentor uses multipart/form-data
      const formData = new FormData();
      
      // Prepare MentorInfo data (JSON string)
      // Note: Password should be handled securely by the backend (e.g., hashing)
      // The frontend sends the password in plain text over HTTPS
      const mentorInfo: MentorInfo = {
        name: _data.name,
        email: _data.email,
        password: _data.password,
        bio: _data.bio,
        expertise: _data.expertise,
        yearsOfExperience: _data.yearsOfExperience,
        linkedInUrl: _data.linkedInUrl,
        currentCompany: _data.currentCompany,
      };
      
      formData.append("data", JSON.stringify(mentorInfo));
      
      // Add optional file fields
      const createData = _data as CreateMentorData;
      if (createData.avatar) {
        formData.append("avatar", createData.avatar);
      }
      if (createData.identityFile) {
        formData.append("identityFile", createData.identityFile);
      }
      if (createData.degreeFile) {
        formData.append("degreeFile", createData.degreeFile);
      }
      if (createData.otherFile) {
        formData.append("otherFile", createData.otherFile);
      }
      
      const response = await this.api.post(API_ENDPOINTS.MENTOR.CREATE, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create mentor",
      };
    }
  }

  /**
   * Update mentor
   * PUT /api/mentors (JSON body with Mentor object)
   */
  async update(_id: string | number, _data: Partial<Mentor>): Promise<ApiResponse<Mentor>> {
    if (this.mode === "mock") {
      const mentors = await this.getMockMentors();
      const index = mentors.findIndex((m) => m.id === Number(_id));
      if (index === -1) {
        return {
          success: false,
          error: "Mentor not found",
        };
      }
      mockMentorsData![index] = { ...mockMentorsData![index], ..._data };
      return {
        success: true,
        data: mockMentorsData![index],
      };
    }

    try {
      // According to schema, updateMentor is PUT /api/mentors with JSON body
      const mentorData: Mentor = { ..._data, id: Number(_id) };
      const response = await this.api.put(API_ENDPOINTS.MENTOR.UPDATE, mentorData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update mentor",
      };
    }
  }

  /**
   * Delete mentor
   * Note: Backend schema does not define DELETE for /api/mentors
   * This is a soft delete by setting active to false
   */
  async delete(_id: string | number): Promise<ApiResponse<void>> {
    if (this.mode === "mock") {
      const mentors = await this.getMockMentors();
      const index = mentors.findIndex((m) => m.id === Number(_id));
      if (index === -1) {
        return {
          success: false,
          error: "Mentor not found",
        };
      }
      mockMentorsData?.splice(index, 1);
      return {
        success: true,
      };
    }

    try {
      // Backend doesn't have DELETE endpoint, use soft delete via update
      const mentorData: Mentor = { id: Number(_id), active: false };
      await this.api.put(API_ENDPOINTS.MENTOR.UPDATE, mentorData);
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete mentor",
      };
    }
  }
}

// Export singleton instance
export const mentorManager = new MentorManager();
