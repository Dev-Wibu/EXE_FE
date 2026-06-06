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

import { PracticeSetManager } from "@/services/practice-set.manager";

const manager = new PracticeSetManager();

describe("PracticeSetManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAll", () => {
    it("returns practice sets on success", async () => {
      const sets = [{ id: 1, practiceSetName: "Set 1" }];
      mockApi.GET.mockResolvedValueOnce({ data: sets });

      const result = await manager.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(sets);
      expect(mockApi.GET).toHaveBeenCalledWith("/api/practice-sets", expect.any(Object));
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
      expect(result.error).toBe(t("general.unableToLoadReviewSet3"));
    });
  });

  describe("getById", () => {
    it("fetches a practice set by id", async () => {
      const set = { id: 5, practiceSetName: "Test Set" };
      mockApi.GET.mockResolvedValueOnce({ data: set });

      const result = await manager.getById(5);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(set);
    });

    it("returns error on failure", async () => {
      mockApi.GET.mockRejectedValueOnce(new Error("Not found"));

      const result = await manager.getById(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Not found");
    });
  });

  describe("getByLevel", () => {
    it("fetches practice sets by level", async () => {
      const sets = [{ id: 1, level: "FRESHER" }];
      mockApi.GET.mockResolvedValueOnce({ data: sets });

      const result = await manager.getByLevel("FRESHER");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(sets);
    });

    it("returns error on failure", async () => {
      mockApi.GET.mockRejectedValueOnce(new Error("fail"));

      const result = await manager.getByLevel("INTERN");

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });
  });

  describe("create", () => {
    it("sends payload with id:0 and practice set fields", async () => {
      const created = { id: 10, practiceSetName: "New Set", level: "JUNIOR" };
      mockApi.POST.mockResolvedValueOnce({ data: created });

      const result = await manager.create({
        practiceSetName: "New Set",
        level: "JUNIOR",
        objective: "Learn",
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(created);
      expect(mockApi.POST).toHaveBeenCalledWith("/api/practice-sets", {
        body: {
          id: 0,
          practiceSetName: "New Set",
          objective: "Learn",
          level: "JUNIOR",
          major: undefined,
        },
      });
    });

    it("returns error on failure", async () => {
      mockApi.POST.mockRejectedValueOnce(new Error("Create failed"));

      const result = await manager.create({ practiceSetName: "X", level: "INTERN" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Create failed");
    });
  });

  describe("update", () => {
    it("merges id into data and sends PUT", async () => {
      const updated = { id: 5, practiceSetName: "Updated" };
      mockApi.PUT.mockResolvedValueOnce({ data: updated });

      const result = await manager.update(5, { practiceSetName: "Updated", level: "MIDDLE" });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updated);
      expect(mockApi.PUT).toHaveBeenCalledWith("/api/practice-sets", {
        body: {
          practiceSetName: "Updated",
          level: "MIDDLE",
          id: 5,
        },
      });
    });

    it("converts string id to number", async () => {
      mockApi.PUT.mockResolvedValueOnce({ data: { id: 7 } });

      await manager.update("7", { practiceSetName: "Test", level: "FRESHER" });

      const sentBody = (mockApi.PUT.mock.calls[0]?.[1] as { body?: { id?: number } })?.body;
      expect(sentBody?.id).toBe(7);
    });

    it("returns error on failure", async () => {
      mockApi.PUT.mockRejectedValueOnce(new Error("Update failed"));

      const result = await manager.update(1, { practiceSetName: "X", level: "INTERN" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Update failed");
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

  describe("getFullSet", () => {
    it("fetches full practice set with items", async () => {
      const fullSet = {
        practiceSet: { id: 1, practiceSetName: "Full" },
        practiceSetItem: [{ id: 101 }],
      };
      mockApi.GET.mockResolvedValueOnce({ data: fullSet });

      const result = await manager.getFullSet(1);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(fullSet);
    });

    it("returns error on failure", async () => {
      mockApi.GET.mockRejectedValueOnce(new Error("fail"));

      const result = await manager.getFullSet(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });
  });

  describe("getByInterviewSession", () => {
    it("fetches practice sets by interview session id", async () => {
      const sets = [{ id: 1, interviewSessionId: 42 }];
      mockApi.GET.mockResolvedValueOnce({ data: sets });

      const result = await manager.getByInterviewSession(42);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(sets);
    });

    it("returns error on failure", async () => {
      mockApi.GET.mockRejectedValueOnce(new Error("fail"));

      const result = await manager.getByInterviewSession(42);

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });
  });

  describe("createByAI", () => {
    it("sends PracticeGenerateRequest body without userId", async () => {
      mockApi.POST.mockResolvedValueOnce({ data: { id: 1 } });

      const requestBody = { aiInterviewId: 321, dateNumber: 14 };
      const result = await manager.createByAI(requestBody);

      expect(result.success).toBe(true);
      expect(mockApi.POST).toHaveBeenCalledWith("/api/practice-sets/create-by-ai", {
        body: requestBody,
      });

      const sentBody = mockApi.POST.mock.calls[0]?.[1] as Record<string, unknown>;
      expect(sentBody).not.toHaveProperty("userId");
    });

    it("returns error on failure", async () => {
      mockApi.POST.mockRejectedValueOnce(new Error("AI failed"));

      const result = await manager.createByAI({ dateNumber: 7 });

      expect(result.success).toBe(false);
      expect(result.error).toBe("AI failed");
    });
  });

  describe("getByUser", () => {
    it("fetches practice sets by user id", async () => {
      const sets = [{ id: 1, practiceSetName: "User Set" }];
      mockApi.GET.mockResolvedValueOnce({ data: sets });

      const result = await manager.getByUser(42);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(sets);
    });

    it("returns error on failure", async () => {
      mockApi.GET.mockRejectedValueOnce(new Error("fail"));

      const result = await manager.getByUser(42);

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });
  });

  describe("createFull", () => {
    it("sends full practice set creation payload", async () => {
      const created = { id: 20, practiceSetName: "Full Set" };
      mockApi.POST.mockResolvedValueOnce({ data: created });

      const payload = {
        practiceSetName: "Full Set",
        objective: "Master JS",
        target: "JUNIOR" as const,
        majorId: 3,
        dateNumber: 14,
        questions: [
          { title: "Q1", content: "What is JS?", level: "EASY" as const, answer: "A language" },
        ],
      };

      const result = await manager.createFull(payload);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(created);
      expect(mockApi.POST).toHaveBeenCalledWith("/api/practice-sets/create-full", {
        body: payload,
      });
    });

    it("returns error on failure", async () => {
      mockApi.POST.mockRejectedValueOnce(new Error("fail"));

      const result = await manager.createFull({
        practiceSetName: "X",
        target: "INTERN",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });
  });
});
