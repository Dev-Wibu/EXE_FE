/**
 * Auth Manager
 * Handles authentication operations
 *
 * TEMPORARY IMPLEMENTATION:
 * - Login: Fetches all users from /api/users and compares credentials
 * - Signup: Creates new user via POST /api/users
 * - TODO: Replace with proper /auth/login and /auth/signup endpoints when available
 */

import type { ApiResponse } from "@/interfaces";
import type { MentorRegistration, User } from "@/mocks/auth.mock";
import type { components } from "../../schema-from-be";

import { API_ENDPOINTS, MANAGER_MODE, apiConfig } from "@/constants/api.config";
import { fetchClient } from "@/lib/api";
import * as authMock from "@/mocks/auth.mock";
import axios from "axios";

// Type from backend schema
type BackendUser = components["schemas"]["User"];

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  fullName: string;
  email: string;
  password: string;
  university: string;
  major: string;
}

export interface MentorRegisterData {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  yearsOfExperience: string;
  company: string;
  position: string;
  expertise: string;
  bio?: string;
  linkedInUrl?: string;
  cvFile?: File;
  certificateFile?: File;
  idCardFile?: File;
}

export class AuthManager {
  private mode = MANAGER_MODE;
  private api = axios.create(apiConfig);

  /**
   * Check if credentials match demo accounts
   * Demo accounts work in both mock and api modes for testing purposes
   */
  private isDemoAccount(email: string, password: string): boolean {
    return (
      (email === "user@example.com" && password === "user123") ||
      (email === "admin@example.com" && password === "admin123") ||
      (email === "mentor@example.com" && password === "mentor123") ||
      (email === "staff@example.com" && password === "staff123")
    );
  }

  /**
   * Get demo user role based on email
   */
  private getDemoUserRole(email: string): "admin" | "user" | "mentor" | "staff" {
    if (email === "admin@example.com") return "admin";
    if (email === "mentor@example.com") return "mentor";
    if (email === "staff@example.com") return "staff";
    return "user";
  }

  /**
   * Login user
   * TEMPORARY IMPLEMENTATION:
   * - Fetches all users from /api/users
   * - Finds user by email and compares password
   * - TODO: Replace with proper /auth/login endpoint when available
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token?: string }>> {
    // Demo account exception - works in both mock and api modes
    if (this.isDemoAccount(credentials.email, credentials.password)) {
      const role = this.getDemoUserRole(credentials.email);
      const demoUser: User = {
        id: `demo-${role}`,
        email: credentials.email,
        fullName:
          role === "admin"
            ? "Demo Admin"
            : role === "mentor"
              ? "Demo Mentor"
              : role === "staff"
                ? "Demo Staff"
                : "Demo User",
        role: role,
        avatar: undefined,
      };

      return {
        success: true,
        data: {
          user: demoUser,
          token: `demo-token-${demoUser.id}`,
        },
      };
    }

    // For mock mode, use mock implementation
    if (this.mode === "mock") {
      const result = await authMock.mockLogin(credentials.email, credentials.password);
      return {
        success: result.success,
        data: result.user ? { user: result.user } : undefined,
        error: result.error,
      };
    }

    // TEMPORARY: Fetch all users and compare credentials
    try {
      const { data: users, error } = await fetchClient.GET("/api/users");

      if (error || !users) {
        return {
          success: false,
          error: "Không thể kết nối đến server",
        };
      }

      // Find user by email
      const foundUser = (users as BackendUser[]).find(
        (u) => u.email?.toLowerCase() === credentials.email.toLowerCase()
      );

      if (!foundUser) {
        return {
          success: false,
          error: "Email không tồn tại trong hệ thống",
        };
      }

      // Compare password (TEMPORARY - insecure, for development only)
      if (foundUser.password !== credentials.password) {
        return {
          success: false,
          error: "Mật khẩu không chính xác",
        };
      }

      // Map backend user to frontend User type
      const user: User = {
        id: String(foundUser.id || ""),
        email: foundUser.email || "",
        fullName: foundUser.name || "",
        role: foundUser.role === "ADMIN" ? "admin" : "user",
        avatar: foundUser.avatarUrl,
      };

      return {
        success: true,
        data: {
          user,
          token: `temp-token-${foundUser.id}`, // Temporary token
        },
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Đăng nhập thất bại",
      };
    }
  }

  /**
   * Signup new user
   * TEMPORARY IMPLEMENTATION:
   * - First checks if email already exists in /api/users
   * - Creates new user via POST /api/users using multipart/form-data (same as users-admin.manager.ts)
   * - TODO: Replace with proper /auth/signup endpoint when available
   *
   * Updated (2026-01-20): Registration no longer requires avatar or CV upload
   * New JSON format:
   * {
   *   "name": "Nguyen Van A",
   *   "email": "nguyenvana@example.com",
   *   "password": "Password123!",
   *   "university": "Hanoi University of Science and Technology",
   *   "major": "Computer Science"
   * }
   */
  async signup(data: SignupData): Promise<ApiResponse<{ user: User; token?: string }>> {
    if (this.mode === "mock") {
      const result = await authMock.mockSignup(data);
      return {
        success: result.success,
        data: result.user ? { user: result.user } : undefined,
        error: result.error,
      };
    }

    // TEMPORARY: Create user via /api/users using multipart/form-data
    try {
      // First check if email already exists
      const existingUsersResponse = await this.api.get(API_ENDPOINTS.USERS.LIST);
      const existingUsers = existingUsersResponse.data as BackendUser[];

      const emailExists = existingUsers?.some(
        (u) => u.email?.toLowerCase() === data.email.toLowerCase()
      );

      if (emailExists) {
        return {
          success: false,
          error: "Email đã được sử dụng. Vui lòng sử dụng email khác.",
        };
      }

      // Create new user using multipart/form-data (same format as users-admin.manager.ts)
      const formData = new FormData();

      // Prepare UserInfo data object - will be serialized to JSON
      // Updated: Registration no longer requires avatar/CV upload (2026-01-20)
      const userInfo = {
        name: data.fullName.trim(),
        email: data.email.trim(),
        password: data.password, // TEMPORARY - insecure, for development only
        university: data.university?.trim() || "",
        major: data.major?.trim() || "",
      };

      // Append the 'data' field as a JSON Blob (required by backend)
      formData.append("data", new Blob([JSON.stringify(userInfo)], { type: "application/json" }));

      // Send empty file placeholders to avoid backend NullPointerException
      const emptyFile = new File([], "empty.txt", { type: "text/plain" });
      formData.append("avatar", emptyFile);
      formData.append("cvFile", emptyFile);

      // Send request with multipart/form-data
      const response = await this.api.post(API_ENDPOINTS.USERS.CREATE, formData, {
        headers: {
          "Content-Type": undefined, // Let axios set multipart boundary automatically
        },
      });

      const backendUser = response.data as BackendUser;

      // Map backend user to frontend User type
      const user: User = {
        id: String(backendUser.id || ""),
        email: backendUser.email || "",
        fullName: backendUser.name || "",
        role: "user",
      };

      return {
        success: true,
        data: {
          user,
          token: `temp-token-${backendUser.id}`, // Temporary token
        },
      };
    } catch (error) {
      console.error("Signup error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Đăng ký thất bại",
      };
    }
  }

  /**
   * Register as mentor
   */
  async registerMentor(data: MentorRegisterData): Promise<
    ApiResponse<{
      registration: MentorRegistration;
    }>
  > {
    if (this.mode === "mock") {
      const result = await authMock.mockMentorRegister(data);
      return {
        success: result.success,
        data: result.registration ? { registration: result.registration } : undefined,
        error: result.error,
      };
    }

    try {
      // For file uploads, use FormData
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (value !== undefined) {
          formData.append(key, String(value));
        }
      });

      const response = await this.api.post(API_ENDPOINTS.AUTH.MENTOR_REGISTER, formData, {
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
        error: error instanceof Error ? error.message : "Mentor registration failed",
      };
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<ApiResponse<void>> {
    if (this.mode === "mock") {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { success: true };
    }

    try {
      await this.api.post(API_ENDPOINTS.AUTH.LOGOUT);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Logout failed",
      };
    }
  }

  /**
   * Check mentor registration status
   */
  async checkMentorStatus(): Promise<ApiResponse<MentorRegistration>> {
    if (this.mode === "mock") {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        success: true,
        data: authMock.mockMentorRegistration,
      };
    }

    try {
      const response = await this.api.get(API_ENDPOINTS.AUTH.CHECK_STATUS);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to check status",
      };
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    if (this.mode === "mock") {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return {
        success: true,
        data: { token: "mock-refreshed-token" },
      };
    }

    try {
      const response = await this.api.post(API_ENDPOINTS.AUTH.REFRESH);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Token refresh failed",
      };
    }
  }
}

// Export singleton instance
export const authManager = new AuthManager();
