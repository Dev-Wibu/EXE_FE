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

import { PracticeSetManager } from "@/services/practice-set.manager";

describe("PracticeSetManager createByAI", () => {
  beforeEach(() => {
    mockApi.POST.mockReset();
  });

  it("sends PracticeGenerateRequest body without userId", async () => {
    mockApi.POST.mockResolvedValueOnce({
      data: {
        id: 1,
      },
    });

    const manager = new PracticeSetManager();
    const requestBody = {
      aiInterviewId: 321,
      dateNumber: 14,
    };

    const result = await manager.createByAI(requestBody);

    expect(result.success).toBe(true);
    expect(mockApi.POST).toHaveBeenCalledTimes(1);
    expect(mockApi.POST).toHaveBeenCalledWith("/api/practice-sets/create-by-ai", {
      body: requestBody,
    });

    const sentBody = mockApi.POST.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(sentBody).not.toHaveProperty("userId");
  });
});
