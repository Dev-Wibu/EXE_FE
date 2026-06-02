import i18n from "@/lib/i18n";
const t = i18n.t.bind(i18n);
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

import { API_ENDPOINTS, buildEndpoint } from "@/constants/api.config";
import { fetchClient } from "@/lib/api";
import { getNormalizedErrorMessage } from "@/lib/error-normalizer";
import { formatToVietnamISOString } from "@/lib/utils";

// Re-export Session type for convenience
export type { Session } from "@/interfaces";

const toFiniteInteger = (value: unknown): number | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return Math.round(parsed);
};

const toPositiveInteger = (value: unknown): number | undefined => {
  const normalized = toFiniteInteger(value);
  if (!normalized || normalized <= 0) {
    return undefined;
  }

  return normalized;
};

const toBooleanOrDefault = (value: unknown, fallback: boolean): boolean => {
  return typeof value === "boolean" ? value : fallback;
};

const toRecordingMode = (value: unknown): string => {
  return value === "local" || value === "cloud" ? value : "cloud";
};

const asNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const isLikelyHttpUrl = (value: string): boolean => {
  return /^https?:\/\//i.test(value.trim());
};

const extractCheckoutUrl = (payload: unknown): string | undefined => {
  if (typeof payload === "string") {
    return asNonEmptyString(payload);
  }

  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const record = payload as Record<string, unknown>;
  const direct =
    asNonEmptyString(record.checkoutUrl) ||
    asNonEmptyString(record.paymentUrl) ||
    asNonEmptyString(record.redirectUrl) ||
    asNonEmptyString(record.link) ||
    asNonEmptyString(record.url);

  if (direct) {
    return direct;
  }

  if (record.data !== undefined) {
    return extractCheckoutUrl(record.data);
  }

  return undefined;
};

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const normalizeDailyCoCreationRequest = (
  request?: SessionCreationRequest["dailyCoCreationRequest"]
): NonNullable<SessionCreationRequest["dailyCoCreationRequest"]> => {
  const properties = request?.properties;

  return {
    name: typeof request?.name === "string" ? request.name : "",
    privacy:
      typeof request?.privacy === "string" && request.privacy.trim().length > 0
        ? request.privacy
        : "public",
    properties: {
      max_participants: toPositiveInteger(properties?.max_participants) ?? 2,
      start_video_off: toBooleanOrDefault(properties?.start_video_off, true),
      start_audio_off: toBooleanOrDefault(properties?.start_audio_off, true),
      enable_screenshare: toBooleanOrDefault(properties?.enable_screenshare, true),
      exp: toFiniteInteger(properties?.exp) ?? 0,
      enable_recording: toRecordingMode(properties?.enable_recording),
    },
  };
};

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
  /** Planned interview duration in minutes */
  duration?: number;
  /** Planned total price for interview */
  totalPrice?: number;
}

/**
 * Join session request (matches backend schema JoinSessionDtoRequest)
 * Note: isMentor must be explicitly true or false (backend cannot deserialize null to boolean)
 */
export interface JoinSessionRequest {
  sessionName?: string;
  userId?: number;
  participantId?: string;
  isMentor: boolean;
}

export class SessionManager implements BaseManager<Session> {
  private buildPaidUpdatePayload(sessionData: Session, transactionCode?: string): Session | null {
    const userId = toPositiveInteger(sessionData.userId);
    const mentorId = toPositiveInteger(sessionData.userId2);
    const sessionId = toPositiveInteger(sessionData.id);

    if (!userId || !mentorId || !sessionId) {
      return null;
    }

    return {
      id: sessionId,
      userId,
      userId2: mentorId,
      status: "PAID",
      joinTime: asNonEmptyString(sessionData.joinTime) || formatToVietnamISOString(new Date()),
      roomName: asNonEmptyString(sessionData.roomName) || `session-${sessionId}`,
      roomUrl: asNonEmptyString(sessionData.roomUrl) || "",
      totalPrice: toFiniteInteger(sessionData.totalPrice) ?? 0,
      transactionCode:
        asNonEmptyString(transactionCode) || asNonEmptyString(sessionData.transactionCode),
    };
  }

  /**
   * Get all sessions
   * GET /api/sessions
   */
  async getAll(
    _params?: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<Session> | Session[]>> {
    try {
      const response = await fetchClient
        // @ts-expect-error: Backend Swagger schema mismatch
        .GET("/api/sessions", { params: _params })
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
        error: error instanceof Error ? error.message : t("general.unableToLoadSessionList"),
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
   * Get sessions by user ID
   * GET /api/sessions/{userId}/by-user
   */
  async getByUserId(userId: string | number): Promise<ApiResponse<Session[]>> {
    try {
      const endpoint = buildEndpoint(API_ENDPOINTS.SESSIONS.BY_USER, { userId });
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
        error: error instanceof Error ? error.message : t("general.unableToLoadUserSession"),
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
        const duration = toPositiveInteger(_data.duration);
        const totalPrice = toPositiveInteger(_data.totalPrice);

        requestData = {
          userId: toPositiveInteger(_data.userId),
          mentorId: toPositiveInteger(_data.mentorId),
          joinTime: _data.joinTime || formatToVietnamISOString(new Date()),
          dailyCoCreationRequest: normalizeDailyCoCreationRequest(_data.dailyCoCreationRequest),
          ...(duration ? { duration } : {}),
          ...(totalPrice ? { totalPrice } : {}),
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
          duration?: number;
          totalPrice?: number;
        };

        const userId = toPositiveInteger(sessionData.userId);
        const mentorId = toPositiveInteger(sessionData.userId2);

        if (!userId) {
          return {
            success: false,
            error: t("general.invalidUserId"),
          };
        }
        if (!mentorId) {
          return {
            success: false,
            error: t("general.invalidMentorId"),
          };
        }

        const duration = toPositiveInteger(sessionData.duration);
        const totalPrice = toPositiveInteger(sessionData.totalPrice);

        requestData = {
          userId,
          mentorId,
          joinTime: sessionData.joinTime || formatToVietnamISOString(new Date()),
          ...(duration ? { duration } : {}),
          ...(totalPrice ? { totalPrice } : {}),
          dailyCoCreationRequest: normalizeDailyCoCreationRequest({
            name: "",
            privacy: "public",
            properties: {
              max_participants: sessionData.max_participants,
              start_video_off: sessionData.start_video_off,
              start_audio_off: sessionData.start_audio_off,
              enable_screenshare: sessionData.enable_screenshare,
              exp: 0,
              enable_recording: sessionData.enable_recording,
            },
          }),
        };
      }

      if (!requestData.userId) {
        return {
          success: false,
          error: t("general.invalidUserId"),
        };
      }

      if (!requestData.mentorId) {
        return {
          success: false,
          error: t("general.invalidMentorId"),
        };
      }

      const response = await fetchClient
        .POST("/api/sessions/create-session", { body: requestData })
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
   * Update session
   * PUT /api/sessions (JSON body with Session object)
   */
  async update(_id: string | number, _data: Partial<Session>): Promise<ApiResponse<Session>> {
    try {
      const sessionData: Session = { ..._data, id: Number(_id) };
      const response = await fetchClient
        .PUT("/api/sessions", { body: sessionData })
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
        error: error instanceof Error ? error.message : t("general.unableToUpdateSession"),
      };
    }
  }

  /**
   * Delete session (cancel session)
   */
  async delete(_id: string | number): Promise<ApiResponse<void>> {
    try {
      const sessionData: Session = { id: Number(_id), status: "CANCELED" };
      await fetchClient.PUT("/api/sessions", { body: sessionData }).then((res) => ({
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
        error: error instanceof Error ? error.message : t("general.sessionCannotBeCanceled"),
      };
    }
  }

  /**
   * Join session
   * POST /api/sessions/join-session (JSON body with JoinSessionDtoRequest)
   */
  async joinSession(data: JoinSessionRequest): Promise<ApiResponse<void>> {
    try {
      await fetchClient.POST("/api/sessions/join-session", { body: data }).then((res) => ({
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
        error: error instanceof Error ? error.message : t("general.unableToJoinSession"),
      };
    }
  }

  /**
   * Update session status (approve/reject DRAFT sessions)
   * GET /api/sessions/update-status?sessionId=X&isApproved=Y
   */
  async updateStatus(sessionId: number, isApproved: boolean): Promise<ApiResponse<void>> {
    try {
      await fetchClient
        .GET("/api/sessions/update-status", {
          // @ts-expect-error: Backend Swagger schema mismatch
          params: { sessionId, isApproved },
        })
        .then((res) => ({
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
        error: error instanceof Error ? error.message : t("general.unableToUpdateSessionState"),
      };
    }
  }

  /**
   * Create mentor interview payment checkout URL
   * GET /api/sessions/make-payment?sessionId=X
   */
  async makePayment(sessionId: number): Promise<ApiResponse<string>> {
    try {
      const response = await fetchClient
        .GET("/api/sessions/make-payment", {
          // @ts-expect-error: Backend Swagger schema mismatch
          params: { sessionId },
        })
        .then((res) => ({
          data: res.data,
          status: res.response?.status,
          headers: res.response?.headers,
        }));

      const checkoutUrl = extractCheckoutUrl(response.data);
      if (!checkoutUrl || !isLikelyHttpUrl(checkoutUrl)) {
        return {
          success: false,
          error: getNormalizedErrorMessage(
            { data: response.data },
            t("general.theBackendDoesNotReturn")
          ),
        };
      }

      return {
        success: true,
        data: checkoutUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: getNormalizedErrorMessage(error, t("general.unableToCreateSessionPayment")),
      };
    }
  }

  /**
   * Force sync a session to PAID.
   * This is a temporary FE-side resilience path while backend has no dedicated confirm-payment endpoint.
   */
  async markSessionAsPaid(
    sessionId: number,
    transactionCode?: string
  ): Promise<ApiResponse<Session>> {
    const sessionResult = await this.getById(sessionId);
    if (!sessionResult.success || !sessionResult.data) {
      return {
        success: false,
        error: sessionResult.error || t("general.unableToLoadSessionTo"),
      };
    }

    if (sessionResult.data.status === "PAID") {
      return {
        success: true,
        data: sessionResult.data,
      };
    }

    const payload = this.buildPaidUpdatePayload(sessionResult.data, transactionCode);
    if (!payload) {
      return {
        success: false,
        error: t("general.notEnoughSessionDataTo"),
      };
    }

    try {
      const response = await fetchClient.PUT("/api/sessions", { body: payload }).then((res) => ({
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
        error:
          error instanceof Error ? error.message : t("general.unableToSynchronizeSessionState"),
      };
    }
  }

  /**
   * Retry helper for transient failures when syncing PAID status.
   */
  async markSessionAsPaidWithRetry(
    sessionId: number,
    transactionCode?: string,
    maxAttempts = 3
  ): Promise<ApiResponse<Session>> {
    const attempts = Math.max(Math.trunc(maxAttempts), 1);
    let lastError = t("general.unableToSynchronizeSessionState");

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const result = await this.markSessionAsPaid(sessionId, transactionCode);
      if (result.success) {
        return result;
      }

      lastError = result.error || lastError;

      if (attempt < attempts) {
        await sleep(attempt * 500);
      }
    }

    return {
      success: false,
      error: lastError,
    };
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
