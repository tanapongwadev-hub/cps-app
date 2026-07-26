/**
 * Toast helpers - thin wrapper over sonner for consistent messaging
 */
import { toast } from "sonner";

export const showToast = {
  success: (message: string, description?: string) =>
    toast.success(message, description ? { description } : undefined),
  error: (message: string, description?: string) =>
    toast.error(message, description ? { description } : undefined),
  warning: (message: string, description?: string) =>
    toast.warning(message, description ? { description } : undefined),
  info: (message: string, description?: string) =>
    toast.info(message, description ? { description } : undefined),
  loading: (message: string) => toast.loading(message),
  promise: <T,>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string },
  ) => toast.promise(promise, messages),
  dismiss: (id?: string | number) => toast.dismiss(id),
};
