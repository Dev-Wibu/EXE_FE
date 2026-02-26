/**
 * Chat Manager
 * Handles AI chat session and message operations
 */

import type { ApiResponse, PaginatedResponse, PaginationParams } from "@/interfaces";
import type { ChatMessage, ChatSession } from "@/mocks/chat.mock";

import {
  API_ENDPOINTS,
  MANAGER_MODE,
  buildEndpoint,
  createApiInstance,
} from "@/constants/api.config";
import * as chatMock from "@/mocks/chat.mock";

export class ChatManager {
  private mode = MANAGER_MODE;
  private api = createApiInstance();

  /**
   * Get all chat sessions
   */
  async getChatSessions(
    params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<ChatSession> | ChatSession[]>> {
    if (this.mode === "mock") {
      const sessions = await chatMock.fetchChatSessions();
      void params;
      return {
        success: true,
        data: sessions,
      };
    }

    try {
      const response = await this.api.get(API_ENDPOINTS.CHAT.SESSIONS, { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch chat sessions",
      };
    }
  }

  /**
   * Get chat session by ID
   */
  async getChatSession(sessionId: number): Promise<ApiResponse<ChatSession>> {
    if (this.mode === "mock") {
      const session = await chatMock.fetchChatSession(sessionId);
      if (!session) {
        return {
          success: false,
          error: "Session not found",
        };
      }
      return {
        success: true,
        data: session,
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.CHAT.SESSION_DETAIL, { id: sessionId });
      const response = await this.api.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch session",
      };
    }
  }

  /**
   * Get messages for a chat session
   */
  async getChatMessages(
    sessionId: number,
    params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<ChatMessage> | ChatMessage[]>> {
    if (this.mode === "mock") {
      const messages = await chatMock.fetchChatMessages(sessionId);
      void params;
      return {
        success: true,
        data: messages,
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.CHAT.MESSAGES, { id: sessionId });
      const response = await this.api.get(endpoint, { params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch messages",
      };
    }
  }

  /**
   * Send a message in a chat session
   */
  async sendMessage(sessionId: number, content: string): Promise<ApiResponse<ChatMessage>> {
    if (this.mode === "mock") {
      const message = await chatMock.sendChatMessage(sessionId, content);
      return {
        success: true,
        data: message,
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.CHAT.SEND_MESSAGE, { id: sessionId });
      const response = await this.api.post(endpoint, { content });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send message",
      };
    }
  }

  /**
   * Get AI response for a chat session
   */
  async getAIResponse(sessionId: number): Promise<ApiResponse<ChatMessage>> {
    if (this.mode === "mock") {
      const response = await chatMock.getAIResponse(sessionId);
      return {
        success: true,
        data: response,
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.CHAT.AI_RESPONSE, { id: sessionId });
      const response = await this.api.post(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get AI response",
      };
    }
  }

  /**
   * Create a new chat session
   */
  async createChatSession(title: string): Promise<ApiResponse<ChatSession>> {
    if (this.mode === "mock") {
      const session = await chatMock.createNewChatSession(title);
      return {
        success: true,
        data: session,
      };
    }

    try {
      const response = await this.api.post(API_ENDPOINTS.CHAT.CREATE_SESSION, { title });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create session",
      };
    }
  }

  /**
   * Delete a chat session
   */
  async deleteChatSession(sessionId: number): Promise<ApiResponse<void>> {
    if (this.mode === "mock") {
      void sessionId;
      return {
        success: false,
        error: "Delete operation not supported in mock mode",
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.CHAT.SESSION_DETAIL, { id: sessionId });
      await this.api.post(endpoint);
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete session",
      };
    }
  }
}

// Export singleton instance
export const chatManager = new ChatManager();
