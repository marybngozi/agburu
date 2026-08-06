<template>
  <div class="custom-lineage-node" :class="[data.gender, { 'expanded': data.isExpanded }]">
    <!-- Node Content Area -->
    <div class="node-body">
      <img 
        :src="data.profilePicture || 'https://placehold.co/100x100?text=No+Photo'" 
        alt="Avatar" 
        class="node-avatar"
      />
      
      <div class="node-info">
        <div class="titles">
          <span v-if="data.title" class="title-civil">{{ data.title }}</span>
          <span v-if="data.titledName" class="title-native">{{ data.titledName }}</span>
        </div>
        <div class="person-name">{{ data.name }}</div>
      </div>
    </div>

    <!-- Interactive Action Footer Inside Node Box -->
    <div class="node-actions">
      <!-- Info Button: Opens Quick Bio Popup Summary Modal -->
      <button 
        type="button" 
        class="action-btn info-btn" 
        @click="$emit('show-info', data)"
        title="View Summary Biography"
      >
        ℹ️ Info
      </button>

      <!-- Spouse Button: Toggles horizontal side panel slider -->
      <button 
        v-if="data.partnerIds && data.partnerIds.length" 
        type="button" 
        class="action-btn spouse-btn"
        @click="toggleSpouseDrawer"
      >
        👥 Spouses ({{ data.partnerIds.length }})
      </button>

      <!-- Lazy Loading Structural Dynamic Expand/Collapse Toggle Button -->
      <button 
        v-if="data.childrenIds && data.childrenIds.length"
        type="button" 
        class="action-btn expand-btn"
        :class="{ 'collapse-style': data.isExpanded }"
        @click="handleExpandClick"
      >
        {{ data.isExpanded ? '− Collapse' : '+ Expand' }}
      </button>
    </div>

    <!-- Wives/Spouses Embedded Lateral Slider Drawer (Keeps main canvas vertical lines tidy) -->
    <div v-if="showSpouseDrawer" class="spouse-drawer-panel">
      <div class="drawer-header">
        <span>Linked Spouses</span>
        <span @click="showSpouseDrawer = false" class="close-x">✕</span>
      </div>
      <div class="spouse-list-scroller">
        <SpouseOverlay :partner-ids="data.partnerIds" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import SpouseOverlay from '@/components/canvas/SpouseOverlay.vue';

// props passed automatically by Vue Flow mapping layout core engines
const props = defineProps({
  data: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['show-info', 'expand', 'collapse']);

const showSpouseDrawer = ref(false);

const toggleSpouseDrawer = () => {
  showSpouseDrawer.value = !showSpouseDrawer.value;
};

const handleExpandClick = () => {
  if (props.data.isExpanded) {
    emit('collapse', props.data.id);
  } else {
    emit('expand', { id: props.data.id, childrenIds: props.data.childrenIds });
  }
};
</script>

<style scoped>
.custom-lineage-node {
  background: white;
  border-radius: 8px;
  border: 2px solid #d1d5db;
  padding: 0.75rem;
  width: 260px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  font-family: system-ui, sans-serif;
  position: relative;
  box-sizing: border-box;
}

/* Subtle gender coloring highlights */
.custom-lineage-node.male { border-left: 6px solid #2563eb; }
.custom-lineage-node.female { border-left: 6px solid #ec4899; }
.custom-lineage-node.other { border-left: 6px solid #9ca3af; }

.custom-lineage-node.expanded {
  box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.1), 0 4px 6px -2px rgba(37, 99, 235, 0.05);
}

.node-body {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 0.75rem;
}

.node-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #f3f4f6;
  background: #f3f4f6;
}

.node-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  flex: 1;
  overflow: hidden;
}

.titles {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.title-civil {
  background: #e0f2fe;
  color: #0369a1;
  font-size: 0.65rem;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-weight: 600;
}

.title-native {
  background: #fef3c7;
  color: #b45309;
  font-size: 0.65rem;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-weight: 600;
}

.person-name {
  font-weight: 600;
  color: #111827;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Action Utility Bar inside Node box */
.node-actions {
  display: flex;
  border-top: 1px solid #f3f4f6;
  padding-top: 0.5rem;
  gap: 0.35rem;
  justify-content: space-between;
}

.action-btn {
  background: none;
  border: none;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.25rem 0.4rem;
  border-radius: 4px;
}

.info-btn { color: #4b5563; background: #f3f4f6; }
.info-btn:hover { background: #e5e7eb; }

.spouse-btn { color: #047857; background: #dcfce7; }
.spouse-btn:hover { background: #bbf7d0; }

.expand-btn { color: #1d4ed8; background: #eff6ff; margin-left: auto; }
.expand-btn:hover { background: #dbeafe; }
.collapse-style { color: #b91c1c; background: #fee2e2; }
.collapse-style:hover { background: #fca5a5; }

/* Lateral Side Slider Spouses Pop-Drawer */
.spouse-drawer-panel {
  position: absolute;
  top: 0;
  left: 102%; /* Pops out horizontally straight to the right */
  width: 220px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 50;
  padding: 0.5rem;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 0.25rem;
  margin-bottom: 0.4rem;
}

.close-x {
  cursor: pointer;
  color: #9ca3af;
}
.close-x:hover { color: #EF4444; }

.spouse-list-scroller {
  max-height: 180px;
  overflow-y: auto;
}
</style>