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

      <button
        v-if="data.partnerIds && data.partnerIds.length"
        type="button"
        class="action-btn spouse-btn"
        @click="toggleSpouseDrawer"
      >
        ♡ Spouse{{ data.partnerIds.length > 1 ? 's' : '' }} ({{ data.partnerIds.length }})
      </button>
    </div>

    <div v-if="showSpouseDrawer" class="spouse-drawer-panel">
      <div class="drawer-header"><span>Spouse{{ data.partnerIds.length > 1 ? 's' : '' }}</span><button @click="showSpouseDrawer = false">×</button></div>
      <div class="spouse-list-scroller"><SpouseOverlay :partner-ids="data.partnerIds" @show-info="$emit('show-info', $event)" /></div>
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

defineEmits(['show-info']);
const showSpouseDrawer = ref(false);
const toggleSpouseDrawer = () => { showSpouseDrawer.value = !showSpouseDrawer.value; };

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

.spouse-btn { color: #9d174d; background: #fce7f3; }
.spouse-btn:hover { background: #fbcfe8; }

.spouse-drawer-panel { position:absolute; top:10px; left:calc(100% + 35px); width:220px; padding:.65rem; background:#fffdfb; border:2px solid #db2777; border-radius:9px; box-shadow:0 12px 24px rgba(131,24,67,.15); z-index:50; }
.spouse-drawer-panel::before { content:''; position:absolute; top:48px; right:100%; width:35px; border-top:3px solid #db2777; }
.drawer-header { display:flex; justify-content:space-between; align-items:center; padding-bottom:.45rem; border-bottom:1px solid #fce7f3; color:#9d174d; font-size:.75rem; font-weight:700; }
.drawer-header button { border:0; background:none; color:#9d174d; cursor:pointer; font-size:1.25rem; line-height:1; }
.spouse-list-scroller { max-height:180px; overflow-y:auto; padding-top:.5rem; }

/* Only the top/right/bottom border switches to the theme border color here.
   Leaving border-left-color alone matters: .male/.female/.other set the
   6px gender-colored LEFT border above, and both rules share the same
   specificity (two classes / class+attribute), so whichever is declared
   later in the file wins the cascade. A plain `border-color` here used to
   win and silently overwrite the left edge back to the neutral theme
   color too, which is why the blue/pink gender accent disappeared in dark
   mode. */
[data-theme="dark"] .custom-lineage-node {
  background: var(--surface);
  border-top-color: var(--border);
  border-right-color: var(--border);
  border-bottom-color: var(--border);
}
[data-theme="dark"] .node-avatar {
  border-color: var(--surface-hover);
  background: var(--surface-hover);
}
[data-theme="dark"] .person-name {
  color: var(--text);
}
[data-theme="dark"] .node-actions {
  border-top-color: var(--border);
}
[data-theme="dark"] .info-btn {
  color: var(--text-muted);
  background: var(--surface-hover);
}
[data-theme="dark"] .info-btn:hover {
  background: var(--border);
}
[data-theme="dark"] .spouse-drawer-panel {
  background: var(--surface);
  border-color: #db2777;
}
[data-theme="dark"] .drawer-header {
  border-bottom-color: var(--border);
}
</style>
