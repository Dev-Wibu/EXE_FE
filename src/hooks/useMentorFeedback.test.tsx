import i18n from "@/lib/i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
const t = i18n.t.bind(i18n);

import {
  calculateAverageFeedbackRating,
  useCreateMentorFeedback,
  useDeleteMentorFeedback,
  useMentorFeedbackById,
  useMentorFeedbackBySession,
  useMentorFeedbacks,
  useMentorFeedbacksByMentor,
  useMentorFeedbacksByUser,
  useUpdateMentorFeedback,
} from "./useMentorFeedback";

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

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const normalizerMocks = vi.hoisted(() => ({
  getNormalizedErrorMessage: vi.fn((_error: unknown, fallback?: string) => fallback ?? "Error"),
}));

vi.mock("@/lib/error-normalizer", () => ({
  getNormalizedErrorMessage: normalizerMocks.getNormalizedErrorMessage,
}));

let queryClient: QueryClient;

const createWrapper = () => {
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper, queryClient };
};

describe("useMentorFeedback hooks", () => {
  beforeEach(() => {
    managerMocks.getAll.mockReset();
    managerMocks.getById.mockReset();
    managerMocks.getByMentorId.mockReset();
    managerMocks.create.mockReset();
    managerMocks.update.mockReset();
    managerMocks.delete.mockReset();
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.error).mockClear();
    normalizerMocks.getNormalizedErrorMessage.mockClear();
  });

  describe("useMentorFeedbacks (all)", () => {
    it("returns array data directly", async () => {
      managerMocks.getAll.mockResolvedValue({
        success: true,
        data: [{ id: 1, session: { id: 1, userId: 5, userId2: 4 }, rating: 4 }],
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useMentorFeedbacks(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.data).toHaveLength(1);
      });
    });

    it("extracts items from paginated response", async () => {
      managerMocks.getAll.mockResolvedValue({
        success: true,
        data: {
          items: [
            { id: 1, session: { id: 1, userId: 5, userId2: 4 }, rating: 4 },
            { id: 2, session: { id: 2, userId: 6, userId2: 3 }, rating: 5 },
          ],
        },
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useMentorFeedbacks(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.data).toHaveLength(2);
      });
    });

    it("returns empty array on failure", async () => {
      managerMocks.getAll.mockResolvedValue({
        success: false,
        error: "fail",
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useMentorFeedbacks(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.data).toEqual([]);
      });
    });

    it("returns empty array when data is non-array non-paginated object", async () => {
      managerMocks.getAll.mockResolvedValue({
        success: true,
        data: { total: 10, page: 1 } as unknown as never,
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useMentorFeedbacks(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.data).toEqual([]);
      });
    });

    it("returns empty array when success is true but data is null", async () => {
      managerMocks.getAll.mockResolvedValue({
        success: true,
        data: null,
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useMentorFeedbacks(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.data).toEqual([]);
      });
    });
  });

  describe("useMentorFeedbackById", () => {
    it("returns feedback by ID", async () => {
      managerMocks.getById.mockResolvedValue({
        success: true,
        data: { id: 10, rating: 5, comment: "Great" },
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useMentorFeedbackById(10), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.data?.id).toBe(10);
      });
    });

    it("throws when not found", async () => {
      managerMocks.getById.mockResolvedValue({
        success: false,
        error: "Not found",
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useMentorFeedbackById(999), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe("useMentorFeedbacksByUser", () => {
    it("filters feedbacks by user fallback from session.userId", async () => {
      managerMocks.getAll.mockResolvedValue({
        success: true,
        data: [
          {
            id: 20,
            session: { id: 20, userId: 5, userId2: 4 },
            rating: 4,
            comment: t("general.veryHelpful"),
          },
          {
            id: 21,
            session: { id: 21, userId: 8, userId2: 4 },
            rating: 5,
            comment: t("general.great"),
          },
        ],
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useMentorFeedbacksByUser(5), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.data).toHaveLength(1);
        expect(result.current.data[0]?.id).toBe(20);
      });
    });

    it("uses user.id when available (primary path)", async () => {
      managerMocks.getAll.mockResolvedValue({
        success: true,
        data: [
          {
            id: 30,
            user: { id: 42 },
            session: { id: 30, userId: 99, userId2: 4 },
            rating: 5,
          },
        ],
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useMentorFeedbacksByUser(42), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.data).toHaveLength(1);
      });
    });

    it("returns empty array when userId is 0", async () => {
      managerMocks.getAll.mockResolvedValue({
        success: true,
        data: [{ id: 1, session: { id: 1, userId: 5, userId2: 4 }, rating: 4 }],
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useMentorFeedbacksByUser(0), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.data).toEqual([]);
      });
    });
  });

  describe("useMentorFeedbacksByMentor", () => {
    it("sanitizes mentor scope even when backend returns mixed mentor IDs", async () => {
      managerMocks.getByMentorId.mockResolvedValue({
        success: true,
        data: [
          {
            id: 30,
            session: { id: 30, userId: 5, userId2: 4 },
            rating: 5,
            comment: t("general.theRightMentor"),
          },
          {
            id: 31,
            session: { id: 31, userId: 6, userId2: 2 },
            rating: 2,
            comment: "Sai mentor",
          },
        ],
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useMentorFeedbacksByMentor(4), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.data ?? []).toHaveLength(1);
        expect(result.current.data?.[0]?.id).toBe(30);
      });
    });

    it("uses mentor.id when available (primary path)", async () => {
      managerMocks.getByMentorId.mockResolvedValue({
        success: true,
        data: [
          {
            id: 40,
            mentor: { id: 4 },
            session: { id: 40, userId: 5, userId2: 99 },
            rating: 4,
          },
        ],
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useMentorFeedbacksByMentor(4), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.data).toHaveLength(1);
      });
    });

    it("returns empty array when mentorId is 0 (query disabled)", async () => {
      managerMocks.getByMentorId.mockResolvedValue({
        success: true,
        data: [{ id: 1, session: { id: 1, userId: 5, userId2: 4 }, rating: 4 }],
      });

      const { wrapper } = createWrapper();
      renderHook(() => useMentorFeedbacksByMentor(0), {
        wrapper,
      });

      // enabled: !!mentorId → query is disabled, getByMentorId should not be called
      expect(managerMocks.getByMentorId).not.toHaveBeenCalled();
    });
  });

  describe("useMentorFeedbackBySession", () => {
    it("finds feedback by session ID", async () => {
      managerMocks.getAll.mockResolvedValue({
        success: true,
        data: [
          { id: 1, session: { id: 100, userId: 5, userId2: 4 }, rating: 3 },
          { id: 2, session: { id: 200, userId: 6, userId2: 3 }, rating: 5 },
        ],
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useMentorFeedbackBySession(200), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.data?.id).toBe(2);
      });
    });

    it("returns undefined when sessionId is 0", async () => {
      managerMocks.getAll.mockResolvedValue({
        success: true,
        data: [{ id: 1, session: { id: 100, userId: 5, userId2: 4 }, rating: 3 }],
      });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useMentorFeedbackBySession(0), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.data).toBeUndefined();
      });
    });
  });

  describe("useCreateMentorFeedback", () => {
    it("creates feedback and invalidates queries", async () => {
      managerMocks.create.mockResolvedValue({ success: true, data: { id: 1 } });

      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useCreateMentorFeedback(), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({
          sessionId: 1,
          rating: 5,
          comment: "Great",
        });
      });

      expect(managerMocks.create).toHaveBeenCalledWith({
        sessionId: 1,
        rating: 5,
        comment: "Great",
      });
      expect(toast.success).toHaveBeenCalledWith(i18n.t("general.responseSentSuccessfully"));
      expect(invalidateSpy).toHaveBeenCalled();
    });

    it("shows error toast on failure", async () => {
      managerMocks.create.mockResolvedValue({ success: false, error: "Cannot create" });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useCreateMentorFeedback(), {
        wrapper,
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            sessionId: 1,
            rating: 5,
            comment: "test",
          });
        } catch {
          // Expected
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
      expect(toast.error).toHaveBeenCalledWith(i18n.t("general.unableToCreateResponse"));
    });
  });

  describe("useUpdateMentorFeedback", () => {
    it("updates feedback successfully", async () => {
      managerMocks.update.mockResolvedValue({ success: true, data: { id: 1 } });

      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useUpdateMentorFeedback(), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync({
          id: 1,
          data: { rating: 4, comment: "Updated" },
        });
      });

      expect(managerMocks.update).toHaveBeenCalledWith(1, {
        rating: 4,
        comment: "Updated",
      });
      expect(toast.success).toHaveBeenCalledWith(i18n.t("general.responseUpdatedSuccessfully"));
      // Update invalidates both the all-queries key AND the by-id key
      expect(invalidateSpy).toHaveBeenCalledTimes(2);
    });

    it("shows error toast on failure", async () => {
      managerMocks.update.mockResolvedValue({ success: false, error: "Cannot update" });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useUpdateMentorFeedback(), {
        wrapper,
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            id: 1,
            data: { rating: 3, comment: "fail" },
          });
        } catch {
          // Expected
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
      expect(toast.error).toHaveBeenCalledWith(i18n.t("general.unableToUpdateResponse"));
    });
  });

  describe("useDeleteMentorFeedback", () => {
    it("deletes feedback successfully", async () => {
      managerMocks.delete.mockResolvedValue({ success: true });

      const { wrapper, queryClient } = createWrapper();
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const { result } = renderHook(() => useDeleteMentorFeedback(), {
        wrapper,
      });

      await act(async () => {
        await result.current.mutateAsync(1);
      });

      expect(managerMocks.delete).toHaveBeenCalledWith(1);
      expect(toast.success).toHaveBeenCalledWith(i18n.t("common.responseRemoved"));
      expect(invalidateSpy).toHaveBeenCalled();
    });

    it("shows error toast on failure", async () => {
      managerMocks.delete.mockResolvedValue({ success: false, error: "Cannot delete" });

      const { wrapper } = createWrapper();
      const { result } = renderHook(() => useDeleteMentorFeedback(), {
        wrapper,
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(1);
        } catch {
          // Expected
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
      expect(toast.error).toHaveBeenCalledWith(i18n.t("general.responseCannotBeDeleted"));
    });
  });

  describe("calculateAverageFeedbackRating", () => {
    it("returns 0 for empty array", () => {
      expect(calculateAverageFeedbackRating([])).toBe(0);
    });

    it("calculates average correctly", () => {
      const feedbacks = [
        { id: 1, rating: 4 } as unknown as Parameters<typeof calculateAverageFeedbackRating>[0][0],
        { id: 2, rating: 5 } as unknown as Parameters<typeof calculateAverageFeedbackRating>[0][0],
        { id: 3, rating: 3 } as unknown as Parameters<typeof calculateAverageFeedbackRating>[0][0],
      ];
      expect(calculateAverageFeedbackRating(feedbacks)).toBe(4);
    });

    it("treats missing rating as 0", () => {
      const feedbacks = [
        { id: 1 } as unknown as Parameters<typeof calculateAverageFeedbackRating>[0][0],
        { id: 2, rating: 4 } as unknown as Parameters<typeof calculateAverageFeedbackRating>[0][0],
      ];
      expect(calculateAverageFeedbackRating(feedbacks)).toBe(2);
    });
  });
});
