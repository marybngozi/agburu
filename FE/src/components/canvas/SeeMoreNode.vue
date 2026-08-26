<template>
  <button
    type="button"
    class="see-more-node"
    @click="$emit('show-remaining-children', data.parentId)"
  >
    <span class="see-more-count">+{{ data.hiddenCount }}</span>
    <span class="see-more-label">See more</span>
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

<style scoped>
.see-more-node {
  width: 140px;
  height: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  background: #eff6ff;
  border: 2px dashed #93c5fd;
  border-radius: 10px;
  color: #1d4ed8;
  font:
    600 0.8rem system-ui,
    sans-serif;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}
.see-more-node:hover {
  background: #dbeafe;
  border-color: #60a5fa;
}
.see-more-count {
  font-size: 1.05rem;
  font-weight: 800;
  line-height: 1;
}
.see-more-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

[data-theme="dark"] .see-more-node {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent-strong);
}
[data-theme="dark"] .see-more-node:hover {
  background: var(--surface-hover);
  border-color: var(--accent-strong);
}
</style>
