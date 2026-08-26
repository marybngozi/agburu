<template>
  <button
    type="button"
    class="theme-toggle"
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

<style scoped>
.theme-toggle {
  width: 2.15rem;
  height: 2.15rem;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid var(--border, #e5e7eb);
  background: var(--surface, #fff);
  color: var(--text, #111827);
  cursor: pointer;
  font-size: 0.95rem;
  line-height: 1;
  padding: 0;
}
.theme-toggle:hover {
  background: var(--surface-hover, #f3f4f6);
}
</style>
