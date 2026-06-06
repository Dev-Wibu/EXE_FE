import i18n from "@/lib/i18n";
import { beforeEach, describe, expect, it, vi } from "vitest";
const t = i18n.t.bind(i18n);

const { mockApi } = vi.hoisted(() => ({
  mockApi: {
    GET: vi.fn(),
    POST: vi.fn(),
    PUT: vi.fn(),
    DELETE: vi.fn(),
  },
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    fetchClient: mockApi,
  };
});

import { QuizSetManager } from "@/services/quiz-set.manager";

const manager = new QuizSetManager();

describe("QuizSetManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("returns quiz sets on success", async () => {
      const quizzes = [{ quizId: 1, quizName: "Quiz 1" }];
      mockApi.GET.mockResolvedValueOnce({ data: quizzes });

      const result = await manager.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(quizzes);
      expect(mockApi.GET).toHaveBeenCalledWith("/api/quiz-sets", {});
    });

    it("returns error on failure", async () => {
      mockApi.GET.mockRejectedValueOnce(new Error("Network error"));

      const result = await manager.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });

    it("returns i18n fallback for non-Error throws", async () => {
      mockApi.GET.mockRejectedValueOnce("string error");

      const result = await manager.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.unableToLoadListOf1"));
    });
  });

  describe("getById", () => {
    it("fetches quiz set by id", async () => {
      const quiz = { quizId: 5, quizName: "Test Quiz" };
      mockApi.GET.mockResolvedValueOnce({ data: quiz });

      const result = await manager.getById(5);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(quiz);
    });

    it("returns error on failure", async () => {
      mockApi.GET.mockRejectedValueOnce(new Error("Not found"));

      const result = await manager.getById(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Not found");
    });
  });

  describe("create", () => {
    it("sends query params (not body) for quiz creation", async () => {
      const created = { quizId: 10, quizName: "New Quiz" };
      mockApi.POST.mockResolvedValueOnce({ data: created });

      const result = await manager.create(10, "New Quiz");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(created);
      expect(mockApi.POST).toHaveBeenCalledWith("/api/quiz-sets", {
        params: { quizId: 10, quizName: "New Quiz" },
      });
    });

    it("returns error on failure", async () => {
      mockApi.POST.mockRejectedValueOnce(new Error("Create failed"));

      const result = await manager.create(1, "Fail Quiz");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Create failed");
    });
  });

  describe("createFull", () => {
    it("sends query params AND body for full quiz creation", async () => {
      const items = [{ question: "Q1?", options: { A: "Yes", B: "No" }, correctAnswer: "A" }];
      const created = [{ id: 1, question: "Q1?" }];
      mockApi.POST.mockResolvedValueOnce({ data: created });

      const result = await manager.createFull(42, "Full Quiz", items);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(created);
      expect(mockApi.POST).toHaveBeenCalledWith("/api/quiz-sets/create-full", {
        params: { practiceSetId: 42, QuizName: "Full Quiz" },
        body: items,
      });
    });

    it("returns error on failure", async () => {
      mockApi.POST.mockRejectedValueOnce(new Error("fail"));

      const result = await manager.createFull(1, "X", []);

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });
  });

  describe("createFullAi", () => {
    it("sends only practiceSetId query param with 120s timeout", async () => {
      mockApi.POST.mockResolvedValueOnce({ data: { quizId: 99 } });

      const result = await manager.createFullAi(10);

      expect(result.success).toBe(true);
      expect(mockApi.POST).toHaveBeenCalledWith("/api/quiz-sets/create-full-ai", {
        params: { query: { practiceSetId: 10 } },
        timeout: 120000,
      });

      const requestConfig = mockApi.POST.mock.calls[0]?.[1] as {
        params?: { query?: Record<string, unknown> };
      };
      expect(requestConfig?.params?.query).not.toHaveProperty("userId");
    });

    it("returns error on failure", async () => {
      mockApi.POST.mockRejectedValueOnce(new Error("AI failed"));

      const result = await manager.createFullAi(10);

      expect(result.success).toBe(false);
      expect(result.error).toBe("AI failed");
    });
  });

  describe("submit", () => {
    it("submits answers to correct endpoint", async () => {
      const quizResult = { quizId: 5, score: 80 };
      mockApi.POST.mockResolvedValueOnce({ data: quizResult });

      const answers = { "1": "A", "2": "B", "3": "C" };
      const result = await manager.submit(5, answers);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(quizResult);
      expect(mockApi.POST).toHaveBeenCalledWith(expect.stringContaining("submit"), {
        body: answers,
      });
    });

    it("returns error on failure", async () => {
      mockApi.POST.mockRejectedValueOnce(new Error("Submit failed"));

      const result = await manager.submit(5, { "1": "A" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Submit failed");
    });
  });

  describe("getByPracticeSet", () => {
    it("fetches quiz history for a practice set", async () => {
      const quizzes = [{ quizId: 1, quizName: "History Quiz" }];
      mockApi.GET.mockResolvedValueOnce({ data: quizzes });

      const result = await manager.getByPracticeSet(42);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(quizzes);
    });

    it("returns error on failure", async () => {
      mockApi.GET.mockRejectedValueOnce(new Error("fail"));

      const result = await manager.getByPracticeSet(42);

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });
  });

  describe("delete", () => {
    it("sends DELETE to correct endpoint", async () => {
      mockApi.DELETE.mockResolvedValueOnce({ data: null });

      const result = await manager.delete(5);

      expect(result.success).toBe(true);
    });

    it("returns error on failure", async () => {
      mockApi.DELETE.mockRejectedValueOnce(new Error("Delete failed"));

      const result = await manager.delete(5);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Delete failed");
    });
  });

  describe("getQuizItems", () => {
    it("fetches quiz items by quiz set id", async () => {
      const items = [{ id: 1, question: "Q1?", options: '{"A":"Yes"}' }];
      mockApi.GET.mockResolvedValueOnce({ data: items });

      const result = await manager.getQuizItems(42);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(items);
    });

    it("returns error on failure", async () => {
      mockApi.GET.mockRejectedValueOnce(new Error("fail"));

      const result = await manager.getQuizItems(42);

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });
  });
});
