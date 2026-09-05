import { ref } from "vue";
import { api } from "@/api";
import { hierarchy, tree } from "d3-hierarchy";

// Same tree-layout engine LineageMapView.vue (the home page's family map)
// uses — d3-hierarchy's "tidy tree" algorithm, at the identical node pitch
// — instead of a differently-shaped dagre layout that used to live here.
// Dagre is a layered *graph* algorithm; even with matching spacing
// constants it fans siblings out more rigidly than d3-hierarchy's tree
// algorithm does, so the two pages' trees looked like different designs
// for the same family. Using the same engine at the same scale means a
// person's card and the branch connecting it to a parent look identical
// wherever they're drawn — only the surrounding canvas is smaller here
// (a sidebar shares the page with it), not the tree itself.
export function useLineage() {
  const nodes = ref([]);
  const edges = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

  // Same cap as the public lineage map, so no generation ever floods the
  // canvas — the rest surface behind a "see more" node instead.
  const MAX_VISIBLE_CHILDREN = 8;

  // Mirrors LineageMapView.vue's own depth-based tapering (a thicker
  // "trunk" near the root, thinner "twigs" further out) so a branch reads
  // the same whichever tree it's drawn in.
  const strokeWidthForDepth = (depth) => Math.max(2.5, 7 - depth);

  const withEdgeStrokeWidths = (allNodes, allEdges) => {
    const childEdges = allEdges.filter(
      (edge) => edge.type === "branch" && !edge.id?.startsWith("more-edge-"),
    );
    const hasIncoming = new Set(childEdges.map((edge) => edge.target));
    const rootIds = allNodes.map((node) => node.id).filter((id) => !hasIncoming.has(id));
    const depths = new Map(rootIds.map((id) => [id, 0]));
    const queue = [...rootIds];
    while (queue.length) {
      const current = queue.shift();
      const depth = depths.get(current);
      childEdges
        .filter((edge) => edge.source === current)
        .forEach((edge) => {
          if (!depths.has(edge.target)) {
            depths.set(edge.target, depth + 1);
            queue.push(edge.target);
          }
        });
    }
    return allEdges.map((edge) => ({
      ...edge,
      data: { ...edge.data, strokeWidth: strokeWidthForDepth(depths.get(edge.source) ?? 0) },
    }));
  };

  // Lays out a set of nodes connected by parent→child edges using the same
  // d3-hierarchy tree() call, at the same nodeSize, as LineageMapView.vue.
  // Unlike the home page (which can show several unrelated family branches
  // at once and offsets each into its own "forest slot"), this composable
  // is only ever handed one connected tree at a time — a single focused
  // person's descendants, or a straight-line ancestor chain — but the loop
  // below still supports multiple disconnected roots (offsetting each the
  // same way LineageMapView does) so it stays correct if that ever changes.
  const calculateLayout = (rawNodes, rawEdges) => {
    if (!rawNodes.length) return rawNodes;

    const nodeById = new Map(rawNodes.map((node) => [node.id, node]));
    const childrenByParentId = new Map(rawNodes.map((node) => [node.id, []]));
    rawEdges.forEach((edge) => {
      if (childrenByParentId.has(edge.source)) {
        childrenByParentId.get(edge.source).push(edge.target);
      }
    });

    const hasIncoming = new Set(rawEdges.map((edge) => edge.target));
    const rootIds = rawNodes.map((node) => node.id).filter((id) => !hasIncoming.has(id));

    const placed = new Set();
    const positions = new Map();
    let forestOffset = 0;

    const buildBranch = (id, ancestors = new Set()) => {
      if (ancestors.has(id) || placed.has(id)) return null;
      const node = nodeById.get(id);
      if (!node) return null;
      const nextAncestors = new Set(ancestors);
      nextAncestors.add(id);
      const children = (childrenByParentId.get(id) || [])
        .map((childId) => buildBranch(childId, nextAncestors))
        .filter(Boolean);
      return { node, children };
    };

    rootIds.forEach((rootId) => {
      const branch = buildBranch(rootId);
      if (!branch) return;
      const root = hierarchy(branch, (entry) => entry.children);
      // Same nodeSize as LineageMapView.vue's layout() — a taller row
      // height than the card itself gives each branch's curve room to arc
      // before reaching the next generation.
      tree().nodeSize([320, 230])(root);
      root.descendants().forEach((d3Node) => {
        placed.add(d3Node.data.node.id);
        positions.set(d3Node.data.node.id, {
          x: d3Node.x + forestOffset,
          y: d3Node.y,
        });
      });
      forestOffset += Math.max(...root.descendants().map((d3Node) => d3Node.x), 0) + 420;
    });

    // Any node the branch walk above didn't reach (e.g. isolated, or a
    // reference to a not-yet-loaded id) still gets a position so it isn't
    // silently dropped from the canvas.
    rawNodes
      .filter((node) => !placed.has(node.id))
      .forEach((node) => {
        positions.set(node.id, { x: forestOffset, y: 0 });
        forestOffset += 320;
      });

    // Same center-offset LineageMapView.vue uses (half the 260px card
    // width; ~half the card's rendered height) to convert a d3 anchor
    // point into the card's top-left position prop expects.
    return rawNodes.map((node) => {
      const point = positions.get(node.id);
      return {
        ...node,
        position: { x: point.x - 130, y: point.y - 58 },
      };
    });
  };

  const loadInitialTree = async (rootPersonId) => {
    isLoading.value = true;
    error.value = null;
    try {
      const rootData = await api.getPersonById(rootPersonId);
      const localNodes = [
        {
          id: rootData.id,
          type: "custom",
          data: { ...rootData, isExpanded: false, hasLoadedChildren: false },
        },
      ];
      const localEdges = [];

      if (rootData.childrenIds?.length) {
        const visibleIds = rootData.childrenIds.slice(0, MAX_VISIBLE_CHILDREN);
        const hiddenIds = rootData.childrenIds.slice(MAX_VISIBLE_CHILDREN);
        const children = await api.getPeopleByIds(visibleIds);
        children.forEach((child) => {
          localNodes.push({
            id: child.id,
            type: "custom",
            data: { ...child, isExpanded: false, hasLoadedChildren: false },
          });
          localEdges.push({
            id: `e-${rootData.id}-${child.id}`,
            source: rootData.id,
            target: child.id,
            type: "branch",
          });
        });
        if (hiddenIds.length) {
          localNodes.push({
            id: `more-${rootData.id}`,
            type: "seeMore",
            data: { parentId: rootData.id, hiddenCount: hiddenIds.length, hiddenIds },
          });
          localEdges.push({
            id: `more-edge-${rootData.id}`,
            source: rootData.id,
            target: `more-${rootData.id}`,
            type: "branch",
            class: "more-edge",
          });
        }
        localNodes[0].data.isExpanded = true;
        localNodes[0].data.hasLoadedChildren = true;
      }

      edges.value = withEdgeStrokeWidths(localNodes, localEdges);
      nodes.value = calculateLayout(localNodes, localEdges);
    } catch (err) {
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  };

  const loadLineageTree = (people, relationships) => {
    const localNodes = people.map((person) => ({
      id: person.id,
      type: 'custom',
      data: { ...person, isExpanded: true, hasLoadedChildren: true },
    }));
    const localEdges = relationships
      .filter((relationship) => relationship.type === 'parent_child')
      .map((relationship) => ({
        id: relationship.id,
        source: relationship.parentPersonId,
        target: relationship.childPersonId,
        type: 'branch',
      }));
    edges.value = withEdgeStrokeWidths(localNodes, localEdges);
    nodes.value = calculateLayout(localNodes, localEdges);
  };

  const expandChildBranch = async (parentNodeId, childrenIds) => {
    if (!childrenIds?.length) return;
    isLoading.value = true;
    try {
      const parentNode = nodes.value.find((n) => n.id === parentNodeId);
      if (parentNode) parentNode.data.isExpanded = true;

      const children = await api.getPeopleByIds(childrenIds);
      const nextNodes = [...nodes.value];
      const nextEdges = [...edges.value];

      children.forEach((child) => {
        if (!nextNodes.some((n) => n.id === child.id)) {
          nextNodes.push({
            id: child.id,
            type: "custom",
            data: { ...child, isExpanded: false, hasLoadedChildren: false },
          });
          nextEdges.push({
            id: `e-${parentNodeId}-${child.id}`,
            source: parentNodeId,
            target: child.id,
            type: "branch",
          });
        }
      });

      edges.value = withEdgeStrokeWidths(nextNodes, nextEdges);
      nodes.value = calculateLayout(nextNodes, nextEdges);
    } catch (err) {
      console.error(err);
    } finally {
      isLoading.value = false;
    }
  };

  // Swaps a "see more" marker for its real children, reusing the same
  // fetch-and-place logic expandChildBranch already does.
  const revealHiddenChildren = async (parentNodeId, hiddenIds) => {
    await expandChildBranch(parentNodeId, hiddenIds);
    const markerId = `more-${parentNodeId}`;
    const nextNodes = nodes.value.filter((node) => node.id !== markerId);
    const nextEdges = edges.value.filter((edge) => edge.id !== `more-edge-${parentNodeId}`);
    edges.value = withEdgeStrokeWidths(nextNodes, nextEdges);
    nodes.value = calculateLayout(nextNodes, nextEdges);
  };

  const collapseChildBranch = (parentNodeId) => {
    const parentNode = nodes.value.find((n) => n.id === parentNodeId);
    if (!parentNode) return;
    parentNode.data.isExpanded = false;

    const getDescendantIds = (id) => {
      let ids = [];
      edges.value
        .filter((e) => e.source === id)
        .forEach((edge) => {
          ids.push(edge.target);
          ids = [...ids, ...getDescendantIds(edge.target)];
        });
      return ids;
    };

    const targetIds = getDescendantIds(parentNodeId);

    // Clean up both nodes and edges
    const filteredNodes = nodes.value.filter((n) => !targetIds.includes(n.id));
    const filteredEdges = edges.value.filter(
      (e) => !targetIds.includes(e.target),
    );

    edges.value = filteredEdges;
    nodes.value = calculateLayout(filteredNodes, filteredEdges);
  };

  return {
    nodes,
    edges,
    isLoading,
    error,
    loadInitialTree,
    loadLineageTree,
    expandChildBranch,
    collapseChildBranch,
    revealHiddenChildren,
  };
}
