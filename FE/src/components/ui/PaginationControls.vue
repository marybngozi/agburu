<template>
  <nav
    v-if="pages > 1"
    class="flex flex-wrap items-center justify-center gap-1"
    aria-label="Pagination"
  >
    <button type="button" :class="btn" :disabled="page <= 1 || disabled" @click="go(page - 1)">
      ← Prev
    </button>
    <template v-for="(item, index) in items" :key="index">
      <span v-if="item === '…'" class="px-1 text-slate-400 dark:text-slate-500">…</span>
      <button
        v-else
        type="button"
        :disabled="disabled"
        :aria-current="item === page ? 'page' : undefined"
        :class="[
          btn,
          item === page &&
            '!border-slate-900 !bg-slate-900 !text-white dark:!border-slate-500 dark:!bg-slate-600',
        ]"
        @click="go(item)"
      >
        {{ item }}
      </button>
    </template>
    <button type="button" :class="btn" :disabled="page >= pages || disabled" @click="go(page + 1)">
      Next →
    </button>
  </nav>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  page: { type: Number, required: true },
  pages: { type: Number, required: true },
  disabled: { type: Boolean, default: false },
});
const emit = defineEmits(["update:page"]);

const btn =
  "min-w-9 cursor-pointer rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800";

const go = (target) => {
  if (target >= 1 && target <= props.pages && target !== props.page) emit("update:page", target);
};

// 1 … 4 5 [6] 7 8 … 20 — always the first, last and a window around the
// current page, with an ellipsis where numbers are skipped.
const items = computed(() => {
  const { page, pages } = props;
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const set = new Set([1, pages, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((n) => set.add(n));
  if (page >= pages - 2) [pages - 1, pages - 2, pages - 3].forEach((n) => set.add(n));
  const sorted = [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((n, i) => {
    if (i && n - sorted[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
});
</script>
