<template>
  <main class="map-page">
    <header class="map-header">
      <RouterLink to="/">← All lineages</RouterLink>
      <div class="lineage-title">
        <p>{{ lineage?.name || "Loading lineage…" }}</p>
        <small v-if="lineage">/{{ lineage.slug }}</small>
      </div>
      <div class="header-actions">
        <ThemeToggle />
        <RouterLink to="/create-lineage">Create a lineage</RouterLink>
      </div>
    </header>

    <aside
      v-if="lineage"
      class="lineage-overview"
      :class="{ 'panel-collapsed': !panelExpanded }"
    >
      <button
        type="button"
        class="panel-toggle"
        :aria-expanded="panelExpanded"
        @click="panelExpanded = !panelExpanded"
      >
        <span class="eyebrow">Family story</span>
        <span
          class="chevron"
          :class="{ 'chevron-collapsed': !panelExpanded }"
          aria-hidden="true"
          >▾</span
        >
      </button>
      <div v-if="panelExpanded" class="panel-body">
        <p :class="{ 'story-collapsed': isStoryLong && !storyExpanded }">
          {{ storyText }}
        </p>
        <button
          v-if="isStoryLong"
          type="button"
          class="story-toggle"
          @click="storyExpanded = !storyExpanded"
        >
          {{ storyExpanded ? "Show less" : "Read full story" }}
        </button>
      </div>
    </aside>

    <aside v-if="unconnectedPeople.length" class="unconnected-panel">
      <div class="unconnected-heading">
        <div>
          <span class="eyebrow">Needs connection</span>
          <h2>Not yet connected</h2>
        </div>
        <span class="member-count">{{ unconnectedPeople.length }}</span>
      </div>
      <p>
        These members have not yet been linked to anyone in the family tree.
      </p>
      <div class="unconnected-list">
        <div
          v-for="person in unconnectedPeople"
          :key="person.id"
          class="person-row"
        >
          <button
            type="button"
            class="person-info-btn"
            @click="openProfile(person)"
          >
            <img
              :src="
                person.profilePicture ||
                'https://placehold.co/72x72?text=No+Photo'
              "
              alt=""
            />
            <span>{{ person.name }}</span>
            <b aria-hidden="true">›</b>
          </button>
          <button
            v-if="isAdmin"
            type="button"
            class="connect-btn"
            title="Connect this person to the family tree"
            @click="connectPerson(person)"
          >
            Connect
          </button>
        </div>
      </div>
    </aside>

    <div v-if="error" class="status">{{ error }}</div>
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
    <div v-if="showGestureHint" class="gesture-hint">
      <p>🤏 Pinch to zoom · ✋ Drag to explore · Tap a card for details</p>
      <button type="button" @click="dismissGestureHint" aria-label="Dismiss hint">
        ×
      </button>
    </div>
    <div
      v-if="lineage"
      class="edge-style-control"
      :class="{ 'control-collapsed': !edgeControlExpanded }"
    >
      <button
        type="button"
        class="edge-style-toggle"
        :aria-expanded="edgeControlExpanded"
        :aria-label="edgeControlExpanded ? 'Collapse connector style' : 'Choose connector style'"
        @click="edgeControlExpanded = !edgeControlExpanded"
      >
        <span aria-hidden="true">🌿</span>
        <span v-if="edgeControlExpanded">Connector style</span>
      </button>
      <label v-if="edgeControlExpanded" class="edge-style-body">
        <select v-model="edgeStyle">
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
import { computed, markRaw, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useVueFlow, VueFlow } from "@vue-flow/core";
import { hierarchy, tree } from "d3-hierarchy";
import { api } from "@/api";
import CustomNode from "@/components/canvas/CustomNode.vue";
import SeeMoreNode from "@/components/canvas/SeeMoreNode.vue";
import BranchEdge from "@/components/canvas/BranchEdge.vue";
import BaseModal from "@/components/ui/BaseModal.vue";
import ThemeToggle from "@/components/ui/ThemeToggle.vue";

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
      data: { strokeWidth: strokeWidthForDepth(depths.get(marker.parentId) ?? 0) },
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
        gestureHintDismissed.value = localStorage.getItem(GESTURE_HINT_KEY) === "1";
      } catch {
        gestureHintDismissed.value = false;
      }
    }
    const data = await api.getLineageTree(props.slug);
    if (!data.people) throw new Error(data.message || "Lineage unavailable");
    lineage.value = data.lineage;
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

.map-page {
  height: 100vh;
  overflow: hidden;
  background: #f7f8f5;
  font-family: system-ui, sans-serif;
}
.map-header {
  position: absolute;
  z-index: 10;
  top: 1rem;
  left: 1rem;
  right: 1rem;
  min-height: 46px;
  padding: 0.65rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fffcf6ef;
  border: 1px solid #e1e6df;
  border-radius: 10px;
  box-shadow: 0 4px 18px #17352d0a;
}
.map-header a {
  font-size: 0.8rem;
  color: #17352d;
  text-decoration: none;
  font-weight: 600;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.lineage-title {
  text-align: center;
}
.lineage-title p {
  margin: 0;
  font:
    bold 1rem Georgia,
    serif;
}
.lineage-title small {
  color: #77837a;
}
.lineage-overview,
.unconnected-panel {
  position: absolute;
  z-index: 5;
  background: #fffcf6f2;
  border: 1px solid #e1e6df;
  border-radius: 12px;
  box-shadow: 0 8px 26px #17352d0d;
}
.lineage-overview {
  top: 5.8rem;
  left: 1rem;
  width: min(380px, calc(100vw - 2rem));
  padding: 0.9rem 1rem;
}
.lineage-overview.panel-collapsed {
  padding-bottom: 0.9rem;
}
.panel-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0;
  background: none;
  border: 0;
  cursor: pointer;
  text-align: left;
  font: inherit;
}
.panel-toggle .eyebrow {
  margin: 0;
}
.chevron {
  color: #7f6242;
  font-size: 0.8rem;
  line-height: 1;
  transition: transform 0.15s ease;
}
.chevron-collapsed {
  transform: rotate(-90deg);
}
.eyebrow {
  display: block;
  color: #7f6242;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}
.lineage-overview p {
  margin: 0.35rem 0 0;
  color: #405248;
  font:
    0.85rem/1.45 Georgia,
    serif;
}
.lineage-overview .story-collapsed {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}
.story-toggle {
  margin-top: 0.45rem;
  padding: 0;
  color: #4d6f5a;
  background: none;
  border: 0;
  font:
    700 0.72rem system-ui,
    sans-serif;
  cursor: pointer;
}
.story-toggle:hover {
  color: #17352d;
  text-decoration: underline;
}
.unconnected-panel {
  top: 5.8rem;
  right: 1rem;
  width: 270px;
  padding: 0.9rem;
}
.unconnected-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.unconnected-heading h2 {
  margin: 0.18rem 0 0;
  color: #17352d;
  font-size: 0.95rem;
}
.member-count {
  min-width: 1.4rem;
  padding: 0.17rem 0.35rem;
  color: #735128;
  background: #f5ead7;
  border-radius: 99px;
  font-size: 0.7rem;
  text-align: center;
}
.unconnected-panel > p {
  margin: 0.55rem 0 0.7rem;
  color: #64736b;
  font-size: 0.72rem;
  line-height: 1.4;
}
.unconnected-list {
  display: grid;
  gap: 0.4rem;
  max-height: 216px;
  overflow-y: auto;
}
.person-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.person-info-btn {
  flex: 1;
  min-width: 0;
  padding: 0.4rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #243a30;
  background: #fff;
  border: 1px solid #e4e7e1;
  border-radius: 8px;
  font:
    600 0.76rem system-ui,
    sans-serif;
  text-align: left;
  cursor: pointer;
}
.person-info-btn:hover {
  border-color: #b5c2b8;
  background: #fbfdf9;
}
.person-row img {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
  background: #e6e8e4;
  flex-shrink: 0;
}
.person-row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.person-row b {
  color: #8a9b90;
  font-size: 1.15rem;
  font-weight: 400;
}
.connect-btn {
  flex-shrink: 0;
  padding: 0.4rem 0.55rem;
  border: 1px solid #b25433;
  border-radius: 8px;
  background: #fdf1ea;
  color: #b25433;
  font:
    700 0.68rem system-ui,
    sans-serif;
  cursor: pointer;
}
.connect-btn:hover {
  background: #b25433;
  color: #fff;
}
.status {
  height: 100%;
  display: grid;
  place-items: center;
  color: #a33b2a;
}
.gesture-hint {
  position: absolute;
  z-index: 10;
  left: 50%;
  bottom: 1rem;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  max-width: calc(100vw - 1.5rem);
  padding: 0.55rem 0.5rem 0.55rem 0.85rem;
  background: rgba(23, 53, 45, 0.92);
  color: #f3f1e7;
  border-radius: 99px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
}
.gesture-hint p {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.gesture-hint button {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: inherit;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
}
.gesture-hint button:hover {
  background: rgba(255, 255, 255, 0.28);
}
/* Built-in Vue Flow edge types (smoothstep, default/bezier, step, straight)
   render through Vue Flow's own edge component rather than BranchEdge, so
   they fall back to Vue Flow's plain ".vue-flow__edge-path" line. Styling
   that here keeps every connector option looking like it belongs to the
   app instead of reverting to Vue Flow's default black line. The custom
   "branch" type ignores this — BranchEdge draws its own <path> elements. */
.vue-flow__edge.branch-edge .vue-flow__edge-path {
  stroke: #9c6b3e;
  stroke-width: 3.5;
}
.vue-flow__edge.branch-edge.more-edge .vue-flow__edge-path {
  stroke-dasharray: 3 9;
  opacity: 0.65;
}
.edge-style-control {
  position: absolute;
  z-index: 10;
  right: 1rem;
  bottom: 1rem;
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-end;
  gap: 0.4rem;
  background: #fffcf6ef;
  border: 1px solid #e1e6df;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}
.edge-style-control.control-collapsed {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}
.edge-style-toggle {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 0.7rem;
  border: 1px solid #e1e6df;
  border-radius: 10px;
  background: #fffcf6ef;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  font:
    600 0.78rem system-ui,
    sans-serif;
  color: #17352d;
  cursor: pointer;
}
.control-collapsed .edge-style-toggle {
  padding: 0.55rem;
  font-size: 1rem;
}
.edge-style-toggle:hover {
  border-color: #b5c2b8;
}
.edge-style-body {
  display: flex;
  align-items: center;
  padding: 0 0.7rem 0.7rem;
}
.edge-style-body select {
  padding: 0.4rem 0.5rem;
  border: 1px solid #d6ddd3;
  border-radius: 8px;
  background: #fff;
  color: #17352d;
  font:
    600 0.78rem system-ui,
    sans-serif;
}
@media (max-width: 720px) {
  .map-header {
    left: 0.5rem;
    right: 0.5rem;
    top: 0.5rem;
  }
  .map-header a {
    font-size: 0.7rem;
  }
  .lineage-overview {
    top: 5rem;
    left: 0.5rem;
    max-width: 250px;
  }
  .unconnected-panel {
    top: auto;
    right: 0.5rem;
    bottom: 0.5rem;
    width: min(270px, calc(100vw - 1rem));
  }
}

/* Dark mode */
[data-theme="dark"] .map-page {
  background: var(--bg);
}
[data-theme="dark"] .map-header {
  background: var(--surface);
  border-color: var(--border);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
}
[data-theme="dark"] .map-header a {
  color: var(--text);
}
[data-theme="dark"] .lineage-title small {
  color: var(--text-muted);
}
[data-theme="dark"] .lineage-overview,
[data-theme="dark"] .unconnected-panel {
  background: var(--surface);
  border-color: var(--border);
  box-shadow: 0 8px 26px rgba(0, 0, 0, 0.5);
}
[data-theme="dark"] .eyebrow {
  color: var(--accent);
}
[data-theme="dark"] .chevron {
  color: var(--text-muted);
}
[data-theme="dark"] .lineage-overview p {
  color: var(--text);
}
[data-theme="dark"] .story-toggle {
  color: var(--accent);
}
[data-theme="dark"] .story-toggle:hover {
  color: var(--accent-strong);
}
[data-theme="dark"] .unconnected-heading h2 {
  color: var(--text);
}
[data-theme="dark"] .member-count {
  color: var(--accent-strong);
  background: var(--surface-hover);
}
[data-theme="dark"] .unconnected-panel > p {
  color: var(--text-muted);
}
[data-theme="dark"] .person-info-btn {
  color: var(--text);
  background: var(--surface);
  border-color: var(--border);
}
[data-theme="dark"] .person-info-btn:hover {
  border-color: var(--border-strong);
  background: var(--surface-hover);
}
[data-theme="dark"] .person-row img {
  background: var(--surface-hover);
}
[data-theme="dark"] .person-row b {
  color: var(--text-subtle);
}
[data-theme="dark"] .connect-btn {
  background: var(--surface-hover);
  border-color: var(--accent);
  color: var(--accent);
}
[data-theme="dark"] .connect-btn:hover {
  background: var(--accent);
  color: var(--accent-contrast);
}
[data-theme="dark"] .status {
  color: #f87171;
}
[data-theme="dark"] .vue-flow__edge.branch-edge .vue-flow__edge-path {
  stroke: #c99a68;
}
[data-theme="dark"] .edge-style-control,
[data-theme="dark"] .edge-style-toggle {
  background: var(--surface);
  border-color: var(--border);
}
[data-theme="dark"] .edge-style-control.control-collapsed {
  background: transparent;
  border-color: transparent;
}
[data-theme="dark"] .edge-style-toggle {
  color: var(--text);
}
[data-theme="dark"] .edge-style-toggle:hover {
  border-color: var(--accent);
}
[data-theme="dark"] .edge-style-body select {
  background: var(--surface-2, var(--surface));
  border-color: var(--border);
  color: var(--text);
}
</style>
