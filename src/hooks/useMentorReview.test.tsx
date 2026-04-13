import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMentorReviewsByMentor, useMentorReviewsByUser } from "./useMentorReview";

const managerMocks = vi.hoisted(() => ({
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/services/mentor-review.manager", () => ({
  mentorReviewManager: managerMocks,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useMentorReview hooks", () => {
  beforeEach(() => {
    managerMocks.getAll.mockReset();
  });

  it("filters reviews by mentor fallback from session.userId2", async () => {
    managerMocks.getAll.mockResolvedValue({
      success: true,
      data: [
        {
          id: 6,
          session: { id: 6, userId: 5, userId2: 4 },
          rating: 4,
        },
        {
          id: 7,
          session: { id: 7, userId: 8, userId2: 2 },
          rating: 5,
        },
      ],
    });

    const { result } = renderHook(() => useMentorReviewsByMentor(4), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data[0]?.id).toBe(6);
    });
  });

  it("filters reviews by user fallback from session.userId", async () => {
    managerMocks.getAll.mockResolvedValue({
      success: true,
      data: [
        {
          id: 10,
          session: { id: 10, userId: 5, userId2: 4 },
          rating: 3,
        },
        {
          id: 11,
          session: { id: 11, userId: 9, userId2: 4 },
          rating: 5,
        },
      ],
    });

    const { result } = renderHook(() => useMentorReviewsByUser(5), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data[0]?.id).toBe(10);
    });
  });
});
