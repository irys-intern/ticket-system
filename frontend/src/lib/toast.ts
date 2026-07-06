import { toast as sonnerToast } from 'svelte-sonner';

export type ToastKind = 'success' | 'error';

const STORAGE_KEY = 'ticket-system:pending-toast';

const OUTLINE_CLASS: Record<ToastKind, string> = {
  success: '!border-2 !border-green-500',
  error: '!border-2 !border-red-500',
};

function push(kind: ToastKind, message: string) {
  sonnerToast[kind](message, { class: OUTLINE_CLASS[kind] });
}

export const toast = {
  success: (message: string) => push('success', message),
  error: (message: string) => push('error', message),
};

/** Persist a toast across a full page navigation/reload (in-memory toasts don't survive those). */
export function queueToast(kind: ToastKind, message: string) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ kind, message }));
}

/** Call once on app mount to surface a toast queued before the last navigation/reload. */
export function flushQueuedToast() {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  sessionStorage.removeItem(STORAGE_KEY);
  try {
    const { kind, message } = JSON.parse(raw);
    if (kind && message) push(kind, message);
  } catch {
    // malformed payload, ignore
  }
}
