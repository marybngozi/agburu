<template>
  <div class="canvas-viewport-wrapper">
    <header class="canvas-floating-header">
      <div class="brand-block">
        <h1>Agburu Lineage Engine</h1>
        <p>Interactive Lineage Visualization & Historical Record Tree</p>
      </div>
      <div class="header-navigation">
        <button
          @click="$router.push({ name: 'admin-dashboard' })"
          class="dashboard-shortcut-btn"
        >
          🔒 Admin Control Room
        </button>
      </div>
    </header>

    <div v-if="isLoading && nodes.length === 0" class="canvas-status-overlay">
      <div class="spinner"></div>
      <p>Assembling traditional graph matrix records...</p>
    </div>
    <div v-if="error" class="canvas-status-overlay error-theme">
      <p>⚠️ Layout Engine Alert: {{ error }}</p>
    </div>

    <div class="vue-flow-container-box">
      <VueFlow
        v-model:nodes="nodes"
        v-model:edges="edges"
        :node-types="nodeTypes"
        :fit-view-on-init="true"
        :default-edge-options="{ type: 'smoothstep' }"
        @node-click="handleNodeClick"
        position="bottom"
      >
        <template #node-custom="nodeProps">
          <CustomNode
            v-bind="nodeProps"
            @show-info="openBiographyModal"
            @expand="handleExpandBranch"
            @collapse="handleCollapseBranch"
          />
        </template>
      </VueFlow>
    </div>

    <BaseModal
      v-if="showModal"
      :active-person="selectedPerson"
      @close="closeBiographyModal"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, markRaw } from "vue";
import { VueFlow } from "@vue-flow/core";
import { useLineage } from "@/composables/useLineage";
import { api } from "@/api";

// Component layout child templates
import CustomNode from "@/components/canvas/CustomNode.vue";
import BaseModal from "@/components/ui/BaseModal.vue";

// Register the custom node design directly with Vue Flow structural interpreter
const nodeTypes = {
  custom: markRaw(CustomNode),
};

const {
  nodes,
  edges,
  isLoading,
  error,
  loadInitialTree,
  expandChildBranch,
  collapseChildBranch,
} = useLineage();

// Modal Overlay Visibility Hooks
const showModal = ref(false);
const selectedPerson = ref(null);

onMounted(async () => {
  await bootstrapLineageTree();
});

/**
 * Fetches root anchor person from Express backend
 */
const bootstrapLineageTree = async () => {
  try {
    const rootPerson = await api.getRootPerson();
    if (rootPerson && rootPerson.id) {
      await loadInitialTree(rootPerson.id);
    } else {
      error.value =
        "No active lineage records discovered. Please access the Admin dashboard to add members.";
    }
  } catch (err) {
    error.value = "API connection failed: " + err.message;
  }
};

// Event Capture Routing Handlers
const handleExpandBranch = async ({ id, childrenIds }) => {
  await expandChildBranch(id, childrenIds);
};

const handleCollapseBranch = (id) => {
  collapseChildBranch(id);
};

const openBiographyModal = (personData) => {
  selectedPerson.value = personData;
  showModal.value = true;
};

const closeBiographyModal = () => {
  selectedPerson.value = null;
  showModal.value = false;
};

// Prevent text selection bugs inside Vue Flow canvas dragging movements
const handleNodeClick = (event) => {
  event.event.preventDefault();
};
</script>

<style>
@import "@vue-flow/core/dist/style.css";
@import "@vue-flow/core/dist/theme-default.css";

.canvas-viewport-wrapper {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #f8fafc;
  font-family: system-ui, sans-serif;
}

.canvas-floating-header {
  position: absolute;
  top: 1.25rem;
  left: 1.25rem;
  right: 1.25rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border: 1px solid #e2e8f0;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.brand-block h1 {
  margin: 0;
  font-size: 1.25rem;
  color: #0f172a;
  font-weight: 700;
}
.brand-block p {
  margin: 0.15rem 0 0 0;
  font-size: 0.8rem;
  color: #64748b;
}

.dashboard-shortcut-btn {
  background-color: #0f172a;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
}
.dashboard-shortcut-btn:hover {
  background-color: #1e293b;
}

.vue-flow-container-box {
  width: 100%;
  height: 100%;
}

.canvas-status-overlay {
  position: absolute;
  inset: 0;
  background: rgba(248, 250, 252, 0.85);
  z-index: 200;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}
.canvas-status-overlay.error-theme {
  color: #dc2626;
  font-weight: 500;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #cbd5e1;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.vue-flow__edge-path {
  stroke: #cbd5e1 !important;
  stroke-width: 3.5px !important;
}
.vue-flow__edge.selected .vue-flow__edge-path {
  stroke: #3b82f6 !important;
}
</style>
