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

import { API_ENDPOINTS, MANAGER_MODE, createApiInstance } from "@/constants/api.config";
import { fetchClient } from "@/lib/api";
import * as authMock from "@/mocks/auth.mock";

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
  name: string;
  email: string;
  password: string;
  bio?: string;
  expertise: string;
  yearsOfExperience?: number;
  linkedInUrl?: string;
  currentCompany: string;
  avatar?: File;
  identityFile?: File;
  degreeFile?: File;
  otherFile?: File;
}

export class AuthManager {
  private mode = MANAGER_MODE;
  private api = createApiInstance();

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
  private getDemoUserRole(email: string): "ADMIN" | "USER" | "MENTOR" | "STAFF" {
    if (email === "admin@example.com") return "ADMIN";
    if (email === "mentor@example.com") return "MENTOR";
    if (email === "staff@example.com") return "STAFF";
    return "USER";
  }

  /**
   * Map backend role to frontend role
   */
  private mapBackendRoleToFrontend(backendRole?: string): "ADMIN" | "USER" | "MENTOR" | "STAFF" {
    const normalized = backendRole?.replace(/^ROLE_/i, "").toUpperCase();

    switch (normalized) {
      case "ADMIN":
        return "ADMIN";
      case "MENTOR":
        return "MENTOR";
      case "STAFF":
        return "STAFF";
      case "USER":
      default:
        return "USER";
    }
  }

  /**
   * Login user
   * TEMPORARY IMPLEMENTATION:
   * - Fetches all users from /api/users
   * - Finds user by email and compares password
   * - TODO: Replace with proper /auth/login endpoint when available
   */
  /**
   * Map of demo accounts to their real backend IDs.
   * USER and MENTOR use real user id=2; ADMIN uses real backend id=1.
   */
  private readonly DEMO_REAL_IDS: Record<string, number | null> = {
    USER: 2,
    MENTOR: 2,
    ADMIN: 1,
    STAFF: null,
  };

  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token?: string }>> {
    // Demo account exception - works in both mock and api modes
    if (this.isDemoAccount(credentials.email, credentials.password)) {
      const role = this.getDemoUserRole(credentials.email);
      const realId = this.DEMO_REAL_IDS[role];

      // For USER and MENTOR: fetch real user from backend by id
      if (realId !== null) {
        try {
          const endpoint = role === "MENTOR" ? `/api/mentors/${realId}` : `/api/users/${realId}`;
          const { data: backendUser } = await fetchClient.GET(endpoint as "/api/users/{id}", {
            params: { path: { id: realId } },
          });

          if (backendUser) {
            const bu = backendUser as BackendUser;
            const user: User = {
              id: String(bu.id || realId),
              email: bu.email || credentials.email,
              fullName: bu.name || `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
              role: this.mapBackendRoleToFrontend(bu.role) || role,
              avatar: bu.avatarUrl,
            };

            return {
              success: true,
              data: {
                user,
                token: `demo-token-${bu.id || realId}`,
              },
            };
          }
        } catch (error) {
          console.warn(
            `Failed to fetch real ${role} id=${realId}, falling back to demo user`,
            error
          );
        }
      }

      // Fallback for STAFF or if real fetch failed
      const demoUser: User = {
        id: role === "ADMIN" ? "1" : `demo-${role}`,
        email: credentials.email,
        fullName:
          role === "ADMIN"
            ? "Demo Admin"
            : role === "MENTOR"
              ? "Demo Mentor"
              : role === "STAFF"
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
      const { data: users, error: userError } = await fetchClient.GET("/api/users");
      const { data: mentors, error: mentorError } = await fetchClient.GET("/api/mentors");

      const emailLower = credentials.email.toLowerCase();

      const matchedUser =
        !userError && users
          ? (users as BackendUser[]).find((u) => u.email?.toLowerCase() === emailLower)
          : undefined;

      const matchedMentorRaw =
        !mentorError && mentors
          ? (mentors as BackendUser[]).find((m) => m.email?.toLowerCase() === emailLower)
          : undefined;

      const matchedMentor = matchedMentorRaw
        ? ({
            id: matchedMentorRaw.id,
            name: matchedMentorRaw.name,
            email: matchedMentorRaw.email,
            password: matchedMentorRaw.password,
            role: "MENTOR",
            avatarUrl: matchedMentorRaw.avatarUrl,
          } as BackendUser)
        : undefined;

      const candidates: BackendUser[] = [matchedMentor, matchedUser].filter(
        (candidate): candidate is BackendUser => Boolean(candidate)
      );

      if (candidates.length === 0) {
        return {
          success: false,
          error: "Email không tồn tại trong hệ thống",
        };
      }

      // Prefer mentor candidate if both sources contain same email and password matches
      const foundUser = candidates.find((candidate) => candidate.password === credentials.password);

      // Compare password (TEMPORARY - insecure, for development only)
      if (!foundUser) {
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
        role: this.mapBackendRoleToFrontend(foundUser.role),
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
        role: "USER",
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
   * POST /api/mentors (multipart/form-data)
   * Schema: { data: MentorInfo, avatar?: File, identityFile?: File, degreeFile?: File, otherFile?: File }
   */
  async registerMentor(data: MentorRegisterData): Promise<
    ApiResponse<{
      registration: MentorRegistration;
    }>
  > {
    if (this.mode === "mock") {
      const result = await authMock.mockMentorRegister({
        fullName: data.name,
        email: data.email,
        password: data.password,
        phone: "",
        yearsOfExperience: String(data.yearsOfExperience || 0),
        company: data.currentCompany,
        position: "",
        expertise: data.expertise,
        bio: data.bio,
        linkedInUrl: data.linkedInUrl,
      });
      return {
        success: result.success,
        data: result.registration ? { registration: result.registration } : undefined,
        error: result.error,
      };
    }

    try {
      // Create FormData for multipart/form-data request
      const formData = new FormData();

      // Prepare MentorInfo data object (JSON)
      const mentorInfo = {
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
        bio: data.bio?.trim() || "",
        expertise: data.expertise.trim(),
        yearsOfExperience: data.yearsOfExperience || 0,
        linkedInUrl: data.linkedInUrl?.trim() || "",
        currentCompany: data.currentCompany.trim(),
      };

      // Append the 'data' field as a JSON Blob
      formData.append("data", new Blob([JSON.stringify(mentorInfo)], { type: "application/json" }));

      // Helper to create empty file placeholder
      const emptyFile = new File([], "empty.txt", { type: "text/plain" });

      // Add file fields - send placeholder if not provided to avoid backend NullPointerException
      formData.append("avatar", data.avatar || emptyFile);
      formData.append("identityFile", data.identityFile || emptyFile);
      formData.append("degreeFile", data.degreeFile || emptyFile);
      formData.append("otherFile", data.otherFile || emptyFile);

      const response = await this.api.post(API_ENDPOINTS.MENTOR.CREATE, formData, {
        headers: {
          "Content-Type": undefined, // Let axios set multipart boundary automatically
        },
      });

      return {
        success: true,
        data: {
          registration: {
            id: String(response.data.id || ""),
            fullName: response.data.name || "",
            email: response.data.email || "",
            status: "pending",
            submittedAt: new Date().toISOString(),
            reviewedAt: null,
          },
        },
      };
    } catch (error) {
      console.error("Mentor registration error:", error);
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
