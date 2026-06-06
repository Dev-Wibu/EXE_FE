import i18n from "@/lib/i18n";
import { beforeEach, describe, expect, it, vi } from "vitest";
const t = i18n.t.bind(i18n);

vi.mock("@/lib/api", () => ({
  fetchClient: {
    GET: vi.fn(),
    POST: vi.fn(),
    PUT: vi.fn(),
  },
}));

import { fetchClient } from "@/lib/api";
import { sessionManager } from "./session.manager";

const mockGet = fetchClient.GET as ReturnType<typeof vi.fn>;
const mockPost = fetchClient.POST as ReturnType<typeof vi.fn>;
const mockPut = fetchClient.PUT as ReturnType<typeof vi.fn>;

describe("SessionManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("returns sessions on success", async () => {
      const sessions = [{ id: 1, status: "ONGOING" }];
      mockGet.mockResolvedValueOnce({ data: sessions, error: null });

      const result = await sessionManager.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(sessions);
    });

    it("returns error on failure", async () => {
      mockGet.mockRejectedValueOnce(new Error("Network error"));

      const result = await sessionManager.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });
  });

  describe("getById", () => {
    it("returns session by id", async () => {
      const session = { id: 1, status: "ONGOING" };
      mockGet.mockResolvedValueOnce({ data: session, error: null });

      const result = await sessionManager.getById(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(session);
    });

    it("returns error on failure", async () => {
      mockGet.mockRejectedValueOnce(new Error("fail"));

      const result = await sessionManager.getById(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });
  });

  describe("getByUserId", () => {
    it("returns sessions for a user", async () => {
      const sessions = [{ id: 1 }, { id: 2 }];
      mockGet.mockResolvedValueOnce({ data: sessions, error: null });

      const result = await sessionManager.getByUserId(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(sessions);
    });

    it("returns error on failure", async () => {
      mockGet.mockRejectedValueOnce(new Error("fail"));

      const result = await sessionManager.getByUserId(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });
  });

  describe("create", () => {
    it("creates a session with SessionCreationRequest", async () => {
      const session = { id: 1, status: "PENDING" };
      mockPost.mockResolvedValueOnce({ data: session, error: null });

      const result = await sessionManager.create({
        userId: 1,
        mentorId: 2,
        dailyCoCreationRequest: {
          name: "test-room",
          privacy: "private",
          properties: {
            max_participants: 2,
            start_video_off: false,
            start_audio_off: false,
            enable_screenshare: true,
            exp: 0,
            enable_recording: "cloud",
          },
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(session);
      expect(mockPost).toHaveBeenCalledWith(
        "/api/sessions/create-session",
        expect.objectContaining({ body: expect.any(Object) })
      );
    });

    it("returns error for invalid userId in Partial<Session> path", async () => {
      const result = await sessionManager.create({
        userId: undefined,
        userId2: 2,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.invalidUserId"));
      expect(mockPost).not.toHaveBeenCalled();
    });

    it("returns error for invalid mentorId in Partial<Session> path", async () => {
      const result = await sessionManager.create({
        userId: 1,
        userId2: undefined,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.invalidMentorId"));
      expect(mockPost).not.toHaveBeenCalled();
    });

    it("returns error on POST failure", async () => {
      mockPost.mockRejectedValueOnce(new Error("Create failed"));

      const result = await sessionManager.create({
        userId: 1,
        mentorId: 2,
        dailyCoCreationRequest: {
          name: "room",
          privacy: "public",
          properties: {
            max_participants: 2,
            start_video_off: false,
            start_audio_off: false,
            enable_screenshare: false,
            exp: 0,
          },
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Create failed");
    });
  });

  describe("update", () => {
    it("sends PUT with merged session data", async () => {
      const updated = { id: 5, status: "ONGOING" };
      mockPut.mockResolvedValueOnce({ data: updated });

      const result = await sessionManager.update(5, { status: "ONGOING" });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updated);
      expect(mockPut).toHaveBeenCalledWith("/api/sessions", {
        body: { status: "ONGOING", id: 5 },
      });
    });

    it("returns error on failure", async () => {
      mockPut.mockRejectedValueOnce(new Error("Update failed"));

      const result = await sessionManager.update(1, {});

      expect(result.success).toBe(false);
      expect(result.error).toBe("Update failed");
    });
  });

  describe("delete", () => {
    it("sends PUT with REJECTED status (not DELETE)", async () => {
      mockPut.mockResolvedValueOnce({ data: null });

      const result = await sessionManager.delete(5);

      expect(result.success).toBe(true);
      expect(mockPut).toHaveBeenCalledWith("/api/sessions", {
        body: { id: 5, status: "REJECTED" },
      });
    });

    it("returns error on failure", async () => {
      mockPut.mockRejectedValueOnce(new Error("Delete failed"));

      const result = await sessionManager.delete(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Delete failed");
    });
  });

  describe("joinSession", () => {
    it("joins a session", async () => {
      mockPost.mockResolvedValueOnce({ data: null, error: null });

      const result = await sessionManager.joinSession({
        sessionName: "test-session",
        userId: 1,
        isMentor: false,
      });

      expect(result.success).toBe(true);
    });

    it("returns error on failure", async () => {
      mockPost.mockRejectedValueOnce(new Error("fail"));

      const result = await sessionManager.joinSession({
        sessionName: "test-session",
        userId: 1,
        isMentor: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });

    it("returns i18n fallback for non-Error throws", async () => {
      mockPost.mockRejectedValueOnce("string error");

      const result = await sessionManager.joinSession({
        sessionName: "test-session",
        userId: 1,
        isMentor: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.unableToJoinSession"));
    });
  });

  describe("updateStatus", () => {
    it("sends correct params for status update", async () => {
      mockGet.mockResolvedValueOnce({ data: null, error: null });

      const result = await sessionManager.updateStatus(1, true);

      expect(result.success).toBe(true);
      expect(mockGet).toHaveBeenCalledWith("/api/sessions/update-status", {
        params: { sessionId: 1, isApproved: true },
      });
    });

    it("returns error on failure", async () => {
      mockGet.mockRejectedValueOnce(new Error("fail"));

      const result = await sessionManager.updateStatus(1, false);

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });
  });

  describe("makePayment", () => {
    it("returns checkout URL on success", async () => {
      mockGet.mockResolvedValueOnce({
        data: "https://checkout.example.com/pay",
      });

      const result = await sessionManager.makePayment(42);

      expect(result.success).toBe(true);
      expect(result.data).toBe("https://checkout.example.com/pay");
    });

    it("returns error when response is not a valid URL", async () => {
      mockGet.mockResolvedValueOnce({ data: "not-a-url" });

      const result = await sessionManager.makePayment(42);

      expect(result.success).toBe(false);
      // getNormalizedErrorMessage({ data: "not-a-url" }) extracts "not-a-url" as raw message
      // and since it's not a generic message, returns it directly instead of fallback
      expect(result.error).toBe("not-a-url");
    });

    it("returns error on fetch failure", async () => {
      mockGet.mockRejectedValueOnce(new Error("Network error"));

      const result = await sessionManager.makePayment(42);

      expect(result.success).toBe(false);
      // "network error" is in GENERIC_MESSAGES, so fallback i18n message is used
      expect(result.error).toBe(t("general.unableToCreateSessionPayment"));
    });
  });

  describe("markSessionAsPaid", () => {
    it("returns session directly when already PAID", async () => {
      mockGet.mockResolvedValueOnce({
        data: { id: 1, status: "PAID" },
      });

      const result = await sessionManager.markSessionAsPaid(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 1, status: "PAID" });
      expect(mockPut).not.toHaveBeenCalled();
    });

    it("updates session to PAID when not already paid", async () => {
      // buildPaidUpdatePayload requires userId, userId2, and id
      mockGet.mockResolvedValueOnce({
        data: {
          id: 1,
          status: "PENDING",
          userId: 10,
          userId2: 20,
          joinTime: "2026-01-01T00:00:00Z",
          roomName: "test",
          totalPrice: 100,
        },
      });
      mockPut.mockResolvedValueOnce({
        data: { id: 1, status: "PAID" },
      });

      const result = await sessionManager.markSessionAsPaid(1, "TX123");

      expect(result.success).toBe(true);
      // Verify PUT payload contains PAID status and transactionCode
      expect(mockPut).toHaveBeenCalledWith("/api/sessions", {
        body: expect.objectContaining({
          id: 1,
          status: "PAID",
          userId: 10,
          userId2: 20,
          transactionCode: "TX123",
        }),
      });
    });

    it("returns error when buildPaidUpdatePayload returns null (missing fields)", async () => {
      // Session missing userId/userId2 → buildPaidUpdatePayload returns null
      mockGet.mockResolvedValueOnce({
        data: { id: 1, status: "PENDING" },
      });

      const result = await sessionManager.markSessionAsPaid(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.notEnoughSessionDataTo"));
      expect(mockPut).not.toHaveBeenCalled();
    });

    it("returns i18n fallback for non-Error throws in markSessionAsPaid", async () => {
      mockGet.mockResolvedValueOnce({
        data: {
          id: 1,
          status: "PENDING",
          userId: 10,
          userId2: 20,
          joinTime: "2026-01-01T00:00:00Z",
          roomName: "test",
          totalPrice: 100,
        },
      });
      mockPut.mockRejectedValueOnce("string error");

      const result = await sessionManager.markSessionAsPaid(1, "TX123");

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.unableToSynchronizeSessionState"));
    });

    it("returns error when getById fails", async () => {
      mockGet.mockRejectedValueOnce(new Error("Session not found"));

      const result = await sessionManager.markSessionAsPaid(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Session not found");
    });
  });

  describe("markSessionAsPaidWithRetry", () => {
    it("returns success on first attempt", async () => {
      mockGet.mockResolvedValueOnce({
        data: { id: 1, status: "PAID" },
      });

      const result = await sessionManager.markSessionAsPaidWithRetry(1);

      expect(result.success).toBe(true);
    });

    it("retries on failure and returns last error", async () => {
      mockGet.mockRejectedValue(new Error("Transient error"));

      const result = await sessionManager.markSessionAsPaidWithRetry(1, undefined, 2);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Transient error");
      expect(mockGet).toHaveBeenCalledTimes(2);
    });
  });
});
