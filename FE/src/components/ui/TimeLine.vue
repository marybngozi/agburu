<template>
  <div class="py-2 font-sans">
    <div v-if="sortedMilestones.length === 0" class="text-sm italic text-slate-400 dark:text-slate-500">
      No historical milestone logs cataloged for this profile record.
    </div>

    <div v-else class="relative flex flex-col">
      <div
        v-for="(milestone, index) in sortedMilestones"
        :key="index"
        class="flex gap-6"
      >
        <div class="relative flex w-4 flex-col items-center">
          <div class="z-2 h-3.5 w-3.5 rounded-full border-[3px] border-blue-100 bg-blue-600 dark:border-clay-900 dark:bg-clay-500"></div>
          <div v-if="index !== sortedMilestones.length - 1" class="my-1 w-0.75 flex-1 bg-slate-200 dark:bg-slate-700"></div>
        </div>

        <div class="mb-6 flex-1 rounded-lg border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
          <span class="mb-2 inline-block rounded bg-blue-50 px-2 py-0.8 text-xs font-bold text-blue-800 dark:bg-clay-900 dark:text-clay-300">{{ formatDate(milestone.date) }}</span>
          <p class="m-0 text-sm leading-relaxed text-slate-700 dark:text-slate-100">{{ milestone.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  milestones: {
    type: Array,
    required: true,
    default: () => []
  }
});

// Computes and automatically cleans/orders the dynamic milestones chronologically
const sortedMilestones = computed(() => {
  if (!props.milestones) return [];
  return [...props.milestones].sort((a, b) => new Date(a.date) - new Date(b.date));
});

const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};
</script>
