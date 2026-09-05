<template>
  <main class="h-screen overflow-hidden bg-sand-50 font-sans dark:bg-slate-950">
    <header
      class="absolute z-10 top-2 left-2 right-2 md:top-4 md:left-4 md:right-4 min-h-11.5 flex items-center justify-between gap-2 px-4 py-2.6 bg-sand-50/95 border border-stone-200 rounded-[10px] shadow-[0_4px_18px_rgba(23,53,45,0.04)] dark:bg-slate-900 dark:border-slate-800 dark:shadow-[0_4px_18px_rgba(0,0,0,0.4)]"
    >
      <RouterLink
        to="/"
        class="text-[0.7rem] md:text-[0.8rem] text-forest-900 no-underline font-semibold dark:text-slate-100"
        >← All lineages</RouterLink
      >
      <div class="text-center">
        <p class="m-0 font-serif font-bold text-base">
          {{ lineage?.name || "Loading lineage…" }}
        </p>
        <small v-if="lineage" class="text-stone-500 dark:text-slate-400"
          >/{{ lineage.slug }}</small
        >
      </div>
      <div class="flex items-center gap-2.4">
        <ThemeToggle />
        <RouterLink
          to="/create-lineage"
          class="text-[0.7rem] md:text-[0.8rem] text-forest-900 no-underline font-semibold dark:text-slate-100"
          >Create a lineage</RouterLink
        >
      </div>
    </header>

    <aside
      v-if="lineage"
      class="absolute z-5 top-20 left-2 md:top-23.2 md:left-4 w-[min(380px,calc(100vw-2rem))] max-w-62.5 md:max-w-none px-4 py-3.6 bg-sand-50/95 border border-stone-200 rounded-xl shadow-[0_8px_26px_rgba(23,53,45,0.05)] dark:bg-slate-900 dark:border-slate-800 dark:shadow-[0_8px_26px_rgba(0,0,0,0.5)]"
    >
      <button
        type="button"
        class="w-full flex items-center justify-between gap-2 p-0 bg-transparent border-0 cursor-pointer text-left"
        :aria-expanded="panelExpanded"
        @click="panelExpanded = !panelExpanded"
      >
        <span
          class="block text-[0.65rem] font-extrabold tracking-[0.09em] uppercase text-sand-700 dark:text-clay-400"
          >Family story</span
        >
        <span
          class="text-sand-700 text-[0.8rem] leading-none transition-transform duration-150 ease-in-out dark:text-slate-400"
          :class="{ '-rotate-90': !panelExpanded }"
          aria-hidden="true"
          >▾</span
        >
      </button>
      <div v-if="panelExpanded">
        <p
          class="mt-1.4 mb-0 text-forest-800 text-[0.85rem] leading-[1.45] font-serif dark:text-slate-100"
          :class="{ 'line-clamp-3': isStoryLong && !storyExpanded }"
        >
          {{ storyText }}
        </p>
        <button
          v-if="isStoryLong"
          type="button"
          class="mt-1.8 p-0 bg-transparent border-0 text-forest-700 text-[0.72rem] font-bold font-sans cursor-pointer hover:text-forest-900 hover:underline dark:text-clay-400 dark:hover:text-clay-300"
          @click="storyExpanded = !storyExpanded"
        >
          {{ storyExpanded ? "Show less" : "Read full story" }}
        </button>
      </div>
    </aside>

    <aside
      v-if="unconnectedPeople.length"
      class="absolute z-5 top-auto right-2 bottom-2 md:top-23.2 md:right-4 md:bottom-auto w-[min(270px,calc(100vw-1rem))] md:w-67.5 p-3.6 bg-sand-50/95 border border-stone-200 rounded-xl shadow-[0_8px_26px_rgba(23,53,45,0.05)] dark:bg-slate-900 dark:border-slate-800 dark:shadow-[0_8px_26px_rgba(0,0,0,0.5)]"
    >
      <div class="flex items-center justify-between">
        <div>
          <span
            class="block text-[0.65rem] font-extrabold tracking-[0.09em] uppercase text-sand-700 dark:text-clay-400"
            >Needs connection</span
          >
          <h2
            class="mt-0.72 mb-0 text-forest-900 text-[0.95rem] dark:text-slate-100"
          >
            Not yet connected
          </h2>
        </div>
        <span
          class="badge justify-center min-w-5.6 bg-clay-100 text-sand-800 dark:bg-slate-800 dark:text-clay-300"
          >{{ unconnectedPeople.length }}</span
        >
      </div>
      <p
        class="mt-2.2 mb-2.8 text-[0.72rem] leading-[1.4] text-stone-500 dark:text-slate-400"
      >
        These members have not yet been linked to anyone in the family tree.
      </p>
      <div class="grid gap-1.6 max-h-54 overflow-y-auto">
        <div
          v-for="person in unconnectedPeople"
          :key="person.id"
          class="w-full flex items-center gap-1.6"
        >
          <button
            type="button"
            class="flex-1 min-w-0 p-1.6 flex items-center gap-2 text-forest-900 bg-white border border-stone-200 rounded-lg text-[0.76rem] font-semibold text-left cursor-pointer hover:border-stone-300 hover:bg-stone-50 dark:text-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-800"
            @click="openProfile(person)"
          >
            <img
              :src="
                person.profilePicture ||
                'https://placehold.co/72x72?text=No+Photo'
              "
              alt=""
              class="w-6.5 h-6.5 rounded-full object-cover bg-stone-200 shrink-0 dark:bg-slate-800"
            />
            <span class="flex-1 truncate">{{ person.name }}</span>
            <b
              aria-hidden="true"
              class="text-stone-400 text-[1.15rem] font-normal dark:text-slate-500"
              >›</b
            >
          </button>
          <button
            v-if="isAdmin"
            type="button"
            class="shrink-0 px-2.2 py-1.6 border border-clay-600 rounded-lg bg-sand-50 text-clay-600 text-[0.68rem] font-bold cursor-pointer hover:bg-clay-600 hover:text-white dark:bg-slate-800 dark:border-clay-400 dark:text-clay-400 dark:hover:bg-clay-400 dark:hover:text-white"
            title="Connect this person to the family tree"
            @click="connectPerson(person)"
          >
            Connect
          </button>
        </div>
      </div>
    </aside>

    <div
      v-if="error"
      class="h-full grid place-items-center text-red-800 dark:text-red-400"
    >
      {{ error }}
    </div>
    <VueFlow
      v-else
      v-model:nodes="nodes"
      v-model:edges="edges"
      :node-types="nodeTypes"
      :edge-types="edgeTypes"
      :min-zoom="0.15"
      :max-zoom="1.5"
      :fit-view-on-init="!isMobileViewport"
      @node-click="handleNodeClick"
    >
      <template #node-custom="nodeProps">
        <CustomNode v-bind="nodeProps" @show-info="openProfile" />
      </template>
      <template #node-seeMore="nodeProps">
        <SeeMoreNode
          v-bind="nodeProps"
          @show-remaining-children="showRemainingChildren"
        />
      </template>
      <template #edge-branch="edgeProps">
        <BranchEdge v-bind="edgeProps" />
      </template>
    </VueFlow>
    <div
      v-if="showGestureHint"
      class="absolute z-10 left-1/2 bottom-4 -translate-x-1/2 flex items-center gap-2 max-w-[calc(100vw-1.5rem)] pl-3.4 pr-2 py-2.2 bg-forest-900/92 text-sand-100 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.25)]"
    >
      <p class="m-0 text-[0.72rem] font-semibold truncate">
        🤏 Pinch to zoom · ✋ Drag to explore · Tap a card for details
      </p>
      <button
        type="button"
        class="shrink-0 w-5.5 h-5.5 grid place-items-center border-0 rounded-full bg-white/15 text-inherit text-base leading-none cursor-pointer hover:bg-white/[0.28]"
        @click="dismissGestureHint"
        aria-label="Dismiss hint"
      >
        ×
      </button>
    </div>
    <div
      v-if="lineage"
      class="absolute z-10 right-4 bottom-4 flex flex-col-reverse items-end gap-1.6 rounded-xl"
      :class="
        edgeControlExpanded
          ? 'bg-sand-50/95 border border-stone-200 shadow-[0_8px_20px_rgba(0,0,0,0.1)] dark:bg-slate-900 dark:border-slate-800'
          : 'bg-transparent border border-transparent shadow-none'
      "
    >
      <button
        type="button"
        class="flex items-center gap-1.6 rounded-[10px] bg-sand-50/95 border border-stone-200 shadow-[0_8px_20px_rgba(0,0,0,0.1)] font-sans font-semibold text-forest-900 cursor-pointer hover:border-stone-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 dark:hover:border-clay-400"
        :class="
          edgeControlExpanded
            ? 'px-2.8 py-2.4 text-[0.78rem]'
            : 'p-2.2 text-base'
        "
        :aria-expanded="edgeControlExpanded"
        :aria-label="
          edgeControlExpanded
            ? 'Collapse connector style'
            : 'Choose connector style'
        "
        @click="edgeControlExpanded = !edgeControlExpanded"
      >
        <span aria-hidden="true">🌿</span>
        <span v-if="edgeControlExpanded">Connector style</span>
      </button>
      <label v-if="edgeControlExpanded" class="flex items-center px-2.8 pb-2.8">
        <select
          v-model="edgeStyle"
          class="px-2 py-1.6 border border-stone-300 rounded-lg bg-white text-forest-900 font-sans font-semibold text-[0.78rem] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
        >
          <option
            v-for="option in EDGE_STYLE_OPTIONS"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </label>
    </div>
    <BaseModal
      v-if="selectedPerson"
      :active-person="selectedPerson"
      @close="selectedPerson = null"
    />
  </main>
</template>

<script setup>
import {
  computed,
  markRaw,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { useRouter } from "vue-router";
import { useVueFlow, VueFlow } from "@vue-flow/core";
import { hierarchy, tree } from "d3-hierarchy";
import { api } from "@/api";
import CustomNode from "@/components/canvas/CustomNode.vue";
import SeeMoreNode from "@/components/canvas/SeeMoreNode.vue";
import BranchEdge from "@/components/canvas/BranchEdge.vue";
import BaseModal from "@/components/ui/BaseModal.vue";
import ThemeToggle from "@/components/ui/ThemeToggle.vue";
import { setPageTitle, withSiteSuffix } from "@/composables/useDocumentMeta";

const props = defineProps({ slug: { type: String, required: true } });
const router = useRouter();
const { setViewport } = useVueFlow();
const nodes = ref([]);
const edges = ref([]);
const lineage = ref(null);
const error = ref("");
const selectedPerson = ref(null);
const unconnectedPeople = ref([]);
const rawPeople = ref([]);
const rawRelationships = ref([]);
const expandedParentIds = ref(new Set());
const storyExpanded = ref(false);
const panelExpanded = ref(true);
const nodeTypes = {
  custom: markRaw(CustomNode),
  seeMore: markRaw(SeeMoreNode),
};
const edgeTypes = {
  branch: markRaw(BranchEdge),
};
const MAX_VISIBLE_CHILDREN = 8;
const MOBILE_BREAKPOINT = 720;
const isMobileViewport =
  typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT;
const primaryRootId = ref(null);

// Lets people swap the custom "Branch" connector for one of Vue Flow's
// built-in edge renderers. "branch" routes through our own BranchEdge
// component (see edge-types/edge-branch below); every other value is a
// built-in Vue Flow type rendered by its default edge component, styled by
// the .branch-edge fallback CSS further down so it still matches the app.
const EDGE_STYLE_OPTIONS = [
  { value: "branch", label: "Branch (organic)" },
  { value: "smoothstep", label: "Smoothstep" },
  { value: "default", label: "Bezier curve" },
  { value: "step", label: "Step" },
  { value: "straight", label: "Straight" },
];
const edgeStyle = ref("branch");
const edgeControlExpanded = ref(false);

const GESTURE_HINT_KEY = "agburu-map-gesture-hint-dismissed";
const gestureHintDismissed = ref(true);
const showGestureHint = computed(
  () => isMobileViewport && !!lineage.value && !gestureHintDismissed.value,
);
let gestureHintTimer;

const dismissGestureHint = () => {
  gestureHintDismissed.value = true;
  clearTimeout(gestureHintTimer);
  try {
    localStorage.setItem(GESTURE_HINT_KEY, "1");
  } catch {
    // Private browsing / storage blocked — hint just won't be remembered.
  }
};
const storyText = computed(
  () =>
    lineage.value?.description ||
    `The history and story of this lineage will appear here.`,
);
const isStoryLong = computed(() => storyText.value.length > 220);
const isAdmin = computed(() => !!localStorage.getItem("token"));

const layout = (people, relationships) => {
  const connectedIds = new Set();
  relationships.forEach((relationship) => {
    if (relationship.type === "parent_child") {
      connectedIds.add(relationship.parentPersonId);
      connectedIds.add(relationship.childPersonId);
    } else if (relationship.type === "marriage") {
      relationship.personIds.forEach((personId) => connectedIds.add(personId));
    }
  });

  unconnectedPeople.value = people.filter(
    (person) => !connectedIds.has(person.id),
  );
  const treePeople = people.filter(
    (person) =>
      person.modeOfJoining !== "married" && connectedIds.has(person.id),
  );
  const peopleById = new Map(treePeople.map((person) => [person.id, person]));
  const partnersByPersonId = new Map(
    treePeople.map((person) => [person.id, new Set(person.partnerIds || [])]),
  );

  relationships
    .filter((relationship) => relationship.type === "marriage")
    .forEach((relationship) => {
      const [firstPersonId, secondPersonId] = relationship.personIds;
      if (partnersByPersonId.has(firstPersonId))
        partnersByPersonId.get(firstPersonId).add(secondPersonId);
      if (partnersByPersonId.has(secondPersonId))
        partnersByPersonId.get(secondPersonId).add(firstPersonId);
    });

  const treeRelationships = relationships.filter(
    (relationship) =>
      relationship.type === "parent_child" &&
      peopleById.has(relationship.parentPersonId) &&
      peopleById.has(relationship.childPersonId),
  );
  const allChildrenByParentId = new Map(
    treePeople.map((person) => [person.id, []]),
  );
  const parentIds = new Set();
  treeRelationships.forEach((relationship) => {
    allChildrenByParentId.get(relationship.parentPersonId).push(relationship);
    parentIds.add(relationship.childPersonId);
  });
  allChildrenByParentId.forEach((children) =>
    children.sort((first, second) => first.childOrder - second.childOrder),
  );
  const childrenByParentId = new Map();
  const visibleTreeRelationships = [];
  allChildrenByParentId.forEach((children, parentId) => {
    const visibleChildren = expandedParentIds.value.has(parentId)
      ? children
      : children.slice(0, MAX_VISIBLE_CHILDREN);
    childrenByParentId.set(parentId, visibleChildren);
    visibleTreeRelationships.push(...visibleChildren);
  });

  const rootIds = treePeople
    .filter((person) => person.isRoot)
    .map((person) => person.id);
  const fallbackRootIds = treePeople
    .filter((person) => !parentIds.has(person.id))
    .map((person) => person.id);
  const orderedRootIds = [...new Set([...rootIds, ...fallbackRootIds])];
  const placedIds = new Set();
  const positions = new Map();
  const depths = new Map();
  const moreMarkers = [];
  let forestOffset = 0;

  // A "more" marker is appended as an extra leaf alongside a parent's real
  // children so the d3 tree layout reserves it a slot in the children row,
  // instead of the count living inside the parent's own node.
  const buildBranch = (personId, ancestors = new Set()) => {
    if (ancestors.has(personId)) return null;
    const person = peopleById.get(personId);
    if (!person) return null;
    const nextAncestors = new Set(ancestors);
    nextAncestors.add(personId);
    const childBranches = childrenByParentId
      .get(personId)
      .map((relationship) =>
        buildBranch(relationship.childPersonId, nextAncestors),
      )
      .filter(Boolean);
    const hiddenCount =
      allChildrenByParentId.get(personId).length -
      childrenByParentId.get(personId).length;
    if (hiddenCount > 0) {
      childBranches.push({ moreMarker: true, parentId: personId, hiddenCount });
    }
    return {
      person,
      children: childBranches,
    };
  };

  const applyTree = (rootId) => {
    const branch = buildBranch(rootId);
    if (!branch) return;
    const root = hierarchy(branch, (entry) => entry.children);
    // A taller row height gives each branch's curve room to arc gracefully
    // before it reaches the next generation, instead of bunching right
    // under the parent node.
    tree().nodeSize([320, 230])(root);
    root.descendants().forEach((node) => {
      if (node.data.moreMarker) {
        moreMarkers.push({
          parentId: node.data.parentId,
          hiddenCount: node.data.hiddenCount,
          x: node.x + forestOffset,
          y: node.y,
        });
        return;
      }
      if (placedIds.has(node.data.person.id)) return;
      placedIds.add(node.data.person.id);
      positions.set(node.data.person.id, {
        x: node.x + forestOffset,
        y: node.y,
      });
      depths.set(node.data.person.id, node.depth);
    });
    forestOffset +=
      Math.max(...root.descendants().map((node) => node.x), 0) + 420;
  };

  primaryRootId.value = orderedRootIds[0] ?? null;
  orderedRootIds.forEach(applyTree);
  treePeople
    .filter((person) => !placedIds.has(person.id))
    .forEach((person) => {
      positions.set(person.id, { x: forestOffset, y: 0 });
      forestOffset += 320;
    });

  nodes.value = [
    ...treePeople
      .filter((person) => placedIds.has(person.id))
      .map((person) => {
        const point = positions.get(person.id);
        return {
          id: person.id,
          type: "custom",
          data: {
            ...person,
            partnerIds: [...partnersByPersonId.get(person.id)],
          },
          position: { x: point.x - 130, y: point.y - 58 },
        };
      }),
    ...moreMarkers.map((marker) => ({
      id: `more-${marker.parentId}`,
      type: "seeMore",
      data: { parentId: marker.parentId, hiddenCount: marker.hiddenCount },
      position: { x: marker.x - 70, y: marker.y - 58 },
    })),
  ];
  // Edges nearer the root render as a thicker "trunk"; depth is only known
  // for the parent side once applyTree has walked it, so children a few
  // generations down naturally taper to thinner "twigs".
  const strokeWidthForDepth = (depth) => Math.max(2.5, 7 - depth);

  edges.value = [
    ...visibleTreeRelationships.map((relationship) => ({
      id: relationship.id,
      source: relationship.parentPersonId,
      target: relationship.childPersonId,
      type: edgeStyle.value,
      class: "branch-edge",
      data: {
        strokeWidth: strokeWidthForDepth(
          depths.get(relationship.parentPersonId) ?? 0,
        ),
      },
    })),
    ...moreMarkers.map((marker) => ({
      id: `more-edge-${marker.parentId}`,
      source: marker.parentId,
      target: `more-${marker.parentId}`,
      type: edgeStyle.value,
      class: "branch-edge more-edge",
      data: {
        strokeWidth: strokeWidthForDepth(depths.get(marker.parentId) ?? 0),
      },
    })),
  ];
};

// A phone-width viewport is too narrow to fit-view a wide family tree
// without hitting the min-zoom floor and clipping nodes off both edges —
// instead of shrinking the whole tree to fit, center on just the root (and
// the generation right below it) at a fixed, legible zoom, and let people
// pinch/pan from there.
const centerOnRootForMobile = async () => {
  if (!isMobileViewport || !primaryRootId.value) return;
  await nextTick();
  const rootNode = nodes.value.find((node) => node.id === primaryRootId.value);
  if (!rootNode) return;
  const zoom = 0.55;
  const nodeCenterX = rootNode.position.x + 130;
  const nodeCenterY = rootNode.position.y + 58;
  setViewport(
    {
      x: window.innerWidth / 2 - nodeCenterX * zoom,
      y: window.innerHeight * 0.3 - nodeCenterY * zoom,
      zoom,
    },
    { duration: 450 },
  );
};

onMounted(async () => {
  try {
    if (isMobileViewport) {
      try {
        gestureHintDismissed.value =
          localStorage.getItem(GESTURE_HINT_KEY) === "1";
      } catch {
        gestureHintDismissed.value = false;
      }
    }
    const data = await api.getLineageTree(props.slug);
    if (!data.people) throw new Error(data.message || "Lineage unavailable");
    lineage.value = data.lineage;
    setPageTitle(
      withSiteSuffix(data.lineage?.name),
      data.lineage?.description || undefined,
    );
    rawPeople.value = data.people;
    rawRelationships.value = data.relationships;
    layout(rawPeople.value, rawRelationships.value);
    await centerOnRootForMobile();
    if (isMobileViewport && !gestureHintDismissed.value) {
      gestureHintTimer = setTimeout(dismissGestureHint, 6000);
    }
  } catch (requestError) {
    error.value = requestError.message;
  }
});

onBeforeUnmount(() => clearTimeout(gestureHintTimer));

// Re-run layout so every edge picks up the newly selected type — the
// dropdown swaps the connector style live, without a page reload.
watch(edgeStyle, () => {
  if (rawPeople.value.length) layout(rawPeople.value, rawRelationships.value);
});

const openProfile = (person) => {
  selectedPerson.value = person;
};
const showRemainingChildren = (parentId) => {
  expandedParentIds.value = new Set([...expandedParentIds.value, parentId]);
  layout(rawPeople.value, rawRelationships.value);
};
const connectPerson = (person) => {
  router.push({
    name: "admin-lineages",
    query: { lineageId: lineage.value?.id, connectPersonId: person.id },
  });
};
const handleNodeClick = (event) => event.event.preventDefault();
</script>

<style>
@import "@vue-flow/core/dist/style.css";
@import "@vue-flow/core/dist/theme-default.css";

/* Built-in Vue Flow edge types (smoothstep, default/bezier, step, straight)
   render through Vue Flow's own edge component rather than BranchEdge, so
   they fall back to Vue Flow's plain ".vue-flow__edge-path" line. Styling
   that here keeps every connector option looking like it belongs to the
   app instead of reverting to Vue Flow's default black line. The custom
   "branch" type ignores this — BranchEdge draws its own <path> elements.
   These target Vue Flow's own internally-rendered DOM, which lives outside
   this component's template, so they must stay as global CSS. */
.vue-flow__edge.branch-edge .vue-flow__edge-path {
  stroke: var(--color-clay-700);
  stroke-width: 3.5;
}
.vue-flow__edge.branch-edge.more-edge .vue-flow__edge-path {
  stroke-dasharray: 3 9;
  opacity: 0.65;
}
[data-theme="dark"] .vue-flow__edge.branch-edge .vue-flow__edge-path {
  stroke: var(--color-clay-400);
}
</style>
