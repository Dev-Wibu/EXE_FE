import { beforeEach, describe, expect, it, vi } from "vitest";

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
    expect(mockApi.GET).toHaveBeenCalledWith("/api/question-categories/1");
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
    expect(mockApi.DELETE).toHaveBeenCalledWith("/api/question-categories/1");
  });

  it("returns error response when request fails", async () => {
    mockApi.GET.mockRejectedValueOnce(new Error("Not found"));

    const manager = new QuestionCategoryManager();
    const result = await manager.getById(999);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Not found");
  });
});
