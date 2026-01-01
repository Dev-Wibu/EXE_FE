/**
 * Auth Manager
 * Handles authentication operations
 */

import type { ApiResponse } from "@/interfaces";
import type { MentorRegistration, User } from "@/mocks/auth.mock";

import { API_ENDPOINTS, MANAGER_MODE, apiConfig } from "@/constants/api.config";
import * as authMock from "@/mocks/auth.mock";
import axios from "axios";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  fullName: string;
  email: string;
  phone: string;
  birthday: string;
  password: string;
}

export interface MentorRegisterData {
  fullName: string;
  email: string;
  phone: string;
  yearsOfExperience: string;
  company: string;
  position: string;
  expertise: string;
  cvFile?: File;
  certificateFile?: File;
  idCardFile?: File;
}

export class AuthManager {
  private mode = MANAGER_MODE;
  private api = axios.create(apiConfig);

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token?: string }>> {
    if (this.mode === "mock") {
      const result = await authMock.mockLogin(credentials.email, credentials.password);
      return {
        success: result.success,
        data: result.user ? { user: result.user } : undefined,
        error: result.error,
      };
    }

    try {
      const response = await this.api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      };
    }
  }

  /**
   * Signup new user
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

    try {
      const response = await this.api.post(API_ENDPOINTS.AUTH.SIGNUP, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Signup failed",
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
