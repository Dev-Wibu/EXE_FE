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

import { QuestionCategoryManager } from "@/services/question-category.manager";

describe("QuestionCategoryManager", () => {
  beforeEach(() => {
    mockApi.GET.mockReset();
    mockApi.POST.mockReset();
    mockApi.PUT.mockReset();
    mockApi.DELETE.mockReset();
  });

  it("maps lessonName to categoryName in getAll", async () => {
    mockApi.GET.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          lessonName: "Technical Skills",
          description: "Questions about technical knowledge",
          urlTutorial: "",
        },
      ],
    });

    const manager = new QuestionCategoryManager();
    const result = await manager.getAll();
    const firstCategory = Array.isArray(result.data) ? result.data[0] : undefined;

    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(firstCategory).toMatchObject({
      id: 1,
      categoryName: "Technical Skills",
      description: "Questions about technical knowledge",
    });
    expect(mockApi.GET).toHaveBeenCalledTimes(1);
    expect(mockApi.GET.mock.calls[0]?.[0]).toBe("/api/question-categories");
  });

  it("returns mapped category by id", async () => {
    mockApi.GET.mockResolvedValueOnce({
      data: {
        id: 1,
        lessonName: "Behavioral",
        description: "Questions about behavior",
      },
    });

    const manager = new QuestionCategoryManager();
    const result = await manager.getById(1);

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      id: 1,
      categoryName: "Behavioral",
      description: "Questions about behavior",
    });
    expect(mockApi.GET).toHaveBeenCalledWith("/api/question-categories/1", {});
  });

  it("sends backend-aligned payload when creating category", async () => {
    mockApi.POST.mockResolvedValueOnce({
      data: {
        id: 10,
        lessonName: "System Design",
        description: "Advanced topics",
        urlTutorial: "",
      },
    });

    const manager = new QuestionCategoryManager();
    const result = await manager.create({
      categoryName: "System Design",
      description: "Advanced topics",
    });

    expect(result.success).toBe(true);
    expect(mockApi.POST).toHaveBeenCalledWith("/api/question-categories", {
      body: {
        id: 0,
        lessonName: "System Design",
        description: "Advanced topics",
        urlTutorial: "",
      },
    });
  });

  it("sends backend-aligned payload when updating category", async () => {
    mockApi.PUT.mockResolvedValueOnce({
      data: {
        id: 1,
        lessonName: "Updated Category",
      },
    });

    const manager = new QuestionCategoryManager();
    const result = await manager.update(1, {
      categoryName: "Updated Category",
    });

    expect(result.success).toBe(true);
    expect(mockApi.PUT).toHaveBeenCalledWith("/api/question-categories", {
      body: {
        id: 1,
        lessonName: "Updated Category",
        description: undefined,
        urlTutorial: undefined,
      },
    });
  });

  it("calls delete endpoint with built id path", async () => {
    mockApi.DELETE.mockResolvedValueOnce({});

    const manager = new QuestionCategoryManager();
    const result = await manager.delete(1);

    expect(result.success).toBe(true);
    expect(mockApi.DELETE).toHaveBeenCalledWith("/api/question-categories/1", {});
  });

  it("returns raw data when response is not an array (paginated)", async () => {
    const paginatedData = {
      content: [{ id: 1, lessonName: "Technical", description: "Tech questions" }],
      totalElements: 1,
    };
    mockApi.GET.mockResolvedValueOnce({ data: paginatedData });

    const manager = new QuestionCategoryManager();
    const result = await manager.getAll();

    expect(result.success).toBe(true);
    // Non-array responses are returned as-is (no mapping)
    expect(result.data).toEqual(paginatedData);
  });

  it("returns error on failure", async () => {
    mockApi.GET.mockRejectedValueOnce(new Error("Network error"));

    const manager = new QuestionCategoryManager();
    const result = await manager.getAll();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Network error");
  });

  it("returns i18n fallback for non-Error throws", async () => {
    mockApi.GET.mockRejectedValueOnce("string error");

    const manager = new QuestionCategoryManager();
    const result = await manager.getAll();

    expect(result.success).toBe(false);
    expect(result.error).toBe(t("general.unableToLoadQuestionList"));
  });

  describe("getById error handling", () => {
    it("returns error on failure", async () => {
      mockApi.GET.mockRejectedValueOnce(new Error("fail"));

      const manager = new QuestionCategoryManager();
      const result = await manager.getById(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });

    it("returns i18n fallback for non-Error throws", async () => {
      mockApi.GET.mockRejectedValueOnce("string error");

      const manager = new QuestionCategoryManager();
      const result = await manager.getById(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("general.unableToLoadQuestionList"));
    });
  });

  describe("create error handling", () => {
    it("returns error on failure", async () => {
      mockApi.POST.mockRejectedValueOnce(new Error("fail"));

      const manager = new QuestionCategoryManager();
      const result = await manager.create({ categoryName: "X" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });

    it("returns i18n fallback for non-Error throws", async () => {
      mockApi.POST.mockRejectedValueOnce("string error");

      const manager = new QuestionCategoryManager();
      const result = await manager.create({ categoryName: "X" });

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("common.unableToCreateQuestionCategory"));
    });
  });

  describe("update error handling", () => {
    it("returns error on failure", async () => {
      mockApi.PUT.mockRejectedValueOnce(new Error("fail"));

      const manager = new QuestionCategoryManager();
      const result = await manager.update(1, { categoryName: "X" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });

    it("returns i18n fallback for non-Error throws", async () => {
      mockApi.PUT.mockRejectedValueOnce("string error");

      const manager = new QuestionCategoryManager();
      const result = await manager.update(1, { categoryName: "X" });

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("common.unableToUpdateQuestionList"));
    });
  });

  describe("delete error handling", () => {
    it("returns error on failure", async () => {
      mockApi.DELETE.mockRejectedValueOnce(new Error("fail"));

      const manager = new QuestionCategoryManager();
      const result = await manager.delete(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("fail");
    });

    it("returns i18n fallback for non-Error throws", async () => {
      mockApi.DELETE.mockRejectedValueOnce("string error");

      const manager = new QuestionCategoryManager();
      const result = await manager.delete(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe(t("common.cannotDeleteQuestionCategories"));
    });
  });
});
