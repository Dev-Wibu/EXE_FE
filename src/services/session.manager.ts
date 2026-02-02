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

import {
  API_ENDPOINTS,
  MANAGER_MODE,
  buildEndpoint,
  createApiInstance,
} from "@/constants/api.config";
import * as sessionMock from "@/mocks/sessions.mock";

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
}

/**
 * Join session request (matches backend schema JoinSessionDtoRequest)
 */
export interface JoinSessionRequest {
  sessionName?: string;
  userId?: number;
  participantId?: string;
  mentor?: boolean;
}

export class SessionManager implements BaseManager<Session> {
  private mode = MANAGER_MODE;
  private api = createApiInstance();

  /**
   * Get all sessions
   * GET /api/sessions
   */
  async getAll(
    _params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<Session> | Session[]>> {
    if (this.mode === "mock") {
      const sessions = await sessionMock.fetchSessions();
      return {
        success: true,
        data: sessions,
      };
    }

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
    if (this.mode === "mock") {
      const session = await sessionMock.fetchSession(Number(id));
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
    if (this.mode === "mock") {
      const sessions = await sessionMock.fetchSessionsByUserId(Number(userId));
      return {
        success: true,
        data: sessions,
      };
    }

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
   * Updated: Removed roomName (auto-generated), added exp, start_audio_off=true, start_video_off=true
   */
  async create(_data: Partial<Session> | SessionCreationRequest): Promise<ApiResponse<Session>> {
    if (this.mode === "mock") {
      // In mock mode, simulate creating a session with robust ID generation
      const newId = Date.now() + Math.floor(Math.random() * 1000);
      const sessionData = _data as Partial<Session>;
      const newSession: Session = {
        id: newId,
        roomName: `interview-room-${newId}`,
        userId: sessionData.userId,
        userId2: sessionData.userId2,
        status: "SCHEDULED",
        roomUrl: `https://meeting.example.com/room-${newId}`,
      };
      sessionMock.mockSessions.push(newSession);
      return {
        success: true,
        data: newSession,
      };
    }

    try {
      // According to schema, createSession is POST /api/sessions/create-session
      // with SessionCreationRequest body
      let requestData: SessionCreationRequest;

      // Type guard: check if the data has SessionCreationRequest specific property
      const isSessionCreationRequest = (data: unknown): data is SessionCreationRequest => {
        return typeof data === "object" && data !== null && "dailyCoCreationRequest" in data;
      };

      if (isSessionCreationRequest(_data)) {
        // If it's already a SessionCreationRequest
        requestData = _data;
      } else {
        // Convert from Session partial to SessionCreationRequest
        const sessionData = _data as Partial<Session> & {
          exp?: number;
          start_video_off?: boolean;
          start_audio_off?: boolean;
          max_participants?: number;
          enable_screenshare?: boolean;
        };

        // Validate required fields
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

        // Room name is auto-generated (empty string means server will generate)
        requestData = {
          userId: sessionData.userId,
          mentorId: sessionData.userId2, // userId2 is the mentor
          dailyCoCreationRequest: {
            name: "", // Auto-generated by server
            privacy: "public",
            properties: {
              max_participants: sessionData.max_participants ?? 2,
              start_video_off: sessionData.start_video_off ?? true, // Default: true
              start_audio_off: sessionData.start_audio_off ?? true, // Default: true
              enable_screenshare: sessionData.enable_screenshare ?? true,
              exp: sessionData.exp ?? 120, // Default: 120 seconds
              enable_recording: "cloud",
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
   * Note: Schema defines PUT but backend team confirmed POST should be used for updates
   */
  async update(_id: string | number, _data: Partial<Session>): Promise<ApiResponse<Session>> {
    if (this.mode === "mock") {
      // In mock mode, simulate updating a session
      const index = sessionMock.mockSessions.findIndex((s) => s.id === Number(_id));
      if (index === -1) {
        return {
          success: false,
          error: "Session not found",
        };
      }
      sessionMock.mockSessions[index] = { ...sessionMock.mockSessions[index], ..._data };
      return {
        success: true,
        data: sessionMock.mockSessions[index],
      };
    }

    try {
      // According to schema, updateSession is POST /api/sessions with JSON body
      // Note: Backend confirmed POST should be used for updates (not PUT)
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
   * Note: Sessions typically can't be deleted, only canceled via update
   */
  async delete(_id: string | number): Promise<ApiResponse<void>> {
    if (this.mode === "mock") {
      // In mock mode, simulate canceling a session
      const index = sessionMock.mockSessions.findIndex((s) => s.id === Number(_id));
      if (index === -1) {
        return {
          success: false,
          error: "Session not found",
        };
      }
      sessionMock.mockSessions[index].status = "CANCELED";
      return {
        success: true,
      };
    }

    try {
      // Cancel session by updating its status to CANCELED
      // Note: Backend confirmed POST should be used for updates (not PUT)
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
   * Used to track user joining a session (for Daily.co integration)
   */
  async joinSession(data: JoinSessionRequest): Promise<ApiResponse<void>> {
    if (this.mode === "mock") {
      // In mock mode, simulate joining a session
      console.log("Mock: User joining session", data);
      return {
        success: true,
      };
    }

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
