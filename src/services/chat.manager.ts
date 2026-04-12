/**
 * Chat Manager
 * Handles AI chat session and message operations
 */

import type { ApiResponse, PaginatedResponse, PaginationParams } from "@/interfaces";
import type { ChatMessage, ChatSession } from "@/mocks/chat.mock";
import type { components } from "../../schema-from-be";

import {
  API_ENDPOINTS,
  MANAGER_MODE,
  buildEndpoint,
  createApiInstance,
} from "@/constants/api.config";
import * as chatMock from "@/mocks/chat.mock";

type BackendChatMessage = components["schemas"]["ChatMessage"];
type BackendMentor = components["schemas"]["MentorResponse"];
type BackendUser = components["schemas"]["User"];

export type ChatHistoryMessage = BackendChatMessage & {
  sender?: "ai" | "user" | "me";
  sender_id?: number;
  sender_type?: string;
  time?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const mapBackendSenderToUi = (senderType?: string): "ai" | "user" => {
  const normalized = senderType?.toUpperCase();
  return normalized === "AI" ? "ai" : "user";
};

const formatTimeForUi = (timestamp?: string): string => {
  if (!timestamp) {
    return new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) {
    return timestamp;
  }

  return parsed.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export class ChatManager {
  private mode = MANAGER_MODE;
  private api = createApiInstance();

  private mapBackendMessageToUi(raw: BackendChatMessage | Record<string, unknown>): ChatMessage {
    const idValue = raw.id;
    const id =
      typeof idValue === "number" ? idValue : Date.now() + Math.floor(Math.random() * 1000);

    const senderTypeValue = raw.senderType;
    const senderType = typeof senderTypeValue === "string" ? senderTypeValue : undefined;

    const contentValue = raw.content;
    const content = typeof contentValue === "string" ? contentValue : "";

    const timestampValue = raw.timestamp;
    const timestamp = typeof timestampValue === "string" ? timestampValue : undefined;

    return {
      id,
      sender: mapBackendSenderToUi(senderType),
      content,
      time: formatTimeForUi(timestamp),
    };
  }

  private normalizeMessagesFromApi(data: unknown): ChatMessage[] {
    if (Array.isArray(data)) {
      return data.filter(isRecord).map((item) => this.mapBackendMessageToUi(item));
    }

    if (isRecord(data) && Array.isArray(data.content)) {
      return data.content.filter(isRecord).map((item) => this.mapBackendMessageToUi(item));
    }

    return [];
  }

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
      const normalizedMessages = this.normalizeMessagesFromApi(response.data);

      if (normalizedMessages.length > 0) {
        return {
          success: true,
          data: normalizedMessages,
        };
      }

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
   * Get chat history by sender/recipient identifiers according to the updated schema.
   * GET /api/messages/{currentFullId}/{recipientFullId}
   */
  async getChatHistoryByParticipants(
    currentFullId: string,
    recipientFullId: string
  ): Promise<ApiResponse<ChatHistoryMessage[]>> {
    if (this.mode === "mock") {
      const messages = await chatMock.fetchChatMessages(0);
      return {
        success: true,
        data: messages.map((message) => ({
          id: message.id,
          content: message.content,
          sender: message.sender,
          time: message.time,
        })),
      };
    }

    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.MESSAGES.HISTORY, {
        currentFullId,
        recipientFullId: recipientFullId,
      });
      const response = await this.api.get(endpoint);
      return {
        success: true,
        data: response.data, // Trả về data thô để MessengerPage tự xử lý logic Me/Other
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch chat history",
      };
    }
  }

  /**
   * Get contact list (IDs) for the current user
   * GET /api/messages/contacts?myId={id}&role={ROLE}
   */
  async getContacts(myId: number, role: string): Promise<ApiResponse<number[]>> {
    if (this.mode === "mock") {
      return {
        success: true,
        data: [1, 2, 3],
      };
    }

    try {
      const response = await this.api.get(API_ENDPOINTS.MESSAGES.CONTACTS, {
        params: { myId, role: role.toUpperCase() },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch contacts",
      };
    }
  }

  /**
   * Get all mentors
   * GET /api/mentors
   */
  async getAllMentors(): Promise<ApiResponse<BackendMentor[]>> {
    try {
      const response = await this.api.get(API_ENDPOINTS.MENTOR.LIST);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch mentors",
      };
    }
  }

  /**
   * Get mentor details
   * GET /api/mentors/{id}
   */
  async getMentorDetail(id: number): Promise<ApiResponse<BackendMentor>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.MENTOR.DETAIL, { id });
      const response = await this.api.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch mentor details",
      };
    }
  }

  /**
   * Get user details
   * GET /api/users/find-by-id/{userId}
   */
  async getUserDetail(userId: number): Promise<ApiResponse<BackendUser>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.USER.FIND_BY_ID, { userId });
      const response = await this.api.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch user details",
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
