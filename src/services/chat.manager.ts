import i18n from "@/lib/i18n";
const t = i18n.t.bind(i18n);
/**
 * Chat Manager
 * Handles AI chat session and message operations
 */

import { API_ENDPOINTS, buildEndpoint } from "@/constants/api.config";
import type { ApiResponse, PaginatedResponse, PaginationParams } from "@/interfaces";
import { fetchClient } from "@/lib/api";
import { formatTime } from "@/lib/formatting";
import type { components } from "../../schema-from-be";

export interface ChatSession {
  id: number;
  title: string;
  lastMessage: string;
  lastMessageTime: string;
}
export interface ChatMessage {
  id: number;
  sender: "ai" | "user";
  content: string;
  time: string;
}
type BackendChatMessage = components["schemas"]["ChatMessage"];
type BackendMentor = components["schemas"]["MentorResponse"];
type BackendUserResponse = components["schemas"]["UserResponse"];
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
    return formatTime(new Date());
  }
  return formatTime(timestamp, timestamp);
};
export class ChatManager {
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
    try {
      const response = await fetchClient
        .GET(
          // @ts-expect-error: Backend Swagger schema mismatch
          "/api/chat/sessions",
          {
            params,
          }
        )
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
        error: error instanceof Error ? error.message : t("general.unableToLoadChatSession"),
      };
    }
  }

  /**
   * Get chat session by ID
   */
  async getChatSession(sessionId: number): Promise<ApiResponse<ChatSession>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.CHAT.SESSION_DETAIL, {
        id: sessionId,
      });
      // @ts-expect-error: Backend Swagger schema mismatch
      const response = await fetchClient.GET(endpoint, {}).then((res) => ({
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
        error: error instanceof Error ? error.message : t("general.sessionCouldNotBeLoaded"),
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
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.CHAT.MESSAGES, {
        id: sessionId,
      });
      const response = await fetchClient
        .GET(
          // @ts-expect-error: Backend Swagger schema mismatch
          endpoint,
          {
            params,
          }
        )
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));
      const normalizedMessages = this.normalizeMessagesFromApi(response.data);
      if (normalizedMessages.length > 0) {
        return {
          success: true,
          data: normalizedMessages,
        };
      }
      return {
        success: true,
        // @ts-expect-error: Backend Swagger schema mismatch
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToDownloadMessage"),
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
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.MESSAGES.HISTORY, {
        currentFullId,
        recipientFullId: recipientFullId,
      });
      // @ts-expect-error: Backend Swagger schema mismatch
      const response = await fetchClient.GET(endpoint, {}).then((res) => ({
        data: res.data,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      return {
        success: true,
        // @ts-expect-error: Backend Swagger schema mismatch
        data: response.data, // Trả về data thô để MessengerPage tự xử lý logic Me/Other
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToDownloadChatHistory"),
      };
    }
  }

  /**
   * Get contact list (IDs) for the current user
   * GET /api/messages/contacts?myId={id}&role={ROLE}
   */
  async getContacts(myId: number, role: string): Promise<ApiResponse<number[]>> {
    try {
      const response = await fetchClient
        .GET("/api/messages/contacts", {
          params: {
            query: {
              myId,
              role: role.toUpperCase() as "MENTOR" | "ADMIN" | "STAFF" | "USER",
            },
          },
        })
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.unableToLoadContacts"),
      };
    }
  }

  /**
   * Get all mentors
   * GET /api/mentors
   */
  async getAllMentors(): Promise<ApiResponse<BackendMentor[]>> {
    try {
      const response = await fetchClient.GET("/api/mentors", {}).then((res) => ({
        data: res.data,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("common.unableToLoadMentorList"),
      };
    }
  }

  /**
   * Get mentor details
   * GET /api/mentors/{id}
   */
  async getMentorDetail(id: number): Promise<ApiResponse<BackendMentor>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.MENTOR.DETAIL, {
        id,
      });
      // @ts-expect-error: Backend Swagger schema mismatch
      const response = await fetchClient.GET(endpoint, {}).then((res) => ({
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
        error:
          error instanceof Error ? error.message : t("general.unableToDownloadMentorInformation"),
      };
    }
  }

  /**
   * Get user details
   * GET /api/users/find-by-id/{userId}
   */
  async getUserDetail(userId: number): Promise<ApiResponse<BackendUserResponse>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.USER.FIND_BY_ID, {
        userId,
      });
      // @ts-expect-error: Backend Swagger schema mismatch
      const response = await fetchClient.GET(endpoint, {}).then((res) => ({
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
        error: error instanceof Error ? error.message : t("general.unableToLoadUserInformation"),
      };
    }
  }

  /**
   * Send a message in a chat session
   */
  async sendMessage(sessionId: number, content: string): Promise<ApiResponse<ChatMessage>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.CHAT.SEND_MESSAGE, {
        id: sessionId,
      });
      const response = await fetchClient
        .POST(
          // @ts-expect-error: Backend Swagger schema mismatch
          endpoint,
          {
            body: {
              content,
            },
          }
        )
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
        error: error instanceof Error ? error.message : t("general.cannotSendMessage"),
      };
    }
  }

  /**
   * Get AI response for a chat session
   */
  async getAIResponse(sessionId: number): Promise<ApiResponse<ChatMessage>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.CHAT.AI_RESPONSE, {
        id: sessionId,
      });
      // @ts-expect-error: Backend Swagger schema mismatch
      const response = await fetchClient.POST(endpoint, {}).then((res) => ({
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
        error: error instanceof Error ? error.message : t("general.unableToReceiveAiResponse"),
      };
    }
  }

  /**
   * Create a new chat session
   */
  async createChatSession(title: string): Promise<ApiResponse<ChatSession>> {
    try {
      const response = await fetchClient
        .POST(
          // @ts-expect-error: Backend Swagger schema mismatch
          "/api/chat/sessions",
          {
            body: {
              title,
            },
          }
        )
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
        error: error instanceof Error ? error.message : t("general.unableToCreateSession"),
      };
    }
  }

  /**
   * Delete a chat session
   */
  async deleteChatSession(sessionId: number): Promise<ApiResponse<void>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.CHAT.SESSION_DETAIL, {
        id: sessionId,
      });
      // @ts-expect-error: Backend Swagger schema mismatch
      await fetchClient.POST(endpoint, {}).then((res) => ({
        data: res.data,
        status: res.response?.status,
        headers: res.response?.headers,
      }));
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t("general.cannotDeleteSession"),
      };
    }
  }
}

// Export singleton instance
export const chatManager = new ChatManager();
