/**
 * Auth Manager
 * Handles authentication operations
 */

import type { ApiResponse } from "@/interfaces";
import type { User as AuthUser, MentorRegistration } from "@/mocks/auth.mock";
import type { components } from "../../schema-from-be";

import {
  API_BASE_URL,
  API_ENDPOINTS,
  MANAGER_MODE,
  createApiInstance,
} from "@/constants/api.config";
import { isValidMajor } from "@/constants/majors";
import { fetchClient } from "@/lib/api";
import * as authMock from "@/mocks/auth.mock";

// Type from backend schema
type BackendUser = components["schemas"]["User"];

type LoginPayload = {
  user: AuthUser;
  token?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const asNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const getEmailPrefix = (email: string): string => {
  const prefix = email.split("@")[0]?.trim();
  return prefix && prefix.length > 0 ? prefix : "Người dùng";
};

const normalizeId = (value: unknown, fallback: string): string => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return fallback;
};

const OAUTH_TOKEN_PARAM_KEYS = [
  "token",
  "accessToken",
  "access_token",
  "jwt",
  "idToken",
  "id_token",
] as const;

const OAUTH_SIGNAL_PARAM_KEYS = [
  ...OAUTH_TOKEN_PARAM_KEYS,
  "error",
  "error_description",
  "code",
  "state",
] as const;

const OAUTH_ERROR_PARAM_KEYS = ["error_description", "error"] as const;

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

  private normalizeToken(token?: string): string | undefined {
    if (!token) {
      return undefined;
    }

    let normalized = token.trim();

    if (normalized.startsWith('"') && normalized.endsWith('"')) {
      normalized = normalized.slice(1, -1);
    }

    if (normalized.startsWith("'") && normalized.endsWith("'")) {
      normalized = normalized.slice(1, -1);
    }

    return normalized.replace(/^Bearer\s+/i, "").trim();
  }

  private decodeJwtPayload(token: string): Record<string, unknown> | null {
    const parts = token.split(".");
    if (parts.length < 2) {
      return null;
    }

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

    try {
      if (typeof atob === "function") {
        return JSON.parse(atob(padded)) as Record<string, unknown>;
      }
    } catch {
      return null;
    }

    return null;
  }

  private extractRoleFromClaims(claims: Record<string, unknown>): string | undefined {
    const directRole = asNonEmptyString(claims.role);
    if (directRole) {
      return directRole;
    }

    const authorities = claims.authorities;
    if (Array.isArray(authorities)) {
      const firstAuthority = authorities.find((item) => typeof item === "string");
      if (typeof firstAuthority === "string") {
        return firstAuthority;
      }
    }

    const roles = claims.roles;
    if (Array.isArray(roles)) {
      const firstRole = roles.find((item) => typeof item === "string");
      if (typeof firstRole === "string") {
        return firstRole;
      }
    }

    return undefined;
  }

  private buildUserFromToken(token: string, emailFallback: string): AuthUser | undefined {
    const claims = this.decodeJwtPayload(token);
    if (!claims) {
      return undefined;
    }

    const email = asNonEmptyString(claims.email) || emailFallback;
    const fullName =
      asNonEmptyString(claims.name) ||
      asNonEmptyString(claims.fullName) ||
      asNonEmptyString(claims.preferred_username) ||
      getEmailPrefix(email);
    const role = this.mapBackendRoleToFrontend(this.extractRoleFromClaims(claims));

    return {
      id: normalizeId(claims.userId ?? claims.id ?? claims.uid ?? claims.sub, email),
      email,
      fullName,
      role,
      avatar: asNonEmptyString(claims.avatarUrl) || asNonEmptyString(claims.avatar),
    };
  }

  private mapUserFromUnknown(
    value: unknown,
    emailFallback: string,
    roleFallback: "ADMIN" | "USER" | "MENTOR" | "STAFF" = "USER"
  ): AuthUser | undefined {
    if (!isRecord(value)) {
      return undefined;
    }

    const email = asNonEmptyString(value.email) || emailFallback;
    const fullName =
      asNonEmptyString(value.fullName) ||
      asNonEmptyString(value.name) ||
      asNonEmptyString(value.username) ||
      getEmailPrefix(email);

    return {
      id: normalizeId(value.id ?? value.userId ?? value.uid ?? value.sub, email),
      email,
      fullName,
      role: this.mapBackendRoleToFrontend(asNonEmptyString(value.role) || roleFallback),
      avatar: asNonEmptyString(value.avatarUrl) || asNonEmptyString(value.avatar),
    };
  }

  private extractTokenFromUnknown(value: unknown): string | undefined {
    if (typeof value === "string") {
      return this.normalizeToken(value);
    }

    if (!isRecord(value)) {
      return undefined;
    }

    const directToken =
      asNonEmptyString(value.token) ||
      asNonEmptyString(value.accessToken) ||
      asNonEmptyString(value.jwt) ||
      asNonEmptyString(value.idToken);

    if (directToken) {
      return this.normalizeToken(directToken);
    }

    if (isRecord(value.data)) {
      return this.extractTokenFromUnknown(value.data);
    }

    return undefined;
  }

  private extractUserCandidate(value: unknown): unknown {
    if (!isRecord(value)) {
      return undefined;
    }

    if (isRecord(value.user)) {
      return value.user;
    }

    if (isRecord(value.data)) {
      if (isRecord(value.data.user)) {
        return value.data.user;
      }

      return value.data;
    }

    return value;
  }

  private parseLoginResponse(data: unknown, emailFallback: string): LoginPayload {
    const token = this.extractTokenFromUnknown(data);
    const userCandidate = this.extractUserCandidate(data);
    const userFromCandidate = this.mapUserFromUnknown(userCandidate, emailFallback);
    const userFromToken = token ? this.buildUserFromToken(token, emailFallback) : undefined;

    let user = userFromCandidate || userFromToken;
    if (!user) {
      user = {
        id: emailFallback,
        email: emailFallback,
        fullName: getEmailPrefix(emailFallback),
        role: "USER",
      };
    }

    return {
      user,
      token,
    };
  }

  private normalizeLoginResponseData(data: unknown): unknown {
    if (typeof data !== "string") {
      return data;
    }

    const trimmed = data.trim();
    if (trimmed.length === 0) {
      return trimmed;
    }

    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return trimmed;
    }
  }

  private parseOAuthCallbackUrl(rawUrl: string): { query: URLSearchParams; hash: URLSearchParams } {
    const fallbackOrigin = typeof window !== "undefined" ? window.location.origin : API_BASE_URL;
    const parsedUrl = new URL(rawUrl, fallbackOrigin);
    const hashValue = parsedUrl.hash.startsWith("#") ? parsedUrl.hash.slice(1) : parsedUrl.hash;

    return {
      query: parsedUrl.searchParams,
      hash: new URLSearchParams(hashValue),
    };
  }

  private getFirstParamValue(
    sources: URLSearchParams[],
    keys: readonly string[]
  ): string | undefined {
    for (const source of sources) {
      for (const key of keys) {
        const value = asNonEmptyString(source.get(key));
        if (value) {
          return value;
        }
      }
    }

    return undefined;
  }

  private extractErrorMessage(error: unknown): string | undefined {
    if (typeof error === "string") {
      return error;
    }

    if (!isRecord(error)) {
      return undefined;
    }

    return (
      asNonEmptyString(error.message) ||
      asNonEmptyString(error.error) ||
      asNonEmptyString(error.detail) ||
      (isRecord(error.data)
        ? asNonEmptyString(error.data.message) || asNonEmptyString(error.data.error)
        : undefined)
    );
  }

  /**
   * Login user through /api/auth/login.
   * Authentication decision is delegated to backend auth API.
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginPayload>> {
    // For mock mode, use mock implementation
    if (this.mode === "mock") {
      const result = await authMock.mockLogin(credentials.email, credentials.password);
      return {
        success: result.success,
        data: result.user
          ? {
              user: result.user,
            }
          : undefined,
        error: result.error,
      };
    }

    try {
      const { data, error } = await fetchClient.POST("/api/auth/login", {
        body: {
          email: credentials.email.trim(),
          password: credentials.password,
        },
        parseAs: "text",
      });

      if (error) {
        return {
          success: false,
          error: this.extractErrorMessage(error) || "Đăng nhập thất bại",
        };
      }

      if (data === undefined || data === null) {
        return {
          success: false,
          error: "Không nhận được dữ liệu đăng nhập từ máy chủ",
        };
      }

      const normalizedData = this.normalizeLoginResponseData(data);
      if (typeof normalizedData === "string" && normalizedData.trim().length === 0) {
        return {
          success: false,
          error: "Không nhận được dữ liệu đăng nhập từ máy chủ",
        };
      }

      const userCandidate = this.extractUserCandidate(normalizedData);
      if (isRecord(userCandidate) && userCandidate.isActive === false) {
        return {
          success: false,
          error: "Tài khoản đã bị khóa",
        };
      }

      const payload = this.parseLoginResponse(normalizedData, credentials.email.trim());

      return {
        success: true,
        data: payload,
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
   * Build absolute Google login URL for browser redirect.
   */
  getGoogleLoginUrl(): string {
    const endpoint = API_ENDPOINTS.AUTH.LOGIN_WITH_GOOGLE;
    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
      return endpoint;
    }

    return new URL(endpoint, API_BASE_URL).toString();
  }

  /**
   * Check whether current URL contains OAuth callback params.
   */
  hasGoogleCallbackPayload(rawUrl: string): boolean {
    try {
      const { query, hash } = this.parseOAuthCallbackUrl(rawUrl);
      const sources = [query, hash];

      return sources.some((source) => OAUTH_SIGNAL_PARAM_KEYS.some((key) => source.has(key)));
    } catch {
      return false;
    }
  }

  /**
   * Read callback error from OAuth redirect URL.
   */
  getGoogleCallbackError(rawUrl: string): string | undefined {
    try {
      const { query, hash } = this.parseOAuthCallbackUrl(rawUrl);
      return this.getFirstParamValue([query, hash], OAUTH_ERROR_PARAM_KEYS);
    } catch {
      return undefined;
    }
  }

  /**
   * Consume OAuth callback URL and extract user + JWT token.
   */
  consumeGoogleCallbackFromUrl(rawUrl: string): ApiResponse<LoginPayload> {
    try {
      const { query, hash } = this.parseOAuthCallbackUrl(rawUrl);
      const sources = [query, hash];

      const normalizedToken = this.normalizeToken(
        this.getFirstParamValue(sources, OAUTH_TOKEN_PARAM_KEYS)
      );

      if (!normalizedToken) {
        return {
          success: false,
          error: "Khong tim thay token dang nhap Google trong URL callback.",
        };
      }

      const emailFallback =
        this.getFirstParamValue(sources, ["email", "userEmail"]) || "google-user@inblue.local";

      const userCandidate = {
        id: this.getFirstParamValue(sources, ["userId", "id", "uid", "sub"]),
        email: this.getFirstParamValue(sources, ["email", "userEmail"]),
        fullName: this.getFirstParamValue(sources, ["fullName", "name", "username"]),
        role: this.getFirstParamValue(sources, ["role"]),
        avatarUrl: this.getFirstParamValue(sources, ["avatarUrl", "avatar"]),
      };

      const userFromToken = this.buildUserFromToken(normalizedToken, emailFallback);
      const userFromParams = this.mapUserFromUnknown(userCandidate, emailFallback, "USER");

      const user = userFromToken ||
        userFromParams || {
          id: emailFallback,
          email: emailFallback,
          fullName: getEmailPrefix(emailFallback),
          role: "USER" as const,
        };

      return {
        success: true,
        data: {
          user,
          token: normalizedToken,
        },
      };
    } catch {
      return {
        success: false,
        error: "Khong the xu ly callback dang nhap Google.",
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
  async signup(data: SignupData): Promise<ApiResponse<LoginPayload>> {
    if (this.mode === "mock") {
      const result = await authMock.mockSignup(data);
      return {
        success: result.success,
        data: result.user
          ? {
              user: result.user,
            }
          : undefined,
        error: result.error,
      };
    }

    try {
      if (!isValidMajor(data.major)) {
        return {
          success: false,
          error: "Chuyên ngành không hợp lệ",
        };
      }

      const formData = new FormData();

      const userInfo = {
        name: data.fullName.trim(),
        email: data.email.trim(),
        password: data.password,
        university: data.university?.trim() || "",
        major: data.major,
      };

      formData.append("data", new Blob([JSON.stringify(userInfo)], { type: "application/json" }));

      const response = await this.api.post(API_ENDPOINTS.USERS.CREATE, formData, {
        headers: {
          "Content-Type": undefined,
        },
      });

      const backendUser = response.data as BackendUser;
      const user = this.mapUserFromUnknown(backendUser, data.email, "USER");

      if (!user) {
        return {
          success: false,
          error: "Không thể đọc thông tin tài khoản sau đăng ký",
        };
      }

      user.role = "USER";

      return {
        success: true,
        data: {
          user,
          token: this.extractTokenFromUnknown(response.data),
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

      // Only append files the user actually uploaded.
      if (data.avatar) {
        formData.append("avatar", data.avatar);
      }
      if (data.identityFile) {
        formData.append("identityFile", data.identityFile);
      }
      if (data.degreeFile) {
        formData.append("degreeFile", data.degreeFile);
      }
      if (data.otherFile) {
        formData.append("otherFile", data.otherFile);
      }

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
    return { success: true };
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
