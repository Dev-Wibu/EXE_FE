/**
 * Interview Manager
 * Handles AI and Mock Interview operations
 */

import type { ApiResponse, PaginatedResponse, PaginationParams } from "@/interfaces";
import type {
  AIInterview,
  InterviewResult,
  PaymentInfo,
  TransactionResult,
} from "@/mocks/interviews.mock";
import type {
  BookingInfo,
  InterviewType,
  MockInterview,
  MockPaymentResult,
} from "@/mocks/mentors.mock";

import {
  API_ENDPOINTS,
  MANAGER_MODE,
  buildEndpoint,
  createApiInstance,
} from "@/constants/api.config";
import * as interviewMock from "@/mocks/interviews.mock";
import * as mentorMock from "@/mocks/mentors.mock";

export class InterviewManager {
  private mode = MANAGER_MODE;
  private api = createApiInstance();

  // ============= AI Interview Methods =============

  /**
   * Get all AI interviews
   */
  async getAIInterviews(
    params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<AIInterview> | AIInterview[]>> {
    if (this.mode === "mock") {
      const interviews = await interviewMock.fetchAIInterviews();
      void params;
      return {
        success: true,
        data: interviews,
      };
    }

    try {
      const response = await this.api.get(API_ENDPOINTS.AI_INTERVIEW.LIST, { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch AI interviews",
      };
    }
  }

  /**
   * Get AI interview result by ID
   */
  async getAIInterviewResult(id: string | number): Promise<ApiResponse<InterviewResult>> {
    if (this.mode === "mock") {
      const result = await interviewMock.fetchInterviewResult(Number(id));
      return {
        success: true,
        data: result,
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.AI_INTERVIEW.RESULT, { id });
      const response = await this.api.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch interview result",
      };
    }
  }

  /**
   * Get AI interview payment info
   */
  async getAIPaymentInfo(): Promise<ApiResponse<PaymentInfo>> {
    if (this.mode === "mock") {
      const paymentInfo = await interviewMock.fetchPaymentInfo();
      return {
        success: true,
        data: paymentInfo,
      };
    }

    try {
      const response = await this.api.get(API_ENDPOINTS.AI_INTERVIEW.PAYMENT);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch payment info",
      };
    }
  }

  /**
   * Process AI interview payment
   */
  async processAIPayment(amount: number, method: string): Promise<ApiResponse<TransactionResult>> {
    if (this.mode === "mock") {
      const result = await interviewMock.simulatePayment(amount, method);
      return {
        success: result.success,
        data: result,
      };
    }

    try {
      const response = await this.api.post(API_ENDPOINTS.AI_INTERVIEW.PAYMENT, {
        amount,
        method,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Payment failed",
      };
    }
  }

  // ============= Mock Interview Methods =============

  /**
   * Get all mock interviews
   */
  async getMockInterviews(
    params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<MockInterview> | MockInterview[]>> {
    if (this.mode === "mock") {
      const interviews = await mentorMock.fetchMockInterviews();
      void params;
      return {
        success: true,
        data: interviews,
      };
    }

    try {
      const response = await this.api.get(API_ENDPOINTS.MOCK_INTERVIEW.LIST, { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch mock interviews",
      };
    }
  }

  /**
   * Get interview types
   */
  async getInterviewTypes(): Promise<ApiResponse<InterviewType[]>> {
    if (this.mode === "mock") {
      const types = await mentorMock.fetchInterviewTypes();
      return {
        success: true,
        data: types,
      };
    }

    try {
      const response = await this.api.get(API_ENDPOINTS.MOCK_INTERVIEW.TYPES);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch interview types",
      };
    }
  }

  /**
   * Get booking info
   */
  async getBookingInfo(): Promise<ApiResponse<BookingInfo>> {
    if (this.mode === "mock") {
      const bookingInfo = await mentorMock.fetchBookingInfo();
      return {
        success: true,
        data: bookingInfo,
      };
    }

    try {
      const response = await this.api.get(API_ENDPOINTS.MOCK_INTERVIEW.DETAIL);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch booking info",
      };
    }
  }

  /**
   * Process mock interview payment
   */
  async processMockPayment(
    amount: number,
    method: string
  ): Promise<ApiResponse<MockPaymentResult>> {
    if (this.mode === "mock") {
      const result = await mentorMock.simulateMockPayment(amount, method);
      return {
        success: result.success,
        data: result,
      };
    }

    try {
      const response = await this.api.post(API_ENDPOINTS.MOCK_INTERVIEW.PAYMENT, {
        amount,
        method,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Payment failed",
      };
    }
  }

  /**
   * Create mock interview booking
   */
  async createMockInterview(bookingData: Partial<BookingInfo>): Promise<ApiResponse<BookingInfo>> {
    if (this.mode === "mock") {
      void bookingData;
      return {
        success: false,
        error: "Create operation not supported in mock mode",
      };
    }

    try {
      const response = await this.api.post(API_ENDPOINTS.MOCK_INTERVIEW.CREATE, bookingData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create booking",
      };
    }
  }
}

// Export singleton instance
export const interviewManager = new InterviewManager();
