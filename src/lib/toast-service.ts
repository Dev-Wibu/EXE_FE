/**
 * Toast Service - Centralized toast notification management
 * Uses Sonner toast library
 */

import { toast } from "sonner";

export const ToastService = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  warning: (message: string) => toast.warning(message),
  info: (message: string) => toast.info(message),
  loading: (message: string) => toast.loading(message),
  dismiss: () => toast.dismiss(),
};
