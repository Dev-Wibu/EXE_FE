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

import { QuizSetManager } from "@/services/quiz-set.manager";

describe("QuizSetManager createFullAi", () => {
  beforeEach(() => {
    mockApi.POST.mockReset();
  });

  it("sends only practiceSetId query param", async () => {
    mockApi.POST.mockResolvedValueOnce({
      data: {
        quizId: 99,
      },
    });

    const manager = new QuizSetManager();
    const result = await manager.createFullAi(10);

    expect(result.success).toBe(true);
    expect(mockApi.POST).toHaveBeenCalledTimes(1);
    expect(mockApi.POST).toHaveBeenCalledWith(
      "/api/quiz-sets/create-full-ai",
      expect.objectContaining({
        params: {
          practiceSetId: 10,
        },
        timeout: 120000,
      })
    );

    const requestConfig = mockApi.POST.mock.calls[0]?.[1] as { params?: Record<string, unknown> };
    expect(requestConfig?.params).not.toHaveProperty("userId");
  });
});
