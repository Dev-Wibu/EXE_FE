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
  User,
} from "@/interfaces";

import { API_ENDPOINTS, MANAGER_MODE, apiConfig, buildEndpoint } from "@/constants/api.config";
import * as usersMock from "@/mocks/users-admin.mock";
import axios from "axios";

// Re-export User type for convenience
export type { User } from "@/interfaces";

/**
 * UserInfo type for create operations (matches backend schema)
 */
export interface UserInfo {
  id?: number;
  name?: string;
  email?: string;
  password?: string;
  bio?: string;
  university?: string;
  major?: string;
  targetPosition?: string;
  targetLevel?: string;
}

/**
 * Extended user data for creation with file uploads
 */
export interface CreateUserData extends UserInfo {
  avatar?: File;
  cvFile?: File;
}

/**
 * Type guard to check if a value is a plain object (not array, not null)
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Creates an empty file placeholder for multipart/form-data requests
 * Used as workaround for backend null pointer issues with optional file fields
 */
function createEmptyFilePlaceholder(): File {
  return new File([], "empty.txt", { type: "text/plain" });
}

/**
 * Serialize params for Spring Boot query parameter binding
 * Converts nested objects to dot notation query string format
 *
 * Spring Boot uses @ModelAttribute binding with dot notation:
 * user.id=1&user.name=John (NOT JSON string as parameter value)
 *
 * Example output: PUT /api/users?user.id=1&user.name=John&user.email=john@test.com
 *
 * @param prefix - The prefix for parameter names (e.g., "user")
 * @param obj - The object to serialize
 * @returns Array of URL-encoded parameter strings like ["user.id=1", "user.name=John"]
 */
function serializeParamsWithDotNotation(prefix: string, obj: Record<string, unknown>): string[] {
  const params: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;

    const paramKey = `${prefix}.${key}`;

    if (isPlainObject(value)) {
      // Recursively handle nested objects
      params.push(...serializeParamsWithDotNotation(paramKey, value));
    } else if (Array.isArray(value)) {
      // Handle arrays with indexed notation: user.items[0], user.items[1], etc.
      value.forEach((item, index) => {
        if (isPlainObject(item)) {
          params.push(...serializeParamsWithDotNotation(`${paramKey}[${index}]`, item));
        } else {
          params.push(
            `${encodeURIComponent(`${paramKey}[${index}]`)}=${encodeURIComponent(String(item))}`
          );
        }
      });
    } else {
      params.push(`${encodeURIComponent(paramKey)}=${encodeURIComponent(String(value))}`);
    }
  }

  return params;
}

/**
 * Main serializer function for axios paramsSerializer
 * Converts { user: { id: 1, name: "John" } } to "user.id=1&user.name=John"
 *
 * @param params - The parameters object to serialize
 * @returns URL-encoded query string
 */
function serializeParams(params: Record<string, unknown>): string {
  const allParams: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;

    if (isPlainObject(value)) {
      // Use dot notation for nested objects (e.g., user object)
      allParams.push(...serializeParamsWithDotNotation(key, value));
    } else if (Array.isArray(value)) {
      // Handle top-level arrays
      value.forEach((item, index) => {
        if (isPlainObject(item)) {
          allParams.push(...serializeParamsWithDotNotation(`${key}[${index}]`, item));
        } else {
          allParams.push(
            `${encodeURIComponent(`${key}[${index}]`)}=${encodeURIComponent(String(item))}`
          );
        }
      });
    } else {
      allParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }

  return allParams.join("&");
}

export class UsersAdminManager implements BaseManager<User> {
  private mode = MANAGER_MODE;
  private api = axios.create(apiConfig);

  /**
   * Get all users
   * GET /api/users
   */
  async getAll(_params?: PaginationParams): Promise<ApiResponse<PaginatedResponse<User> | User[]>> {
    if (this.mode === "mock") {
      const users = await usersMock.fetchUsers();
      return {
        success: true,
        data: users,
      };
    }

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
    if (this.mode === "mock") {
      const user = await usersMock.fetchUser(Number(id));
      if (!user) {
        return {
          success: false,
          error: "User not found",
        };
      }
      return {
        success: true,
        data: user,
      };
    }

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
   */
  async create(_data: Partial<User> | CreateUserData): Promise<ApiResponse<User>> {
    if (this.mode === "mock") {
      // In mock mode, simulate creating a user with robust ID generation
      const newId = Date.now() + Math.floor(Math.random() * 1000);
      const newUser: User = {
        id: newId,
        name: _data.name,
        email: _data.email,
        role: (_data as User).role || "USER",
        isActive: (_data as User).isActive !== false,
        bio: _data.bio,
        university: _data.university,
        major: _data.major,
        targetPosition: _data.targetPosition,
        targetLevel: _data.targetLevel,
      };
      usersMock.mockUsers.push(newUser);
      return {
        success: true,
        data: newUser,
      };
    }

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
      const userInfo: UserInfo = {
        name: _data.name.trim(),
        email: _data.email.trim(),
        password: _data.password,
        bio: _data.bio,
        university: _data.university,
        major: _data.major,
        targetPosition: _data.targetPosition,
        targetLevel: _data.targetLevel,
      };

      // Append the 'data' field as a JSON Blob
      // This is the standard way to send JSON data within multipart/form-data
      // The Blob with type "application/json" tells the server this part is JSON
      formData.append("data", new Blob([JSON.stringify(userInfo)], { type: "application/json" }));

      // Add file fields - always send placeholder files to avoid backend NullPointerException
      // Backend code calls file.isEmpty() without null check first, causing 500 error
      // By sending empty files as placeholders, we prevent null pointer exceptions
      const createData = _data as CreateUserData;

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
   * PUT /api/users (query param: user with dot notation)
   * According to schema: uses query parameter with User object
   *
   * Spring Boot @ModelAttribute binding requires dot notation format:
   * PUT /api/users?user.id=1&user.name=John&user.email=john@test.com
   *
   * NOT JSON string format (which causes "Failed to convert String to User" error)
   */
  async update(_id: string | number, _data: Partial<User>): Promise<ApiResponse<User>> {
    if (this.mode === "mock") {
      // In mock mode, simulate updating a user
      const index = usersMock.mockUsers.findIndex((u) => u.id === Number(_id));
      if (index === -1) {
        return {
          success: false,
          error: "User not found",
        };
      }
      usersMock.mockUsers[index] = { ...usersMock.mockUsers[index], ..._data };
      return {
        success: true,
        data: usersMock.mockUsers[index],
      };
    }

    try {
      // Build the user object with id included
      const userData: Partial<User> = { ..._data, id: Number(_id) };

      // Send user object using dot notation in query parameters
      // Format: PUT /api/users?user.id=1&user.name=John&user.email=john@test.com
      const response = await this.api.put(API_ENDPOINTS.USERS.UPDATE, null, {
        params: { user: userData },
        paramsSerializer: serializeParams,
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
   * Delete user
   * Note: Backend schema does not define DELETE for /api/users
   * This is a soft delete by setting isActive to false via PUT with dot notation
   */
  async delete(_id: string | number): Promise<ApiResponse<void>> {
    if (this.mode === "mock") {
      // In mock mode, simulate deleting a user
      const index = usersMock.mockUsers.findIndex((u) => u.id === Number(_id));
      if (index === -1) {
        return {
          success: false,
          error: "User not found",
        };
      }
      usersMock.mockUsers.splice(index, 1);
      return {
        success: true,
      };
    }

    try {
      // Backend doesn't have DELETE endpoint, use soft delete via update
      // Send user object with isActive: false using dot notation in query parameters
      // Format: PUT /api/users?user.id=1&user.isActive=false
      const userData: Partial<User> = { id: Number(_id), isActive: false };
      await this.api.put(API_ENDPOINTS.USERS.UPDATE, null, {
        params: { user: userData },
        paramsSerializer: serializeParams,
      });
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete user",
      };
    }
  }
}

// Export singleton instance
export const usersAdminManager = new UsersAdminManager();
