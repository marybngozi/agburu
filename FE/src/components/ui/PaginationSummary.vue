<template>
  <p class="m-0 text-sm text-slate-500 dark:text-slate-400" aria-live="polite">
    <template v-if="total > 0">
      Showing <strong class="font-semibold text-slate-700 dark:text-slate-200">{{ from }}–{{ to }}</strong>
      of <strong class="font-semibold text-slate-700 dark:text-slate-200">{{ total }}</strong>
      {{ noun }}
    </template>
    <template v-else>No {{ noun }} to show</template>
  </p>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  page: { type: Number, required: true },
  limit: { type: Number, required: true },
  total: { type: Number, required: true },
  noun: { type: String, default: "records" },
});

const from = computed(() => (props.total ? (props.page - 1) * props.limit + 1 : 0));
const to = computed(() => Math.min(props.page * props.limit, props.total));
</script>
