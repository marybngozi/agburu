import { ref } from 'vue';
import { api } from '@/api';
import dagre from 'dagre';

export function useLineage() {
  const nodes = ref([]);
  const edges = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

  const graphLayout = new dagre.graphlib.Graph();
  graphLayout.setGraph({ rankdir: 'LR', nodesep: 80, ranksep: 120 });
  graphLayout.setDefaultEdgeLabel(() => ({}));

  const calculateLayout = (rawNodes, rawEdges) => {
    graphLayout.nodes().forEach(n => graphLayout.removeNode(n));
    rawEdges.forEach(e => graphLayout.removeEdge(e.source, e.target));

    rawNodes.forEach(node => graphLayout.setNode(node.id, { width: 180, height: 80 }));
    rawEdges.forEach(edge => graphLayout.setEdge(edge.source, edge.target));

    dagre.layout(graphLayout);

    return rawNodes.map(node => {
      const nodeLayout = graphLayout.node(node.id);
      return {
        ...node,
        position: { x: nodeLayout.x - 90, y: nodeLayout.y - 40 }
      };
    });
  };

  const loadInitialTree = async (rootPersonId) => {
    isLoading.value = true;
    error.value = null;
    try {
      const rootData = await api.getPersonById(rootPersonId);
      const localNodes = [{
        id: rootData.id,
        type: 'custom',
        data: { ...rootData, isExpanded: false, hasLoadedChildren: false }
      }];
      const localEdges = [];

      if (rootData.childrenIds?.length) {
        const children = await api.getPeopleByIds(rootData.childrenIds);
        children.forEach(child => {
          localNodes.push({
            id: child.id,
            type: 'custom',
            data: { ...child, isExpanded: false, hasLoadedChildren: false }
          });
          localEdges.push({
            id: `e-${rootData.id}-${child.id}`,
            source: rootData.id,
            target: child.id,
            type: 'smoothstep'
          });
        });
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

  const expandChildBranch = async (parentNodeId, childrenIds) => {
    if (!childrenIds?.length) return;
    isLoading.value = true;
    try {
      const parentNode = nodes.value.find(n => n.id === parentNodeId);
      if (parentNode) parentNode.data.isExpanded = true;

      const children = await api.getPeopleByIds(childrenIds);
      const nextNodes = [...nodes.value];
      const nextEdges = [...edges.value];

      children.forEach(child => {
        if (!nextNodes.some(n => n.id === child.id)) {
          nextNodes.push({
            id: child.id,
            type: 'custom',
            data: { ...child, isExpanded: false, hasLoadedChildren: false }
          });
          nextEdges.push({
            id: `e-${parentNodeId}-${child.id}`,
            source: parentNodeId,
            target: child.id,
            type: 'smoothstep'
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

  const collapseChildBranch = (parentNodeId) => {
    const parentNode = nodes.value.find(n => n.id === parentNodeId);
    if (!parentNode) return;
    parentNode.data.isExpanded = false;

    const getDescendantIds = (id) => {
      let ids = [];
      edges.value.filter(e => e.source === id).forEach(edge => {
        ids.push(edge.target);
        ids = [...ids, ...getDescendantIds(edge.target)];
      });
      return ids;
    };

    const targetIds = getDescendantIds(parentNodeId);
    nodes.value = calculateLayout(
      nodes.value.filter(n => !targetIds.includes(n.id)),
      edges.value.filter(e => !targetIds.includes(e.target))
    );
  };

  return { nodes, edges, isLoading, error, loadInitialTree, expandChildBranch, collapseChildBranch };
}