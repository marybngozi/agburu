<template>
  <div class="profile-page-viewport">
    <nav class="profile-top-navigation">
      <button @click="$router.push('/')" class="nav-back-anchor">← Main Lineage Graph</button>
      <div v-if="person" class="nav-breadcrumbs">
        Directory / Profile Workspace / <strong>{{ person.name }}</strong>
      </div>
    </nav>

    <div v-if="isLoading" class="loading-workspace-state">
      <div class="spinner"></div>
      <p>Retrieving extended historical file logs...</p>
    </div>

    <div v-else-if="person" class="profile-split-workspace">
      <aside class="biographical-dossier-panel">
        <div class="dossier-identity-card">
          <img 
            :src="person.profilePicture || 'https://placehold.co/150x150?text=No+Photo'" 
            alt="Profile Picture" 
            class="dossier-avatar"
          />
          <div class="identity-meta">
            <div class="title-cluster">
              <span v-if="person.title" class="civic-tag">{{ person.title }}</span>
              <span v-if="person.titledName" class="traditional-tag">{{ person.titledName }}</span>
            </div>
            <h2>{{ person.name }}</h2>
            <p class="lifespan-span">
              ⏳ {{ formatYear(person.birthDate) }} — 
              {{ person.deathDate ? formatYear(person.deathDate) : 'Present (Alive)' }}
            </p>
          </div>
        </div>

        <div class="biographical-prose-block">
          <h3>Detailed Historical Record</h3>
          <p v-if="person.detailedBiography" class="prose-paragraph">
            {{ person.detailedBiography }}
          </p>
          <p v-else class="prose-paragraph generic-fallback">
            No deeply structured narrative biography text has been logged for this profile record yet.
          </p>
        </div>

        <hr class="panel-section-divider" />

        <div class="historical-timeline-container">
          <h3>Historical Journey Logs</h3>
          <TimeLine :milestones="person.milestones" />
        </div>
      </aside>

      <main class="focused-lineage-canvas-viewport">
        <div class="canvas-panel-header">
          <div class="canvas-headline">
            <h3>Focused Family Tree Stream</h3>
            <p>Tracing lineage relationships branching dynamically directly from this member node.</p>
          </div>
          
          <div class="traversal-toggle-switch">
            <button 
              :class="{ 'active-mode': canvasMode === 'descendants' }" 
              @click="switchCanvasOrientation('descendants')"
            >
              Descendants (Forward Tree)
            </button>
            <button 
              :class="{ 'active-mode': canvasMode === 'ancestors' }" 
              @click="switchCanvasOrientation('ancestors')"
            >
              Ancestors (Backward Tree)
            </button>
          </div>
        </div>

        <div class="embedded-graph-enclosure">
          <VueFlow
            v-model:nodes="nodes"
            v-model:edges="edges"
            :node-types="nodeTypes"
            :fit-view-on-init="true"
          >
            <template #node-custom="nodeProps">
              <CustomNode 
                v-bind="nodeProps" 
                @show-info="hotReloadWorkspaceId"
                @expand="handleExpandBranch"
                @collapse="handleCollapseBranch"
              />
            </template>
          </VueFlow>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, markRaw } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { VueFlow } from '@vue-flow/core';
import { api } from '@/api';
import { useLineage } from '@/composables/useLineage';

import TimeLine from '@/components/ui/TimeLine.vue';
import CustomNode from '@/components/canvas/CustomNode.vue';

const route = useRoute();
const router = useRouter();

const person = ref(null);
const isLoading = ref(true);
const canvasMode = ref('descendants');

const nodeTypes = { custom: markRaw(CustomNode) };

const { nodes, edges, loadInitialTree, expandChildBranch, collapseChildBranch } = useLineage();

onMounted(async () => {
  await loadWorkspaceProfile(route.params.id);
});

watch(() => route.params.id, async (nextId) => {
  if (nextId) {
    await loadWorkspaceProfile(nextId);
  }
});

const loadWorkspaceProfile = async (id) => {
  isLoading.value = true;
  try {
    const data = await api.getPersonById(id);
    if (data && !data.isDeleted) {
      person.value = data;
      canvasMode.value = 'descendants';
      await loadInitialTree(id);
    } else {
      router.push('/');
    }
  } catch (err) {
    console.error("Dossier retrieval crashed", err);
    router.push('/');
  } finally {
    isLoading.value = false;
  }
};

const switchCanvasOrientation = async (mode) => {
  canvasMode.value = mode;
  if (mode === 'descendants') {
    await loadInitialTree(person.value.id);
  } else {
    await traceAncestorsLineageTree();
  }
};

const traceAncestorsLineageTree = async () => {
  const localNodes = [{
    id: person.value.id,
    type: 'custom',
    data: { ...person.value, isExpanded: false }
  }];
  const localEdges = [];

  let currentParentId = person.value.parentId;
  let targetChildId = person.value.id;

  let depthTracker = 0;
  while (currentParentId && depthTracker < 3) {
    try {
      const pData = await api.getPersonById(currentParentId);
      if (pData && !pData.isDeleted) {
        localNodes.push({
          id: pData.id,
          type: 'custom',
          data: { ...pData, isExpanded: true }
        });
        localEdges.push({
          id: `e-${pData.id}-${targetChildId}`,
          source: pData.id,
          target: targetChildId,
          type: 'smoothstep'
        });
        targetChildId = pData.id;
        currentParentId = pData.parentId;
        depthTracker++;
      } else {
        break;
      }
    } catch (err) {
      break;
    }
  }

  nodes.value = localNodes; 
  edges.value = localEdges;
};

const handleExpandBranch = async (args) => await expandChildBranch(args.id, args.childrenIds);
const handleCollapseBranch = (id) => collapseChildBranch(id);

const hotReloadWorkspaceId = (personProps) => {
  router.push({ name: 'profile', params: { id: personProps.id } });
};

const formatYear = (dateStr) => dateStr ? new Date(dateStr).getFullYear() : '???';
</script>

<style scoped>
.profile-page-viewport {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #f1f5f9;
  font-family: system-ui, sans-serif;
}
.profile-top-navigation {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  z-index: 10;
}
.nav-back-anchor {
  background: none;
  border: 1px solid #cbd5e1;
  padding: 0.4rem 0.85rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  color: #334155;
}
.nav-back-anchor:hover { background-color: #f8fafc; }
.nav-breadcrumbs { font-size: 0.85rem; color: #64748b; }

.profile-split-workspace {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.biographical-dossier-panel {
  width: 380px;
  background: white;
  border-right: 1px solid #e2e8f0;
  overflow-y: auto;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  box-sizing: border-box;
}
.dossier-identity-card { display: flex; gap: 1rem; align-items: center; }
.dossier-avatar { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid #e2e8f0; }
.identity-meta h2 { margin: 0.25rem 0 0 0; font-size: 1.35rem; color: #0f172a; }
.lifespan-span { margin: 0.15rem 0 0 0; font-size: 0.8rem; color: #64748b; font-weight: 500; }
.title-cluster { display: flex; gap: 0.25rem; }
.civic-tag { background: #e0f2fe; color: #0369a1; font-size: 0.6rem; padding: 0.1rem 0.3rem; border-radius: 3px; font-weight: 600; }
.traditional-tag { background: #fef3c7; color: #b45309; font-size: 0.6rem; padding: 0.1rem 0.3rem; border-radius: 3px; font-weight: 600; }

.biographical-prose-block h3, .historical-timeline-container h3 { margin: 0 0 0.75rem 0; font-size: 1rem; color: #1e293b; font-weight: 700; }
.prose-paragraph { margin: 0; font-size: 0.9rem; color: #475569; line-height: 1.6; }
.generic-fallback { font-style: italic; color: #94a3b8; }
.panel-section-divider { border: 0; height: 1px; background-color: #f1f5f9; margin: 0.5rem 0; }

.focused-lineage-canvas-viewport {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}
.canvas-panel-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.canvas-headline h3 { margin: 0; font-size: 1.05rem; color: #0f172a; }
.canvas-headline p { margin: 0.15rem 0 0 0; font-size: 0.8rem; color: #64748b; }

.traversal-toggle-switch {
  display: flex;
  background: #f1f5f9;
  padding: 0.25rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.traversal-toggle-switch button {
  background: none;
  border: none;
  padding: 0.45rem 1rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  border-radius: 6px;
}
.traversal-toggle-switch button.active-mode {
  background: white;
  color: #2563eb;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.embedded-graph-enclosure { flex: 1; position: relative; }
.loading-workspace-state { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; gap: 1rem; color: #64748b; }
.spinner { width: 35px; height: 35px; border: 3px solid #cbd5e1; border-top-color: #2563eb; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>