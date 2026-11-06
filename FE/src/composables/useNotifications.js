import { ref } from 'vue';

// Shared UI feedback state, rendered by components/ui/AppFeedback.vue.
// - toasts: short-lived messages (API failures nobody caught, etc.)
// - isServerWaking: true while a request has been pending long enough that
//   the free-tier backend is probably cold-starting (see api/index.js).
export const toasts = ref([]);
export const isServerWaking = ref(false);

let nextToastId = 1;

export function pushToast(message, type = 'error', durationMs = 6000) {
  const id = nextToastId++;
  toasts.value = [...toasts.value, { id, message, type }].slice(-4);
  setTimeout(() => dismissToast(id), durationMs);
}

export function dismissToast(id) {
  toasts.value = toasts.value.filter((toast) => toast.id !== id);
}
