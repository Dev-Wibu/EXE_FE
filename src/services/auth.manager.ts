import i18n from "@/lib/i18n";
const t = i18n.t.bind(i18n);
/**
 * Auth Manager
 * Handles authentication operations
 */

import { API_BASE_URL, API_ENDPOINTS } from "@/constants/api.config";
import { isValidMajor } from "@/constants/majors";
import type { ApiResponse } from "@/interfaces";
import { fetchClient } from "@/lib/api";
import { getNormalizedErrorMessage } from "@/lib/error-normalizer";
import type { components } from "../../schema-from-be";

// Type from backend schema
type BackendUser = components["schemas"]["User"];
type AuthRole = "ADMIN" | "USER" | "MENTOR" | "STAFF";
type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: AuthRole;
  avatar?: string | null;
  bio?: string;
};
type MentorRegistration = {
  id?: string;
  fullName?: string;
  email?: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt: string | null;
};
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

const extractFieldErrors = (payload: unknown): Record<string, string> | undefined => {
  if (!isRecord(payload) || !isRecord(payload.errors)) {
    return undefined;
  }
  const mapped = Object.entries(payload.errors).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      if (typeof value === "string" && value.trim().length > 0) {
        acc[key] = value.trim();
      } else if (Array.isArray(value)) {
        const firstMessage = value.find(
          (item) => typeof item === "string" && item.trim().length > 0
        );
        if (typeof firstMessage === "string") {
          acc[key] = firstMessage.trim();
        }
      }
      return acc;
    },
    {}
  );
  return Object.keys(mapped).length > 0 ? mapped : undefined;
};
const extractApiErrorMessage = (payload: unknown): string | undefined => {
  if (!isRecord(payload)) {
    return undefined;
  }
  return (
    asNonEmptyString(payload.message) ||
    asNonEmptyString(payload.error) ||
    asNonEmptyString(payload.detail) ||
    asNonEmptyString(payload.title)
  );
};
const getEmailPrefix = (email: string): string => {
  const prefix = email.split("@")[0]?.trim();
  return prefix && prefix.length > 0 ? prefix : t("common.user");
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
  private parseOAuthCallbackUrl(rawUrl: string): {
    query: URLSearchParams;
    hash: URLSearchParams;
  } {
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
    const dataMessage =
      asNonEmptyString(error.data) ||
      (isRecord(error.data)
        ? asNonEmptyString(error.data.message) ||
          asNonEmptyString(error.data.error) ||
          asNonEmptyString(error.data.detail)
        : undefined);
    const responseMessage = isRecord(error.response)
      ? asNonEmptyString(error.response.data) ||
        (isRecord(error.response.data)
          ? asNonEmptyString(error.response.data.message) ||
            asNonEmptyString(error.response.data.error) ||
            asNonEmptyString(error.response.data.detail)
          : undefined)
      : undefined;
    return (
      asNonEmptyString(error.message) ||
      asNonEmptyString(error.error) ||
      asNonEmptyString(error.detail) ||
      dataMessage ||
      responseMessage
    );
  }
  private extractHttpStatus(error: unknown): number | undefined {
    const toStatus = (value: unknown): number | undefined => {
      if (typeof value === "number" && Number.isFinite(value)) {
        return Math.trunc(value);
      }
      if (typeof value === "string") {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          return Math.trunc(parsed);
        }
      }
      return undefined;
    };
    if (!isRecord(error)) {
      return undefined;
    }
    const topLevelStatus = toStatus(error.status) ?? toStatus(error.statusCode);
    if (topLevelStatus) {
      return topLevelStatus;
    }
    if (isRecord(error.response)) {
      const responseStatus = toStatus(error.response.status) ?? toStatus(error.response.statusCode);
      if (responseStatus) {
        return responseStatus;
      }
    }
    if (isRecord(error.data)) {
      const dataStatus = toStatus(error.data.status) ?? toStatus(error.data.statusCode);
      if (dataStatus) {
        return dataStatus;
      }
    }
    return undefined;
  }
  private mapLoginErrorMessage(httpStatus?: number, rawMessage?: string): string {
    const normalizedMessage = rawMessage?.toLowerCase() || "";
    if (
      httpStatus === 401 ||
      normalizedMessage.includes("bad credentials") ||
      normalizedMessage.includes("invalid password")
    ) {
      return t("general.wrongPassword");
    }
    if (
      httpStatus === 404 ||
      normalizedMessage.includes("user not found") ||
      normalizedMessage.includes("not found with email")
    ) {
      return "Sai email";
    }
    if (
      httpStatus === 403 ||
      normalizedMessage.includes("locked") ||
      normalizedMessage.includes("disabled")
    ) {
      return t("general.accountHasBeenLocked");
    }
    if (httpStatus === 429) {
      return t("general.youHaveEnteredIncorrectlyToo");
    }
    return rawMessage || t("adminUsermanagement.hide");
  }

  /**
   * Login user through /api/auth/login.
   * Authentication decision is delegated to backend auth API.
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginPayload>> {
    // For mock mode, use mock implementation

    try {
      const { data, error } = await fetchClient.POST("/api/auth/login", {
        body: {
          email: credentials.email.trim(),
          password: credentials.password,
        },
        parseAs: "text",
      });
      if (error) {
        const httpStatus = this.extractHttpStatus(error);
        const rawErrorMessage = this.extractErrorMessage(error);
        return {
          success: false,
          error: this.mapLoginErrorMessage(httpStatus, rawErrorMessage),
        };
      }
      if (data === undefined || data === null) {
        return {
          success: false,
          error: t("general.loginDataNotReceivedFrom"),
        };
      }
      const normalizedData = this.normalizeLoginResponseData(data);
      if (typeof normalizedData === "string" && normalizedData.trim().length === 0) {
        return {
          success: false,
          error: t("general.loginDataNotReceivedFrom"),
        };
      }
      const userCandidate = this.extractUserCandidate(normalizedData);
      if (isRecord(userCandidate) && userCandidate.isActive === false) {
        return {
          success: false,
          error: t("general.accountHasBeenLocked"),
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
        error: getNormalizedErrorMessage(error, t("adminUsermanagement.hide")),
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
          error: t("general.googleLoginTokenNotFound"),
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
        error: t("general.unableToHandleGoogleLogin"),
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
    try {
      if (!isValidMajor(data.major)) {
        return {
          success: false,
          error: t("general.invalidMajor"),
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
      formData.append(
        "data",
        new Blob([JSON.stringify(userInfo)], {
          type: "application/json",
        })
      );
      const response = await fetchClient
        .POST("/api/users", {
          ...{
            headers: {
              "Content-Type": undefined,
            },
          },
          // @ts-expect-error: Backend Swagger schema mismatch
          body: formData,
        })
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));
      const backendUser = response.data as BackendUser;
      const user = this.mapUserFromUnknown(backendUser, data.email, "USER");
      if (!user) {
        return {
          success: false,
          error: t("general.unableToReadAccountInformation"),
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
        error: getNormalizedErrorMessage(error, t("adminUsermanagement.hide")),
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
      formData.append(
        "data",
        new Blob([JSON.stringify(mentorInfo)], {
          type: "application/json",
        })
      );

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
      const response = await fetchClient
        .POST("/api/mentors", {
          ...{
            headers: {
              "Content-Type": undefined, // Let axios set multipart boundary automatically
            },
          },
          // @ts-expect-error: Backend Swagger schema mismatch
          body: formData,
        })
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));
      return {
        success: true,
        data: {
          registration: {
            // @ts-expect-error: Backend Swagger schema mismatch
            id: String(response.data.id || ""),
            // @ts-expect-error: Backend Swagger schema mismatch
            fullName: response.data.name || "",
            // @ts-expect-error: Backend Swagger schema mismatch
            email: response.data.email || "",
            status: "pending",
            submittedAt: new Date().toISOString(),
            reviewedAt: null,
          },
        },
      };
    } catch (error) {
      console.error("Mentor registration error:", error);
      const response = isRecord(error) && isRecord(error.response) ? error.response : undefined;
      const status = typeof response?.status === "number" ? response.status : undefined;
      const payload = response?.data;
      const fieldErrors = extractFieldErrors(payload);
      const normalizedErrorMessage =
        extractApiErrorMessage(payload) ||
        (typeof status === "number" ? undefined : undefined) ||
        getNormalizedErrorMessage(error, "") ||
        t("general.mentorRegistrationFailedPleaseTry");
      return {
        success: false,
        error: normalizedErrorMessage,
        fieldErrors,
      };
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<ApiResponse<void>> {
    return {
      success: true,
    };
  }

  /**
   * Check mentor registration status
   */
  async checkMentorStatus(): Promise<ApiResponse<MentorRegistration>> {
    try {
      const response = await fetchClient
        // @ts-expect-error: Backend Swagger schema mismatch
        .GET("/auth/mentor-status", {})
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));
      return {
        success: true,
        // @ts-expect-error: Backend Swagger schema mismatch
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: getNormalizedErrorMessage(error, t("general.unableToCheckStatus")),
      };
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<
    ApiResponse<{
      token: string;
    }>
  > {
    try {
      const response = await fetchClient
        // @ts-expect-error: Backend Swagger schema mismatch
        .POST("/auth/refresh", {})
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));
      return {
        success: true,
        // @ts-expect-error: Backend Swagger schema mismatch
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: getNormalizedErrorMessage(error, t("general.tokenRefreshFailed")),
      };
    }
  }
}

// Export singleton instance
export const authManager = new AuthManager();
