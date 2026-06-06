import i18n from "@/lib/i18n";
import { beforeEach, describe, expect, it, vi } from "vitest";
const t = i18n.t.bind(i18n);

vi.mock("@/lib/api", () => ({
  fetchClient: {
    GET: vi.fn(),
    POST: vi.fn(),
    PUT: vi.fn(),
    DELETE: vi.fn(),
  },
}));

vi.mock("@/lib/formatting", () => ({
  formatTime: vi.fn((d: string) => d),
}));

import { fetchClient } from "@/lib/api";
import { chatManager } from "./chat.manager";

const mockGet = fetchClient.GET as ReturnType<typeof vi.fn>;
const mockPost = fetchClient.POST as ReturnType<typeof vi.fn>;

describe("ChatManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getChatSessions", () => {
    it("returns chat sessions on success", async () => {
      const sessions = [{ id: 1, title: "Chat 1" }];
      mockGet.mockResolvedValueOnce({ data: sessions, error: null });

      const result = await chatManager.getChatSessions();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(sessions);
    });

    it("returns error on failure", async () => {
      mockGet.mockRejectedValueOnce(new Error("Network error"));

      const result = await chatManager.getChatSessions();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });
  });

  describe("getChatSession", () => {
    it("returns a single chat session", async () => {
      const session = { id: 1, title: "Chat 1" };
      mockGet.mockResolvedValueOnce({ data: session, error: null });

      const result = await chatManager.getChatSession(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(session);
    });

    it("returns error on failure", async () => {
      mockGet.mockRejectedValueOnce(new Error("Not found"));

      const result = await chatManager.getChatSession(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Not found");
    });
  });

  describe("getChatMessages", () => {
    it("normalizes array response to ChatMessage format", async () => {
      const rawMessages = [
        { id: 1, senderType: "USER", content: "Hello", timestamp: "2026-01-01T10:00:00Z" },
        { id: 2, senderType: "AI", content: "Hi there", timestamp: "2026-01-01T10:01:00Z" },
      ];
      mockGet.mockResolvedValueOnce({ data: rawMessages });

      const result = await chatManager.getChatMessages(1);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      const messages = result.data as Array<{ sender: string; content: string }>;
      // mapBackendSenderToUi: only "AI" → "ai", everything else → "user"
      expect(messages[0].sender).toBe("user");
      expect(messages[0].content).toBe("Hello");
      expect(messages[1].sender).toBe("ai");
      expect(messages[1].content).toBe("Hi there");
    });

    it("normalizes paginated response (content array)", async () => {
      const paginated = {
        content: [
          { id: 1, senderType: "USER", content: "Test", timestamp: "2026-01-01T10:00:00Z" },
        ],
        totalElements: 1,
      };
      mockGet.mockResolvedValueOnce({ data: paginated });

      const result = await chatManager.getChatMessages(1);

      expect(result.success).toBe(true);
      const messages = result.data as Array<{ content: string }>;
      expect(messages[0].content).toBe("Test");
    });

    it("returns raw data when normalization yields empty", async () => {
      mockGet.mockResolvedValueOnce({ data: null });

      const result = await chatManager.getChatMessages(1);

      expect(result.success).toBe(true);
    });

    it("returns error on failure", async () => {
      mockGet.mockRejectedValueOnce(new Error("fail"));

      const result = await chatManager.getChatMessages(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });
  });

  describe("sendMessage", () => {
    it("sends a message", async () => {
      const message = { id: 1, content: "Hello" };
      mockPost.mockResolvedValueOnce({ data: message, error: null });

      const result = await chatManager.sendMessage(1, "Hello");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(message);
    });

    it("returns error on failure", async () => {
      mockPost.mockRejectedValueOnce(new Error("Send failed"));

      const result = await chatManager.sendMessage(1, "Hello");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Send failed");
    });
  });

  describe("createChatSession", () => {
    it("creates a chat session", async () => {
      const session = { id: 1, title: "New Chat" };
      mockPost.mockResolvedValueOnce({ data: session, error: null });

      const result = await chatManager.createChatSession("New Chat");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(session);
    });

    it("returns error on failure", async () => {
      mockPost.mockRejectedValueOnce(new Error("Create failed"));

      const result = await chatManager.createChatSession("Fail");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Create failed");
    });
  });

  describe("getContacts", () => {
    it("returns contacts", async () => {
      const contacts = [1, 2, 3];
      mockGet.mockResolvedValueOnce({ data: contacts, error: null });

      const result = await chatManager.getContacts(1, "USER");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(contacts);
    });

    it("returns error on failure", async () => {
      mockGet.mockRejectedValueOnce(new Error("fail"));

      const result = await chatManager.getContacts(1, "USER");

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });
  });

  describe("getAllMentors", () => {
    it("returns all mentors", async () => {
      const mentors = [{ id: 1, name: "Mentor" }];
      mockGet.mockResolvedValueOnce({ data: mentors, error: null });

      const result = await chatManager.getAllMentors();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mentors);
    });

    it("returns error on failure", async () => {
      mockGet.mockRejectedValueOnce(new Error("fail"));

      const result = await chatManager.getAllMentors();

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });

    it("returns i18n fallback for non-Error throws", async () => {
      mockGet.mockRejectedValueOnce("string error");

      const result = await chatManager.getAllMentors();

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("common.unableToLoadMentorList"));
    });
  });

  describe("getAIResponse", () => {
    it("returns AI response on success", async () => {
      const aiMessage = { id: 1, content: "AI says hello" };
      mockPost.mockResolvedValueOnce({ data: aiMessage });

      const result = await chatManager.getAIResponse(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(aiMessage);
    });

    it("returns error on failure", async () => {
      mockPost.mockRejectedValueOnce(new Error("AI failed"));

      const result = await chatManager.getAIResponse(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("AI failed");
    });

    it("returns i18n fallback for non-Error throws", async () => {
      mockPost.mockRejectedValueOnce("string error");

      const result = await chatManager.getAIResponse(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.unableToReceiveAiResponse"));
    });
  });

  describe("deleteChatSession", () => {
    it("deletes session via POST (not DELETE)", async () => {
      mockPost.mockResolvedValueOnce({ data: null });

      const result = await chatManager.deleteChatSession(1);

      expect(result.success).toBe(true);
      expect(mockPost).toHaveBeenCalledTimes(1);
    });

    it("returns error on failure", async () => {
      mockPost.mockRejectedValueOnce(new Error("Delete failed"));

      const result = await chatManager.deleteChatSession(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Delete failed");
    });

    it("returns i18n fallback for non-Error throws", async () => {
      mockPost.mockRejectedValueOnce("string error");

      const result = await chatManager.deleteChatSession(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.cannotDeleteSession"));
    });
  });

  describe("getChatHistoryByParticipants", () => {
    it("returns chat history for participants", async () => {
      const messages = [{ id: 1, content: "hello", senderType: "USER" }];
      mockGet.mockResolvedValueOnce({ data: messages });

      const result = await chatManager.getChatHistoryByParticipants("user-1", "user-2");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(messages);
    });

    it("returns error on failure", async () => {
      mockGet.mockRejectedValueOnce(new Error("fail"));

      const result = await chatManager.getChatHistoryByParticipants("user-1", "user-2");

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });

    it("returns i18n fallback for non-Error throws", async () => {
      mockGet.mockRejectedValueOnce("string error");

      const result = await chatManager.getChatHistoryByParticipants("user-1", "user-2");

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.unableToDownloadChatHistory"));
    });
  });

  describe("getMentorDetail", () => {
    it("returns mentor detail", async () => {
      const mentor = { id: 1, name: "Mentor A" };
      mockGet.mockResolvedValueOnce({ data: mentor });

      const result = await chatManager.getMentorDetail(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mentor);
    });

    it("returns error on failure", async () => {
      mockGet.mockRejectedValueOnce(new Error("fail"));

      const result = await chatManager.getMentorDetail(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });

    it("returns i18n fallback for non-Error throws", async () => {
      mockGet.mockRejectedValueOnce("string error");

      const result = await chatManager.getMentorDetail(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.unableToDownloadMentorInformation"));
    });
  });

  describe("getUserDetail", () => {
    it("returns user detail", async () => {
      const user = { id: 1, name: "User A" };
      mockGet.mockResolvedValueOnce({ data: user });

      const result = await chatManager.getUserDetail(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(user);
    });

    it("returns error on failure", async () => {
      mockGet.mockRejectedValueOnce(new Error("fail"));

      const result = await chatManager.getUserDetail(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });

    it("returns i18n fallback for non-Error throws", async () => {
      mockGet.mockRejectedValueOnce("string error");

      const result = await chatManager.getUserDetail(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.unableToLoadUserInformation"));
    });
  });
});
