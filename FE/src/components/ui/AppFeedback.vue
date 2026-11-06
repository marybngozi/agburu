<template>
  <!-- Rendered once from App.vue. -->
  <div
    v-if="isServerWaking"
    role="status"
    class="fixed inset-x-0 top-0 z-[2000] bg-clay-600 px-4 py-2 text-center font-sans text-sm font-semibold text-white"
  >
    Waking the server up — the first request after a quiet spell can take up to a minute. Thanks for your patience.
  </div>
  <div class="pointer-events-none fixed right-4 bottom-4 z-[2000] flex w-[min(92vw,22rem)] flex-col gap-2 font-sans">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      role="alert"
      :class="[
        'pointer-events-auto flex items-start justify-between gap-3 rounded-lg px-4 py-3 text-sm shadow-lg',
        toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-forest-900 text-white',
      ]"
    >
      <span>{{ toast.message }}</span>
      <button type="button" class="cursor-pointer border-none bg-transparent p-0 text-white/80 hover:text-white" aria-label="Dismiss" @click="dismissToast(toast.id)">✕</button>
    </div>
  </div>
</template>

<script setup>
import { dismissToast, isServerWaking, toasts } from "@/composables/useNotifications";
</script>
