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
  SchemaMentorInfo,
  SchemaMentorResponse,
} from "@/interfaces";

import { API_ENDPOINTS, buildEndpoint, createApiInstance } from "@/constants/api.config";

// Re-export Mentor type for convenience
export type { Mentor } from "@/interfaces";

export type MentorInfo = SchemaMentorInfo;

/**
 * Extended mentor data for creation with file uploads
 * Files: avatar, identityFile, degreeFile, otherFile
 */
export interface CreateMentorData extends MentorInfo {
  avatar?: File;
  identityFile?: File;
  degreeFile?: File;
  otherFile?: File;
  active?: boolean;
}

/**
 * Creates an empty file placeholder for multipart/form-data requests
 * Used as workaround for backend null pointer issues with optional file fields
 */
function createEmptyFilePlaceholder(): File {
  return new File([], "empty.txt", { type: "text/plain" });
}

export class MentorManager implements BaseManager<Mentor> {
  private api = createApiInstance();

  /**
   * Get all mentors
   * GET /api/mentors
   */
  async getAll(
    _params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<Mentor> | Mentor[]>> {
    try {
      const response = await this.api.get<
        SchemaMentorResponse[] | PaginatedResponse<SchemaMentorResponse>
      >(API_ENDPOINTS.MENTOR.LIST, { params: _params });
      return {
        success: true,
        data: response.data as PaginatedResponse<Mentor> | Mentor[],
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
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.MENTOR.DETAIL, { id });
      const response = await this.api.get<SchemaMentorResponse>(endpoint);
      return {
        success: true,
        data: response.data as Mentor,
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
    try {
      // Validate required fields
      if (!_data.name || !_data.name.trim()) {
        return {
          success: false,
          error: "Name is required to create a mentor",
        };
      }
      if (!_data.email || !_data.email.trim()) {
        return {
          success: false,
          error: "Email is required to create a mentor",
        };
      }

      // According to schema, createMentor uses multipart/form-data
      const formData = new FormData();

      // Prepare MentorInfo data (JSON object)
      // Note: Password should be handled securely by the backend (e.g., hashing)
      // The frontend sends the password in plain text over HTTPS
      // IMPORTANT: Backend comment says POST /api/mentors is shared for create & update
      // When creating, don't include id. When updating, include id.
      // Adding 'active: true' to ensure new mentors are active by default
      const mentorInfo: MentorInfo = {
        name: _data.name.trim(),
        email: _data.email.trim(),
        password: _data.password,
        bio: _data.bio,
        expertise: _data.expertise,
        yearsOfExperience: _data.yearsOfExperience,
        linkedInUrl: _data.linkedInUrl,
        currentCompany: _data.currentCompany,
        pricePerMinute: _data.pricePerMinute,
      };

      // Add active field to the payload to ensure new mentors are active
      // Note: This extends MentorInfo with the active field from Mentor schema
      const mentorPayload = {
        ...mentorInfo,
        active: (_data as Partial<Mentor>).active !== false, // Default true unless explicitly false
      };

      // Append the 'data' field as a Blob with application/json content type
      // This ensures the backend receives proper JSON data within multipart/form-data
      formData.append(
        "data",
        new Blob([JSON.stringify(mentorPayload)], { type: "application/json" })
      );

      // Add file fields - always send placeholder files to avoid backend NullPointerException
      // Backend code calls file.isEmpty() without null check first, causing 500 error
      // By sending empty files as placeholders, we prevent null pointer exceptions
      const createData = _data as CreateMentorData;

      // Always send avatar to avoid "avatar is null" NullPointerException
      if (createData.avatar) {
        formData.append("avatar", createData.avatar);
      } else {
        formData.append("avatar", createEmptyFilePlaceholder());
      }

      // Send placeholder files for all optional file fields to avoid backend NullPointerException
      // Backend calls file.getOriginalFilename() without null check, causing 500 error
      if (createData.identityFile) {
        formData.append("identityFile", createData.identityFile);
      } else {
        formData.append("identityFile", createEmptyFilePlaceholder());
      }
      if (createData.degreeFile) {
        formData.append("degreeFile", createData.degreeFile);
      } else {
        formData.append("degreeFile", createEmptyFilePlaceholder());
      }
      if (createData.otherFile) {
        formData.append("otherFile", createData.otherFile);
      } else {
        formData.append("otherFile", createEmptyFilePlaceholder());
      }

      // Remove default Content-Type header to let axios set multipart boundary automatically
      const response = await this.api.post(API_ENDPOINTS.MENTOR.CREATE, formData, {
        headers: {
          "Content-Type": undefined,
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
   * POST /api/mentors (multipart/form-data with 'data' field containing JSON)
   * Note: Schema comment says POST is shared for create and update
   * "dùng chung cho create và update mentor, nếu create thì ko có id còn update thì có id gửi kèm trong json data á"
   * Translation: if create - no id, if update - include id in the json data
   */
  async update(
    _id: string | number,
    _data: Partial<Mentor> | CreateMentorData
  ): Promise<ApiResponse<Mentor>> {
    try {
      // Backend uses POST /api/mentors for both create and update (multipart/form-data)
      // For update, include 'id' in the JSON data field
      const formData = new FormData();

      // Build MentorInfo payload with id for update
      const mentorInfo: MentorInfo & { active?: boolean } = {
        id: Number(_id),
        name: _data.name?.trim(),
        email: _data.email?.trim(),
        bio: _data.bio,
        expertise: _data.expertise,
        yearsOfExperience: _data.yearsOfExperience,
        linkedInUrl: _data.linkedInUrl,
        currentCompany: _data.currentCompany,
        pricePerMinute: _data.pricePerMinute,
      };

      // Add password only if provided (for password updates)
      if (_data.password) {
        mentorInfo.password = _data.password;
      }

      // Add active field if provided
      // Note: 'active' is not in MentorInfo schema but BE curl example includes it
      // The BE accepts it for setting mentor active status during update
      if ("active" in _data) {
        mentorInfo.active = Boolean(_data.active);
      }

      console.log("Update mentor payload:", JSON.stringify(mentorInfo, null, 2));

      // Append the 'data' field as a Blob with application/json content type
      // This matches the curl format: --form 'data="...";type=application/json'
      formData.append("data", new Blob([JSON.stringify(mentorInfo)], { type: "application/json" }));

      // Add file fields - always send placeholder files to avoid backend NullPointerException
      const updateData = _data as CreateMentorData;

      if (updateData.avatar) {
        formData.append("avatar", updateData.avatar);
      } else {
        formData.append("avatar", createEmptyFilePlaceholder());
      }

      if (updateData.identityFile) {
        formData.append("identityFile", updateData.identityFile);
      } else {
        formData.append("identityFile", createEmptyFilePlaceholder());
      }

      if (updateData.degreeFile) {
        formData.append("degreeFile", updateData.degreeFile);
      } else {
        formData.append("degreeFile", createEmptyFilePlaceholder());
      }

      if (updateData.otherFile) {
        formData.append("otherFile", updateData.otherFile);
      } else {
        formData.append("otherFile", createEmptyFilePlaceholder());
      }

      // Use POST endpoint (API_ENDPOINTS.MENTOR.CREATE) for BOTH create and update operations
      // Backend schema comment: "dùng chung cho create và update mentor"
      // The difference: create has no id, update includes id in the JSON data
      // Remove Content-Type to let axios set multipart boundary automatically
      const response = await this.api.post(API_ENDPOINTS.MENTOR.CREATE, formData, {
        headers: {
          "Content-Type": undefined,
        },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error("Update mentor error:", error);
      // Log full error response for debugging
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: unknown } };
        console.error("Backend error response:", axiosError.response?.data);
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update mentor",
      };
    }
  }

  /**
   * Toggle mentor active status
   * GET /api/mentors/toggle/{id}
   * According to schema-from-be.d.ts
   */
  async toggleActive(_id: string | number): Promise<ApiResponse<Mentor>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.MENTOR.TOGGLE, { id: _id });
      const response = await this.api.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to toggle mentor active status",
      };
    }
  }

  /**
   * Delete mentor (kept for compatibility, actually toggles active status)
   * @deprecated Use toggleActive instead for better UX
   */
  async delete(_id: string | number): Promise<ApiResponse<void>> {
    const result = await this.toggleActive(_id);
    return {
      success: result.success,
      error: result.error,
    };
  }
}

// Export singleton instance
export const mentorManager = new MentorManager();
