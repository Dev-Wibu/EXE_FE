/**
 * Users Admin Manager
 * Handles user CRUD operations for admin management
 * Based on schema-from-be.d.ts API specification
 */

import type {
  ApiResponse,
  BaseManager,
  PaginatedResponse,
  PaginationParams,
  SchemaCandidateProfile,
  SchemaUserInfo,
  User,
} from "@/interfaces";

import { API_ENDPOINTS, buildEndpoint, createApiInstance } from "@/constants/api.config";
import { normalizeMajor } from "@/constants/majors";

// Re-export User type for convenience
export type { User } from "@/interfaces";

/**
 * UserInfo type for create operations (matches backend schema)
 * Extended to include role field for update operations
 * Note: Backend schema UserInfo doesn't officially include role,
 * but we send it anyway - backend may accept it since User schema has role
 *
 * Updated: Removed bio, targetPosition, targetLevel per BE requirement (2026-01-20)
 * New user registration JSON format:
 * {
 *   "name": "Nguyen Van A",
 *   "email": "nguyenvana@example.com",
 *   "password": "Password123!",
 *   "university": "Hanoi University of Science and Technology",
 *   "major": "Computer Science"
 * }
 */
export type UserInfo = Partial<SchemaUserInfo> & {
  /** Role field - not in official UserInfo schema but may be accepted by backend */
  role?: "MENTOR" | "ADMIN" | "STAFF" | "USER";
  /** isActive field - for soft delete/toggle operations */
  isActive?: boolean;
  /** Cloudinary public_id for avatar - required for update operations to replace/delete old files */
  public_id?: string;
  /** Cloudinary public_id for CV - required for update operations to replace/delete old files */
  cv_public_id?: string;
};

/**
 * Extended user data for creation with file uploads
 */
export interface CreateUserData extends UserInfo {
  avatar?: File;
  cvFile?: File;
}

/**
 * Creates an empty file placeholder for multipart/form-data requests
 * Used as workaround for backend null pointer issues with optional file fields
 */
function createEmptyFilePlaceholder(): File {
  return new File([], "empty.txt", { type: "text/plain" });
}

export class UsersAdminManager implements BaseManager<User> {
  private api = createApiInstance();

  /**
   * Get all users
   * GET /api/users
   */
  async getAll(_params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<User> | User[]>> {
    try {
      const response = await this.api.get(API_ENDPOINTS.USERS.LIST, { params: _params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch users",
      };
    }
  }

  /**
   * Get user by ID
   * GET /api/users/{id}
   */
  async getById(id: string | number): Promise<ApiResponse<User>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.USERS.DETAIL, { id });
      const response = await this.api.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch user",
      };
    }
  }

  /**
   * Create new user
   * POST /api/users (multipart/form-data)
   * According to schema: { data: UserInfo, avatar?: File, cvFile?: File }
   *
   * Note: Registration does NOT require avatar or CV upload (2026-01-20 update)
   */
  async create(_data: Partial<User> | CreateUserData): Promise<ApiResponse<User>> {
    try {
      // Validate required fields
      if (!_data.name || !_data.name.trim()) {
        return {
          success: false,
          error: "Name is required to create a user",
        };
      }
      if (!_data.email || !_data.email.trim()) {
        return {
          success: false,
          error: "Email is required to create a user",
        };
      }

      // According to schema, createUser uses multipart/form-data
      const formData = new FormData();

      // Prepare UserInfo data object
      // This will be serialized to JSON and sent as a Blob with application/json content type
      // Note: Password should be handled securely by the backend (e.g., hashing)
      // The frontend sends the password in plain text over HTTPS
      const createData = _data as CreateUserData;
      const userInfo: UserInfo = {
        name: _data.name.trim(),
        email: _data.email.trim(),
        password: _data.password,
        university: _data.university,
        major: normalizeMajor(_data.major),
        // IMPORTANT: Include public_id fields for Cloudinary file management
        // Backend requires public_id to be present when files are uploaded.
        // For new users creating with files, send empty string "" as placeholder.
        // Backend will use this to determine if it should create new files.
        // Error "Missing required parameter - public_id" occurs when this field is missing.
        public_id: createData.avatar ? "" : undefined, // empty string when uploading new file
        cv_public_id: createData.cvFile ? "" : undefined, // empty string when uploading new file
      };

      // Append the 'data' field as a JSON Blob
      // This is the standard way to send JSON data within multipart/form-data
      // The Blob with type "application/json" tells the server this part is JSON
      formData.append("data", new Blob([JSON.stringify(userInfo)], { type: "application/json" }));

      // Add file fields - always send placeholder files to avoid backend NullPointerException
      // Backend code calls file.isEmpty() without null check first, causing 500 error
      // By sending empty files as placeholders, we prevent null pointer exceptions

      // Always send avatar to avoid "avatar is null" NullPointerException
      if (createData.avatar) {
        formData.append("avatar", createData.avatar);
      } else {
        // Send an empty file as placeholder to avoid backend NullPointerException
        formData.append("avatar", createEmptyFilePlaceholder());
      }

      // Always send cvFile to avoid "cvFile is null" NullPointerException
      if (createData.cvFile) {
        formData.append("cvFile", createData.cvFile);
      } else {
        // Send an empty file as placeholder to avoid backend NullPointerException
        formData.append("cvFile", createEmptyFilePlaceholder());
      }

      // Remove default Content-Type header to let axios set multipart boundary automatically
      const response = await this.api.post(API_ENDPOINTS.USERS.CREATE, formData, {
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
        error: error instanceof Error ? error.message : "Failed to create user",
      };
    }
  }

  /**
   * Update user
   * POST /api/users (multipart/form-data with JSON data field)
   * According to schema-from-be.d.ts: createUser operation is used for both create and update
   * Comment in schema: "dùng chung cho create và update user, nếu create thì ko có id còn update thì có id gửi kèm trong json data á"
   *
   * Schema requires multipart/form-data with:
   * - data: UserInfo (JSON) - contains id when updating
   * - avatar?: File (optional)
   * - cvFile?: File (optional)
   *
   * NOTE: UserInfo schema only contains: id, name, email, password, university, major
   * It does NOT contain: role, isActive, avatarUrl, cvUrl (these are in User schema only)
   * Updated: Removed bio, targetPosition, targetLevel per BE requirement (2026-01-20)
   *
   * @param _id - User ID to update
   * @param _data - User data to update
   * @param avatar - Optional avatar file to upload
   * @param cvFile - Optional CV file to upload
   */
  async update(
    _id: string | number,
    _data: Partial<User>,
    avatar?: File,
    cvFile?: File
  ): Promise<ApiResponse<User>> {
    try {
      // According to schema, use multipart/form-data with JSON 'data' field (same as create)
      const formData = new FormData();

      // Use explicitly passed files if provided, otherwise check _data for files
      const updateData = _data as CreateUserData;
      const avatarFile = avatar || updateData.avatar;
      const cvFileToUpload = cvFile || updateData.cvFile;

      // Build UserInfo object with fields to update
      // Note: role and isActive are not in official UserInfo schema but we include them
      // Backend may accept these fields since they are part of the User schema
      // IMPORTANT: Include public_id and cv_public_id for Cloudinary file management
      // Updated: Removed bio, targetPosition, targetLevel per BE requirement (2026-01-20)
      const userInfo: UserInfo = {
        id: Number(_id), // Include id for update operation
        name: _data.name?.trim(),
        email: _data.email?.trim(),
        password: _data.password,
        university: _data.university,
        major: normalizeMajor(_data.major),
        // Include role if provided - backend may accept this even though not in UserInfo schema
        role: _data.role,
        // Include Cloudinary public_id for avatar - required for update/delete operations
        // Use empty string "" as fallback when uploading new file but no existing public_id
        // Error "Missing required parameter - public_id" occurs when this field is missing
        public_id: _data.public_id ?? (avatarFile ? "" : undefined),
        // Include Cloudinary public_id for CV - required for update/delete operations
        // Use empty string "" as fallback when uploading new file but no existing cv_public_id
        cv_public_id: _data.cv_public_id ?? (cvFileToUpload ? "" : undefined),
      };

      // Append the 'data' field as a JSON Blob (same format as create)
      formData.append("data", new Blob([JSON.stringify(userInfo)], { type: "application/json" }));

      // Avatar file - send placeholder if not provided to avoid backend NullPointerException
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      } else {
        formData.append("avatar", createEmptyFilePlaceholder());
      }

      // CV file - send placeholder if not provided to avoid backend NullPointerException
      if (cvFileToUpload) {
        formData.append("cvFile", cvFileToUpload);
      } else {
        formData.append("cvFile", createEmptyFilePlaceholder());
      }

      // Remove default Content-Type header to let axios set multipart boundary automatically
      const response = await this.api.post(API_ENDPOINTS.USERS.UPDATE, formData, {
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
        error: error instanceof Error ? error.message : "Failed to update user",
      };
    }
  }

  /**
   * Toggle user active status (soft delete / restore)
   *
   * IMPORTANT: Backend does not provide a dedicated toggle endpoint for /api/users.
   * This method toggles isActive status via POST to the same endpoint used for
   * create/update operations (API_ENDPOINTS.USERS.UPDATE).
   *
   * Technical details:
   * - Uses POST /api/users with multipart/form-data (same format as create/update)
   * - Sends JSON data with full user data + toggled isActive in the 'data' field
   * - We need to include ALL existing user data to prevent backend from nullifying fields
   *
   * @param _id User ID to toggle
   * @param userData Current user data to preserve during toggle operation
   */
  async toggleActive(_id: string | number, userData?: Partial<User>): Promise<ApiResponse<void>> {
    try {
      // If no user data provided, fetch it first to preserve existing data
      let currentUserData = userData;
      if (!currentUserData) {
        const fetchResult = await this.getById(_id);
        if (fetchResult.success && fetchResult.data) {
          currentUserData = fetchResult.data;
        } else {
          // Failed to fetch user data - cannot proceed with toggle
          return {
            success: false,
            error: fetchResult.error || "Failed to fetch user data for toggle operation",
          };
        }
      }

      // Determine the new active status (toggle current status)
      const currentlyActive = currentUserData?.isActive !== false;
      const newActiveStatus = !currentlyActive;

      // Build user data with toggled isActive
      // Include all existing user data to prevent backend from nullifying fields
      // IMPORTANT: Include public_id and cv_public_id for Cloudinary file management
      // Updated: Removed bio, targetPosition, targetLevel per BE requirement (2026-01-20)
      const userInfo: UserInfo = {
        id: Number(_id),
        name: currentUserData?.name?.trim(),
        email: currentUserData?.email?.trim(),
        university: currentUserData?.university,
        major: currentUserData?.major,
        role: currentUserData?.role,
        isActive: newActiveStatus,
        // Include Cloudinary public_id for avatar - required for update operations
        public_id: currentUserData?.public_id,
        // Include Cloudinary public_id for CV - required for update operations
        cv_public_id: currentUserData?.cv_public_id,
      };

      // Send as multipart/form-data to match the createUser endpoint format
      const formData = new FormData();

      // Append the 'data' field as a JSON Blob
      formData.append("data", new Blob([JSON.stringify(userInfo)], { type: "application/json" }));

      // Send placeholder files to avoid backend NullPointerException
      formData.append("avatar", createEmptyFilePlaceholder());
      formData.append("cvFile", createEmptyFilePlaceholder());

      await this.api.post(API_ENDPOINTS.USERS.UPDATE, formData, {
        headers: {
          "Content-Type": undefined,
        },
      });

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to toggle user status",
      };
    }
  }

  /**
   * Delete user (soft delete / toggle active status)
   *
   * IMPORTANT: Backend does not provide a DELETE endpoint for /api/users.
   * This method implements soft delete by sending isActive: false via POST to the
   * same endpoint used for create/update operations (API_ENDPOINTS.USERS.UPDATE).
   *
   * Technical details:
   * - Uses POST /api/users with multipart/form-data (same format as create/update)
   * - Sends JSON data with full user data + isActive: false in the 'data' field
   * - We need to include ALL existing user data to prevent backend from nullifying fields
   *
   * If the backend rejects this request, the backend team needs to either:
   * 1. Add a dedicated DELETE/deactivate endpoint
   * 2. Extend UserInfo schema to include isActive field
   *
   * @param _id User ID to delete/deactivate
   * @param userData Optional current user data to preserve during toggle operation
   * @deprecated Since v1.0.0. Use toggleActive() instead for better semantics.
   *             This method will be removed in a future major version.
   */
  async delete(_id: string | number, userData?: Partial<User>): Promise<ApiResponse<void>> {
    // Delegate to toggleActive for the actual implementation
    return this.toggleActive(_id, userData);
  }

  /**
   * Upload CV for a specific user
   * POST /api/users/upload-cv (multipart/form-data)
   *
   * This is a dedicated endpoint for CV upload that returns CandidateProfile.
   * Use this instead of including CV in the general update when you only need to update CV.
   *
   * @param userId - User ID to upload CV for
   * @param cvFile - PDF file to upload (only PDF is accepted)
   * @returns CandidateProfile with parsed CV data
   */
  async uploadCv(
    userId: string | number,
    cvFile: File
  ): Promise<ApiResponse<SchemaCandidateProfile>> {
    try {
      // Validate userId
      if (userId === null || userId === undefined) {
        return {
          success: false,
          error: "User ID is required to upload CV",
        };
      }

      // Validate file type - only PDF allowed
      if (!cvFile.type.includes("pdf") && !cvFile.name.toLowerCase().endsWith(".pdf")) {
        return {
          success: false,
          error: "Chỉ chấp nhận file PDF",
        };
      }

      const formData = new FormData();
      // userId must be sent with application/json content-type as per BE requirement
      // curl example: -F 'userId=4;type=application/json'
      formData.append("userId", new Blob([String(userId)], { type: "application/json" }));
      formData.append("cvFile", cvFile);

      const response = await this.api.post(API_ENDPOINTS.USERS.UPLOAD_CV, formData, {
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
        error: error instanceof Error ? error.message : "Failed to upload CV",
      };
    }
  }
}

// Export singleton instance
export const usersAdminManager = new UsersAdminManager();
