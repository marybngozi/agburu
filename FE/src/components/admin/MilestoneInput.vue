<template>
  <div class="milestones-section">
    <h3>Historical Milestones & Timelines</h3>
    <p class="description">Add key life achievements, titles, or events chronologically.</p>

    <div 
      v-for="(milestone, index) in milestones" 
      :key="index" 
      class="milestone-row"
    >
      <div class="input-group date-input">
        <input 
          type="date" 
          v-model="milestone.date" 
          required 
        />
      </div>

      <div class="input-group text-input">
        <input 
          type="text" 
          v-model="milestone.description" 
          placeholder="e.g., Conferred with the traditional titled name..." 
          required 
        />
      </div>

      <button 
        type="button" 
        class="delete-btn" 
        @click="removeRow(index)"
        title="Delete Milestone"
      >
        ✕
      </button>
    </div>

    <button 
      type="button" 
      class="add-btn" 
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

<style scoped>
.milestones-section {
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  border-radius: 6px;
  background-color: #f9fafb;
  margin-bottom: 1.5rem;
}
h3 {
  margin: 0 0 0.25rem 0;
  color: #1f2937;
  font-size: 1.1rem;
}
.description {
  margin: 0 0 1.25rem 0;
  color: #6b7280;
  font-size: 0.85rem;
}
.milestone-row {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 0.75rem;
}
.input-group input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  box-sizing: border-box;
}
.date-input {
  flex: 1;
}
.text-input {
  flex: 3;
}
.delete-btn {
  background: #fee2e2;
  color: #dc2626;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}
.delete-btn:hover {
  background: #fca5a5;
}
.add-btn {
  background: white;
  border: 1px dashed #2563eb;
  color: #2563eb;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  margin-top: 0.5rem;
}
.add-btn:hover {
  background: #eff6ff;
}
</style>