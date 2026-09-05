<template>
  <div class="w-screen min-h-screen h-auto overflow-visible md:h-screen md:overflow-hidden flex flex-col bg-slate-100 font-sans dark:bg-slate-950">
    <nav class="flex items-center flex-wrap md:flex-nowrap gap-3 md:gap-6 bg-white border-b border-slate-200 px-4 md:px-6 py-3 z-10 dark:bg-slate-900 dark:border-slate-800">
      <button
        @click="$router.push('/')"
        class="bg-transparent border border-slate-300 px-3.5 py-1.5 rounded-md text-sm font-medium cursor-pointer text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
      >
        ← Main Lineage Graph
      </button>
      <div v-if="person" class="text-sm text-slate-500 flex-1 basis-full md:basis-0 order-3 md:order-none dark:text-slate-400">
        Directory / Profile Workspace / <strong>{{ person.name }}</strong>
      </div>
      <ThemeToggle />
    </nav>

    <div v-if="isLoading" class="flex flex-col items-center justify-center flex-1 gap-4 text-slate-500 dark:text-slate-400">
      <div class="w-[35px] h-[35px] border-[3px] border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
      <p>Retrieving extended historical file logs...</p>
    </div>

    <div v-else-if="person" class="flex-1 flex flex-col md:flex-row overflow-visible md:overflow-hidden">
      <aside class="w-full md:w-[380px] max-h-[45vh] md:max-h-none border-b md:border-b-0 md:border-r border-slate-200 px-4 md:px-6 py-5 md:py-8 bg-white overflow-y-auto flex flex-col gap-6 box-border dark:bg-slate-900 dark:border-slate-800">
        <div class="flex gap-4 items-center">
          <img
            :src="person.profilePicture || 'https://placehold.co/150x150?text=No+Photo'"
            alt="Profile Picture"
            class="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
          />
          <div>
            <div class="flex gap-1">
              <span v-if="person.title" class="bg-sky-100 text-sky-700 text-[0.6rem] px-1 py-0.5 rounded-sm font-semibold">{{ person.title }}</span>
              <span v-if="person.titledName" class="bg-amber-100 text-amber-700 text-[0.6rem] px-1 py-0.5 rounded-sm font-semibold">{{ person.titledName }}</span>
            </div>
            <h2 class="mt-1 mb-0 text-[1.35rem] text-slate-900 dark:text-slate-100">{{ person.name }}</h2>
            <p class="mt-[0.15rem] mb-0 text-xs font-medium text-slate-500 dark:text-slate-400">
              ⏳ {{ formatYear(person.birthDate) }} —
              {{ person.deathDate ? formatYear(person.deathDate) : 'Present (Alive)' }}
            </p>
          </div>
        </div>

        <div>
          <h3 class="mt-0 mb-3 text-base font-bold text-slate-800 dark:text-slate-100">Detailed Historical Record</h3>
          <!-- detailedBiography is HTML written by an authenticated admin
               through the rich text editor on the Add/Edit Person form, not
               public-submitted content, so rendering it directly is the
               same trust boundary as any admin-authored CMS field. A <div>
               wrapper (not <p>) because the HTML can itself contain block
               elements — headings, lists, blockquotes — which <p> can't
               legally nest. The prose/dark:prose-invert classes (from the
               @tailwindcss/typography plugin) style whatever markup the
               editor produced, replacing the hand-rolled :deep() rules that
               used to live in this file's <style> block.

               Deliberately NOT using a prose-{color} modifier (e.g.
               prose-slate) alongside dark:prose-invert: both generate rules
               that set the same --tw-prose-* custom properties at equal
               selector specificity, and which one wins becomes a source-
               order coin flip — in practice the light-mode prose-slate
               values were winning even with data-theme="dark" active,
               which is why the biography text was unreadable (dark text on
               a dark background). Plain `prose` already ships a sensible
               default gray palette, so dropping the modifier removes the
               conflicting rule entirely instead of fighting it with
               !important. -->
          <div
            v-if="person.detailedBiography"
            class="prose prose-sm max-w-none dark:prose-invert"
            v-html="person.detailedBiography"
          ></div>
          <p v-else class="m-0 text-sm leading-relaxed italic text-slate-400 dark:text-slate-500">
            No deeply structured narrative biography text has been logged for this profile record yet.
          </p>
        </div>

        <hr class="border-0 h-px bg-slate-100 my-2 dark:bg-slate-800" />

        <div>
          <h3 class="mt-0 mb-3 text-base font-bold text-slate-800 dark:text-slate-100">Historical Journey Logs</h3>
          <TimeLine :milestones="person.milestones" />
        </div>
      </aside>

      <main class="flex-1 flex flex-col bg-slate-50 min-h-[60vh] md:min-h-0 dark:bg-slate-950">
        <div class="flex flex-col items-stretch justify-between gap-3 md:flex-row md:items-center md:gap-0 bg-white border-b border-slate-200 px-6 py-4 dark:bg-slate-900 dark:border-slate-800">
          <div>
            <h3 class="m-0 text-[1.05rem] text-slate-900 dark:text-slate-100">Focused Family Tree Stream</h3>
            <p class="mt-[0.15rem] mb-0 text-xs text-slate-500 dark:text-slate-400">Tracing lineage relationships branching dynamically directly from this member node.</p>
          </div>

          <div class="flex justify-center md:justify-start bg-slate-100 p-1 rounded-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-800">
            <button
              :class="[
                'px-4 py-[0.45rem] text-xs font-semibold rounded-md cursor-pointer bg-transparent border-0',
                canvasMode === 'descendants'
                  ? 'bg-white text-blue-600 shadow-[0_1px_3px_rgba(0,0,0,0.1)] dark:bg-slate-900 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400'
              ]"
              @click="switchCanvasOrientation('descendants')"
            >
              Descendants (Forward Tree)
            </button>
            <button
              :class="[
                'px-4 py-[0.45rem] text-xs font-semibold rounded-md cursor-pointer bg-transparent border-0',
                canvasMode === 'ancestors'
                  ? 'bg-white text-blue-600 shadow-[0_1px_3px_rgba(0,0,0,0.1)] dark:bg-slate-900 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400'
              ]"
              @click="switchCanvasOrientation('ancestors')"
            >
              Ancestors (Backward Tree)
            </button>
          </div>
        </div>

        <div class="flex-1 relative">
          <VueFlow
            v-model:nodes="nodes"
            v-model:edges="edges"
            :node-types="nodeTypes"
            :edge-types="edgeTypes"
            :min-zoom="0.15"
            :max-zoom="1.5"
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
            <template #node-seeMore="nodeProps">
              <SeeMoreNode
                v-bind="nodeProps"
                @show-remaining-children="handleShowRemainingChildren"
              />
            </template>
            <template #edge-branch="edgeProps">
              <BranchEdge v-bind="edgeProps" />
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
import SeeMoreNode from '@/components/canvas/SeeMoreNode.vue';
import BranchEdge from '@/components/canvas/BranchEdge.vue';
import ThemeToggle from '@/components/ui/ThemeToggle.vue';
import { setPageTitle, withSiteSuffix } from '@/composables/useDocumentMeta';

const route = useRoute();
const router = useRouter();

const person = ref(null);
const isLoading = ref(true);
const canvasMode = ref('descendants');

const nodeTypes = { custom: markRaw(CustomNode), seeMore: markRaw(SeeMoreNode) };
const edgeTypes = { branch: markRaw(BranchEdge) };

const { nodes, edges, loadInitialTree, expandChildBranch, collapseChildBranch, revealHiddenChildren } = useLineage();

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
      setPageTitle(
        withSiteSuffix(data.name),
        data.biographySummary || undefined,
      );
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
          type: 'branch'
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
const handleShowRemainingChildren = async (parentId) => {
  const marker = nodes.value.find((node) => node.id === `more-${parentId}`);
  if (!marker) return;
  await revealHiddenChildren(parentId, marker.data.hiddenIds);
};

const hotReloadWorkspaceId = (personProps) => {
  router.push({ name: 'profile', params: { id: personProps.id } });
};

const formatYear = (dateStr) => dateStr ? new Date(dateStr).getFullYear() : '???';
</script>
