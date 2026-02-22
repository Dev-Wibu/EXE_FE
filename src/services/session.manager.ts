/**
 * Session Manager
 * Handles session CRUD operations for admin management
 * Based on schema-from-be.d.ts API specification
 */

import type {
  ApiResponse,
  BaseManager,
  PaginatedResponse,
  PaginationParams,
  Session,
} from "@/interfaces";

import { API_ENDPOINTS, buildEndpoint, createApiInstance } from "@/constants/api.config";

// Re-export Session type for convenience
export type { Session } from "@/interfaces";

/**
 * Session creation request (matches backend schema)
 */
export interface SessionCreationRequest {
  dailyCoCreationRequest?: {
    name?: string;
    privacy?: string;
    properties?: {
      max_participants?: number;
      start_video_off?: boolean;
      start_audio_off?: boolean;
      enable_screenshare?: boolean;
      exp?: number;
      enable_recording?: string;
    };
  };
  userId?: number;
  mentorId?: number;
  /** Meeting start time (ISO date-time string) */
  joinTime?: string;
}

/**
 * Join session request (matches backend schema JoinSessionDtoRequest)
 * Note: mentor must be explicitly true or false (backend cannot deserialize null to boolean)
 */
export interface JoinSessionRequest {
  sessionName?: string;
  userId?: number;
  participantId?: string;
  mentor: boolean;
}

export class SessionManager implements BaseManager<Session> {
  private api = createApiInstance();

  /**
   * Get all sessions
   * GET /api/sessions
   */
  async getAll(
    _params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<Session> | Session[]>> {
    try {
      const response = await this.api.get(API_ENDPOINTS.SESSIONS.LIST, { params: _params });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch sessions",
      };
    }
  }

  /**
   * Get session by ID
   * GET /api/sessions/{id}
   */
  async getById(id: string | number): Promise<ApiResponse<Session>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.SESSIONS.DETAIL, { id });
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
   * Get sessions by user ID
   * GET /api/sessions/{userId}/by-user
   */
  async getByUserId(userId: string | number): Promise<ApiResponse<Session[]>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.SESSIONS.BY_USER, { userId });
      const response = await this.api.get(endpoint);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch user sessions",
      };
    }
  }

  /**
   * Create new session
   * POST /api/sessions/create-session (JSON body with SessionCreationRequest)
   */
  async create(_data: Partial<Session> | SessionCreationRequest): Promise<ApiResponse<Session>> {
    try {
      let requestData: SessionCreationRequest;

      // Type guard: check if the data has SessionCreationRequest specific property
      const isSessionCreationRequest = (data: unknown): data is SessionCreationRequest => {
        return typeof data === "object" && data !== null && "dailyCoCreationRequest" in data;
      };

      if (isSessionCreationRequest(_data)) {
        requestData = {
          ..._data,
          joinTime: _data.joinTime || new Date().toISOString(),
        };
      } else {
        // Convert from Session partial to SessionCreationRequest
        const sessionData = _data as Partial<Session> & {
          start_video_off?: boolean;
          start_audio_off?: boolean;
          max_participants?: number;
          enable_screenshare?: boolean;
          joinTime?: string;
          enable_recording?: string;
        };

        if (!sessionData.userId) {
          return {
            success: false,
            error: "User ID is required to create a session",
          };
        }
        if (!sessionData.userId2) {
          return {
            success: false,
            error: "Mentor ID is required to create a session",
          };
        }

        requestData = {
          userId: sessionData.userId,
          mentorId: sessionData.userId2,
          joinTime: sessionData.joinTime || new Date().toISOString(),
          dailyCoCreationRequest: {
            name: "",
            privacy: "public",
            properties: {
              max_participants: sessionData.max_participants ?? 2,
              start_video_off: sessionData.start_video_off ?? true,
              start_audio_off: sessionData.start_audio_off ?? true,
              enable_screenshare: sessionData.enable_screenshare ?? true,
              exp: 0,
              enable_recording: sessionData.enable_recording ?? "cloud",
            },
          },
        };
      }

      const response = await this.api.post(API_ENDPOINTS.SESSIONS.CREATE, requestData);
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
   * Update session
   * POST /api/sessions (JSON body with Session object)
   * Note: Backend team confirmed POST should be used for updates
   */
  async update(_id: string | number, _data: Partial<Session>): Promise<ApiResponse<Session>> {
    try {
      const sessionData: Session = { ..._data, id: Number(_id) };
      const response = await this.api.post(API_ENDPOINTS.SESSIONS.UPDATE, sessionData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update session",
      };
    }
  }

  /**
   * Delete session (cancel session)
   */
  async delete(_id: string | number): Promise<ApiResponse<void>> {
    try {
      const sessionData: Session = { id: Number(_id), status: "CANCELED" };
      await this.api.post(API_ENDPOINTS.SESSIONS.UPDATE, sessionData);
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to cancel session",
      };
    }
  }

  /**
   * Join session
   * POST /api/sessions/join-session (JSON body with JoinSessionDtoRequest)
   */
  async joinSession(data: JoinSessionRequest): Promise<ApiResponse<void>> {
    try {
      await this.api.post(API_ENDPOINTS.SESSIONS.JOIN, data);
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to join session",
      };
    }
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
