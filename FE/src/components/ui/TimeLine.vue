<template>
  <div class="timeline-wrapper">
    <div v-if="sortedMilestones.length === 0" class="timeline-empty">
      No historical milestone logs cataloged for this profile record.
    </div>

    <div v-else class="timeline-track">
      <div 
        v-for="(milestone, index) in sortedMilestones" 
        :key="index" 
        class="timeline-event-node"
      >
        <div class="timeline-marker-axis">
          <div class="marker-dot"></div>
          <div v-if="index !== sortedMilestones.length - 1" class="axis-connector-line"></div>
        </div>

        <div class="timeline-event-content card-pop">
          <span class="event-timestamp-badge">{{ formatDate(milestone.date) }}</span>
          <p class="event-narrative-text">{{ milestone.description }}</p>
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

<style scoped>
.timeline-wrapper {
  padding: 0.5rem 0;
  font-family: system-ui, sans-serif;
}
.timeline-empty {
  font-style: italic;
  color: #94a3b8;
  font-size: 0.9rem;
}
.timeline-track {
  display: flex;
  flex-direction: column;
  position: relative;
}
.timeline-event-node {
  display: flex;
  gap: 1.5rem;
}
.timeline-marker-axis {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 16px;
}
.marker-dot {
  width: 14px;
  height: 14px;
  background-color: #2563eb;
  border: 3px solid #dbeafe;
  border-radius: 50%;
  z-index: 2;
}
.axis-connector-line {
  width: 3px;
  background-color: #e2e8f0;
  flex: 1;
  margin: 4px 0;
}
.timeline-event-content {
  flex: 1;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}
.event-timestamp-badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #1e40af;
  background-color: #eff6ff;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}
.event-narrative-text {
  margin: 0;
  font-size: 0.9rem;
  color: #334155;
  line-height: 1.5;
}
</style>