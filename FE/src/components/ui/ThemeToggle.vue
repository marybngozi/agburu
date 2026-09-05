<template>
  <button
    type="button"
    class="inline-flex h-8.6 w-8.6 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white p-0 text-[0.95rem] leading-none text-slate-900 cursor-pointer hover:bg-slate-100"
    :aria-label="
      theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
    "
    :title="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="toggleTheme"
  >
    <span aria-hidden="true">{{ theme === "dark" ? "☀️" : "🌙" }}</span>
  </button>
</template>

<script setup>
import { useTheme } from "@/composables/useTheme";

const { theme, toggleTheme } = useTheme();
</script>
