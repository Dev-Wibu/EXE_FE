import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/error-normalizer", () => ({
  getNormalizedErrorMessage: vi.fn((_error: unknown, fallback: string) => fallback),
}));

import { toast } from "sonner";
import { useMutationHandler } from "./useMutationHandler";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useMutationHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls mutationFn and shows success toast with response message", async () => {
    const mutationFn = vi.fn().mockResolvedValue({ message: "Created" });
    const { result } = renderHook(
      () =>
        useMutationHandler({
          mutationFn,
        }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutateAsync({});
    });

    expect(mutationFn).toHaveBeenCalled();
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ description: "Created" })
      );
    });
  });

  it("extracts message from data.msg when message is absent", async () => {
    const mutationFn = vi.fn().mockResolvedValue({ msg: "Done via msg" });
    const { result } = renderHook(() => useMutationHandler({ mutationFn }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutateAsync({});
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ description: "Done via msg" })
      );
    });
  });

  it("falls back to i18n default when data has no message/msg", async () => {
    const mutationFn = vi.fn().mockResolvedValue({ id: 1 });
    const { result } = renderHook(() => useMutationHandler({ mutationFn }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutateAsync({});
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ description: expect.any(String) })
      );
    });
  });

  it("does not show toast when data is not an object (no message extractable)", async () => {
    const mutationFn = vi.fn().mockResolvedValue("plain string" as unknown);
    const { result } = renderHook(() => useMutationHandler({ mutationFn }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutateAsync({});
    });

    await waitFor(() => {
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  it("does not show toast when message extraction yields no message", async () => {
    const mutationFn = vi.fn().mockResolvedValue(null as unknown);
    const { result } = renderHook(
      () => useMutationHandler({ mutationFn, showSuccessToast: true }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutateAsync({});
    });

    // data is null → typeof null !== 'object' branch, message stays undefined → no toast
    await waitFor(() => {
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  it("uses custom successMessage", async () => {
    const mutationFn = vi.fn().mockResolvedValue({});
    const { result } = renderHook(
      () =>
        useMutationHandler({
          mutationFn,
          successMessage: "Custom success",
        }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutateAsync({});
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ description: "Custom success" })
      );
    });
  });

  it("shows error toast on failure with normalized error message", async () => {
    const mutationFn = vi.fn().mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(
      () =>
        useMutationHandler({
          mutationFn,
        }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      try {
        await result.current.mutateAsync({});
      } catch {
        // expected
      }
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ description: expect.any(String) })
      );
    });
  });

  it("passes custom errorMessage to error normalizer", async () => {
    const { getNormalizedErrorMessage } = await import("@/lib/error-normalizer");
    const mutationFn = vi.fn().mockRejectedValue(new Error("fail"));
    const { result } = renderHook(
      () => useMutationHandler({ mutationFn, errorMessage: "Custom error" }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      try {
        await result.current.mutateAsync({});
      } catch {
        // expected
      }
    });

    await waitFor(() => {
      expect(getNormalizedErrorMessage).toHaveBeenCalledWith(expect.any(Error), "Custom error");
    });
  });

  it("calls onSuccess callback", async () => {
    const onSuccess = vi.fn();
    const mutationFn = vi.fn().mockResolvedValue({ id: 1 });
    const { result } = renderHook(
      () =>
        useMutationHandler({
          mutationFn,
          onSuccess,
        }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.mutateAsync("test-var");
    });

    expect(onSuccess).toHaveBeenCalledWith({ id: 1 }, "test-var");
  });

  it("calls onError callback", async () => {
    const onError = vi.fn();
    const error = new Error("fail");
    const mutationFn = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(
      () =>
        useMutationHandler({
          mutationFn,
          onError,
        }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      try {
        await result.current.mutateAsync("var");
      } catch {
        // expected
      }
    });

    expect(onError).toHaveBeenCalledWith(error, "var");
  });

  it("skips success toast when showSuccessToast is false", async () => {
    const mutationFn = vi.fn().mockResolvedValue({});
    const { result } = renderHook(
      () =>
        useMutationHandler({
          mutationFn,
          showSuccessToast: false,
        }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.mutateAsync({});
    });

    expect(toast.success).not.toHaveBeenCalled();
  });

  it("skips error toast when showErrorToast is false", async () => {
    const mutationFn = vi.fn().mockRejectedValue(new Error("fail"));
    const { result } = renderHook(
      () =>
        useMutationHandler({
          mutationFn,
          showErrorToast: false,
        }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      try {
        await result.current.mutateAsync({});
      } catch {
        // expected
      }
    });

    expect(toast.error).not.toHaveBeenCalled();
  });

  it("falls back to i18n default when response message is empty string", async () => {
    const mutationFn = vi.fn().mockResolvedValue({ message: "" });
    const { result } = renderHook(() => useMutationHandler({ mutationFn }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({});
    });

    // Empty string is falsy → falls through to i18n default
    expect(toast.success).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ description: expect.any(String) })
    );
  });

  it("fires both toast AND onSuccess callback together", async () => {
    const onSuccess = vi.fn();
    const mutationFn = vi.fn().mockResolvedValue({ message: "Done" });
    const { result } = renderHook(() => useMutationHandler({ mutationFn, onSuccess }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ id: 1 });
    });

    // Both should fire
    expect(toast.success).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith({ message: "Done" }, { id: 1 });
  });

  it("fires both toast AND onError callback together", async () => {
    const onError = vi.fn();
    const error = new Error("fail");
    const mutationFn = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(() => useMutationHandler({ mutationFn, onError }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync("var");
      } catch {
        // expected
      }
    });

    expect(toast.error).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(error, "var");
  });

  it("calls onSuccess callback even when showSuccessToast is false", async () => {
    const onSuccess = vi.fn();
    const mutationFn = vi.fn().mockResolvedValue({ message: "Created" });
    const { result } = renderHook(
      () =>
        useMutationHandler({
          mutationFn,
          onSuccess,
          showSuccessToast: false,
        }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      await result.current.mutateAsync("test-data");
    });

    expect(toast.success).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith({ message: "Created" }, "test-data");
  });

  it("calls onError callback even when showErrorToast is false", async () => {
    const onError = vi.fn();
    const error = new Error("fail");
    const mutationFn = vi.fn().mockRejectedValue(error);
    const { result } = renderHook(
      () =>
        useMutationHandler({
          mutationFn,
          onError,
          showErrorToast: false,
        }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      try {
        await result.current.mutateAsync("var");
      } catch {
        // expected
      }
    });

    expect(toast.error).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(error, "var");
  });

  it("does not show toast for void mutation (undefined return)", async () => {
    const mutationFn = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useMutationHandler({ mutationFn }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({});
    });

    // undefined is not typeof 'object' → message stays undefined → no toast
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("prefers response.message over response.msg when both present", async () => {
    const mutationFn = vi.fn().mockResolvedValue({ message: "Primary", msg: "Secondary" });
    const { result } = renderHook(() => useMutationHandler({ mutationFn }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({});
    });

    expect(toast.success).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ description: "Primary" })
    );
  });

  it("passes through useMutation options like onMutate", async () => {
    const onMutate = vi.fn().mockReturnValue({ snapshot: true });
    const mutationFn = vi.fn().mockResolvedValue({ id: 1 });
    const { result } = renderHook(() => useMutationHandler({ mutationFn, onMutate }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync("test");
    });

    // React Query passes (variables, context) to onMutate
    expect(onMutate).toHaveBeenCalledWith("test", expect.any(Object));
  });
});
