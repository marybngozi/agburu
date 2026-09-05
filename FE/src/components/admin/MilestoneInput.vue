<template>
  <div class="mb-6 rounded-md border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800">
    <h3 class="mb-1 text-lg text-slate-800 dark:text-slate-100">Historical Milestones & Timelines</h3>
    <p class="mb-5 text-[0.85rem] text-slate-500 dark:text-slate-400">Add key life achievements, titles, or events chronologically.</p>

    <div
      v-for="(milestone, index) in milestones"
      :key="index"
      class="mb-3 flex items-center gap-4"
    >
      <div class="flex-1">
        <input
          type="date"
          v-model="milestone.date"
          required
          class="field-input"
        />
      </div>

      <div class="flex-[3]">
        <input
          type="text"
          v-model="milestone.description"
          placeholder="e.g., Conferred with the traditional titled name..."
          required
          class="field-input"
        />
      </div>

      <button
        type="button"
        class="rounded px-3 py-2 font-bold text-red-600 bg-red-100 hover:bg-red-300"
        @click="removeRow(index)"
        title="Delete Milestone"
      >
        ✕
      </button>
    </div>

    <button
      type="button"
      class="mt-2 rounded border border-dashed border-blue-600 bg-white px-4 py-2 font-medium text-blue-600 hover:bg-blue-50 dark:border-clay-400 dark:bg-slate-900 dark:text-clay-400 dark:hover:bg-clay-950"
      @click="addRow"
    >
      + Add Milestone Row
    </button>
  </div>
</template>

<script setup>
// Using Vue 3.4+ macro for clean two-way model binding down to array objects
const milestones = defineModel({ type: Array, default: () => [] });

const addRow = () => {
  milestones.value.push({ date: '', description: '' });
};

const removeRow = (index) => {
  milestones.value.splice(index, 1);
};
</script>
