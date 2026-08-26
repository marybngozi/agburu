<template>
  <g class="branch-edge-group">
    <defs>
      <linearGradient
        :id="gradientId"
        gradientUnits="userSpaceOnUse"
        :x1="sourceX"
        :y1="sourceY"
        :x2="targetX"
        :y2="targetY"
      >
        <stop offset="0%" stop-color="#5b3a1e" />
        <stop offset="100%" stop-color="#9c6b3e" />
      </linearGradient>
      <!-- filterUnits="userSpaceOnUse" with an explicit region (rather than
           the default percentage-of-bounding-box region) matters here: a
           single-child branch runs almost perfectly vertical, so its path's
           bounding box collapses to ~0 width. A percentage-based filter
           region on a zero-width box is itself zero-width, so Chrome/Firefox
           render nothing for the filtered element — the gradient "core"
           path vanished entirely on those edges, leaving only the plain
           dark shadow path visible (reported as "the branch isn't showing"
           on straight single-child connectors). Deriving the region from
           the actual source/target coordinates, padded generously, keeps it
           non-degenerate regardless of the edge's direction. -->
      <filter
        :id="filterId"
        filterUnits="userSpaceOnUse"
        :x="filterRegion.x"
        :y="filterRegion.y"
        :width="filterRegion.width"
        :height="filterRegion.height"
      >
        <feTurbulence
          type="fractalNoise"
          base-frequency="0.7"
          num-octaves="1"
          seed="4"
          result="grain"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="grain"
          scale="1.4"
          x-channel-selector="R"
          y-channel-selector="G"
        />
      </filter>
    </defs>
    <!-- Bark shadow: a soft, wider underlay so the branch reads as rounded
         wood rather than a flat ribbon. -->
    <path :d="path" class="branch-shadow" :style="{ strokeWidth: width + 3 }" fill="none" />
    <!-- Core: gradient + a light turbulence displacement, giving the stroke
         a slightly irregular, hand-carved edge instead of a perfect curve. -->
    <path
      :d="path"
      class="branch-core"
      :style="{ stroke: `url(#${gradientId})`, strokeWidth: width, filter: `url(#${filterId})` }"
      fill="none"
    />
    <!-- Highlight: a thin, offset-lighter line down the middle to suggest
         a lit top edge, like a rounded twig catching light. -->
    <path
      :d="path"
      class="branch-highlight"
      :style="{ strokeWidth: Math.max(1, width - 4) }"
      fill="none"
    />
  </g>
</template>

<script setup>
import { computed } from "vue";
import { getBezierPath, Position } from "@vue-flow/core";

const props = defineProps({
  id: { type: String, required: true },
  sourceX: { type: Number, required: true },
  sourceY: { type: Number, required: true },
  targetX: { type: Number, required: true },
  targetY: { type: Number, required: true },
  sourcePosition: { type: String, default: Position.Bottom },
  targetPosition: { type: String, default: Position.Top },
  data: { type: Object, default: () => ({}) },
});

// Generations closer to the root render a thicker "trunk"; layout code can
// pass a per-edge data.strokeWidth (see LineageMapView's depth-based
// calculation) or fall back to a flat default for trees that don't track
// depth (e.g. the dagre-based profile tree).
const width = computed(() => props.data?.strokeWidth ?? 6);

const gradientId = computed(() => `branch-gradient-${props.id}`);
const filterId = computed(() => `branch-texture-${props.id}`);

// See the comment on the <filter> element in the template: this keeps the
// turbulence filter's region non-degenerate for near-vertical or
// near-horizontal edges, whose straight-line bounding box would otherwise
// collapse to ~0 in one dimension.
const FILTER_PADDING = 80;
const filterRegion = computed(() => {
  const minX = Math.min(props.sourceX, props.targetX);
  const maxX = Math.max(props.sourceX, props.targetX);
  const minY = Math.min(props.sourceY, props.targetY);
  const maxY = Math.max(props.sourceY, props.targetY);
  return {
    x: minX - FILTER_PADDING,
    y: minY - FILTER_PADDING,
    width: maxX - minX + FILTER_PADDING * 2,
    height: maxY - minY + FILTER_PADDING * 2,
  };
});

const path = computed(() => {
  const [edgePath] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
    curvature: 0.35,
  });
  return edgePath;
});
</script>

<style scoped>
.branch-shadow {
  stroke: rgba(59, 37, 18, 0.32);
  stroke-linecap: round;
}
.branch-core {
  stroke-linecap: round;
}
.branch-highlight {
  stroke: rgba(255, 233, 200, 0.4);
  stroke-linecap: round;
}
/* .more-edge is set via the `class` field on "more" marker edge objects,
   landing on the vue-flow__edge wrapper that's an ancestor of this
   component's own template — Vue's scoped CSS leaves ancestor selectors
   like this unscoped, so a plain descendant selector is enough. */
.more-edge .branch-core {
  stroke-dasharray: 3 9;
  opacity: 0.65;
}
.more-edge .branch-highlight {
  opacity: 0.3;
}

/* Same reasoning: [data-theme="dark"] lives on <html>, well outside this
   component, so it stays an unscoped ancestor selector too. */
[data-theme="dark"] .branch-shadow {
  stroke: rgba(0, 0, 0, 0.55);
}
[data-theme="dark"] .branch-highlight {
  stroke: rgba(255, 220, 170, 0.2);
}
</style>
