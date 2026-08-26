import { ref } from "vue";
import { api } from "@/api";
import dagre from "dagre";

export function useLineage() {
  const nodes = ref([]);
  const edges = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

  // 1. Configure Dagre dimensions to match your CustomNode size (width: 260px, height: ~120px)
  const NODE_WIDTH = 260;
  const NODE_HEIGHT = 120;
  // Same cap as the public lineage map, so no generation ever floods the
  // canvas — the rest surface behind a "see more" node instead.
  const MAX_VISIBLE_CHILDREN = 8;

  const graphLayout = new dagre.graphlib.Graph();

  // 2. Change 'rankdir' from 'LR' to 'TB' (Top-to-Bottom)
  graphLayout.setGraph({
    rankdir: "TB",
    nodesep: 50, // Horizontal spacing between sibling nodes
    ranksep: 80, // Vertical spacing between parent/child generations
  });
  graphLayout.setDefaultEdgeLabel(() => ({}));

  const calculateLayout = (rawNodes, rawEdges) => {
    graphLayout.nodes().forEach((n) => graphLayout.removeNode(n));
    rawEdges.forEach((e) => graphLayout.removeEdge(e.source, e.target));

    // 3. Register nodes with matching dimensions
    rawNodes.forEach((node) => {
      graphLayout.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });
    rawEdges.forEach((edge) => graphLayout.setEdge(edge.source, edge.target));

    dagre.layout(graphLayout);

    return rawNodes.map((node) => {
      const nodeLayout = graphLayout.node(node.id);
      return {
        ...node,
        // 4. Center-offset calculated from updated dimensions
        position: {
          x: nodeLayout.x - NODE_WIDTH / 2,
          y: nodeLayout.y - NODE_HEIGHT / 2,
        },
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

      edges.value = localEdges;
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
    edges.value = localEdges;
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

      edges.value = nextEdges;
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
    edges.value = nextEdges;
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
