<template>
  <button
    type="button"
    class="flex h-16 w-35 cursor-pointer flex-col items-center justify-center gap-0.6 rounded-[10px] border-2 border-dashed border-blue-300 bg-blue-50 font-sans text-[0.8rem] font-semibold text-blue-700 shadow-[0_2px_6px_rgba(0,0,0,0.04)] hover:border-blue-400 hover:bg-blue-100 dark:border-blue-600 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:border-blue-400 dark:hover:bg-slate-800"
    @click="$emit('show-remaining-children', data.parentId)"
  >
    <span class="text-[1.05rem] font-extrabold leading-none">+{{ data.hiddenCount }}</span>
    <span class="text-[0.68rem] uppercase tracking-[0.04em]">See more</span>
  </button>
</template>

<script setup>
defineProps({
  data: {
    type: Object,
    required: true,
  },
});
defineEmits(["show-remaining-children"]);
</script>
