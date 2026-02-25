import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Hook to handle mutations with automatic toast notifications
 * Catches API response messages and displays them to the user
 *
 * @example
 * const { mutate } = useMutationHandler({
 *   mutationFn: createAccount,
 *   onSuccess: () => console.log("Success"),
 *   successMessage: "Account created successfully",
 * });
 */
export function useMutationHandler<TData = unknown, TVariables = unknown, TError = Error>({
  mutationFn,
  onSuccess,
  onError,
  successMessage,
  errorMessage,
  showSuccessToast = true,
  showErrorToast = true,
  ...options
}: {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: TError, variables: TVariables) => void;
  successMessage?: string;
  errorMessage?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
} & Omit<UseMutationOptions<TData, TError, TVariables>, "mutationFn" | "onSuccess" | "onError">) {
  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      // Try to extract message from response
      let message = successMessage;
      if (!message && typeof data === "object" && data !== null) {
        const response = data as Record<string, unknown>;
        message =
          (response.message as string) ||
          (response.msg as string) ||
          "Thao tác đã hoàn tất thành công";
      }

      // Show success toast
      if (showSuccessToast && message) {
        toast.success("Thành công", {
          description: message,
        });
      }

      // Call custom success handler
      if (onSuccess) {
        onSuccess(data, variables);
      }
    },
    onError: (error: TError, variables) => {
      // Try to extract error message
      let message = errorMessage || (error as Error).message || "Đã xảy ra lỗi";

      // Try to parse error response
      try {
        const errorData = JSON.parse((error as Error).message);
        message = errorData.message || errorData.error || message;
      } catch {
        // If parsing fails, use the original error message
      }

      // Show error toast
      if (showErrorToast) {
        toast.error("Lỗi", {
          description: message,
        });
      }

      // Call custom error handler
      if (onError) {
        onError(error, variables);
      }
    },
    ...options,
  });
}
