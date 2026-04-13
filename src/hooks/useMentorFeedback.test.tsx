import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMentorFeedbacksByMentor, useMentorFeedbacksByUser } from "./useMentorFeedback";

const managerMocks = vi.hoisted(() => ({
  getAll: vi.fn(),
  getById: vi.fn(),
  getByMentorId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/services/mentor-feedback.manager", () => ({
  mentorFeedbackManager: managerMocks,
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

describe("useMentorFeedback hooks", () => {
  beforeEach(() => {
    managerMocks.getAll.mockReset();
    managerMocks.getByMentorId.mockReset();
  });

  it("filters feedbacks by user fallback from session.userId", async () => {
    managerMocks.getAll.mockResolvedValue({
      success: true,
      data: [
        {
          id: 20,
          session: { id: 20, userId: 5, userId2: 4 },
          rating: 4,
          comment: "Rất hữu ích",
        },
        {
          id: 21,
          session: { id: 21, userId: 8, userId2: 4 },
          rating: 5,
          comment: "Tuyệt vời",
        },
      ],
    });

    const { result } = renderHook(() => useMentorFeedbacksByUser(5), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1);
      expect(result.current.data[0]?.id).toBe(20);
    });
  });

  it("sanitizes mentor scope even when backend returns mixed mentor IDs", async () => {
    managerMocks.getByMentorId.mockResolvedValue({
      success: true,
      data: [
        {
          id: 30,
          session: { id: 30, userId: 5, userId2: 4 },
          rating: 5,
          comment: "Đúng mentor",
        },
        {
          id: 31,
          session: { id: 31, userId: 6, userId2: 2 },
          rating: 2,
          comment: "Sai mentor",
        },
      ],
    });

    const { result } = renderHook(() => useMentorFeedbacksByMentor(4), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data ?? []).toHaveLength(1);
      expect(result.current.data?.[0]?.id).toBe(30);
    });
  });
});
