const NODES = {
  INGEST: "ingest",
  NORMALIZE: "normalize",
  CHUNK: "chunk",
  OBSERVE: "observe",
  CONNECT: "connect",
  UNDERSTAND: "understand",
  REFLECT: "reflect",
  BUILD_MODEL: "build_model",
  GENERATE_VIEWS: "generate_views"
};

const DEFAULT_GRAPH = {
  nodes: [
    { id: NODES.INGEST, dependencies: [] },
    { id: NODES.NORMALIZE, dependencies: [NODES.INGEST] },
    { id: NODES.CHUNK, dependencies: [NODES.NORMALIZE] },
    { id: NODES.OBSERVE, dependencies: [NODES.CHUNK] },
    { id: NODES.CONNECT, dependencies: [NODES.OBSERVE] },
    { id: NODES.UNDERSTAND, dependencies: [NODES.CONNECT] },
    { id: NODES.REFLECT, dependencies: [NODES.UNDERSTAND] },
    { id: NODES.BUILD_MODEL, dependencies: [NODES.REFLECT] },
    { id: NODES.GENERATE_VIEWS, dependencies: [NODES.BUILD_MODEL] }
  ]
};

const getDownstreamNodes = (nodeId) => {
  const visited = new Set();
  const result = [];

  const walk = (id) => {
    if (visited.has(id)) return;
    visited.add(id);
    const downstream = DEFAULT_GRAPH.nodes.filter(
      (n) => n.dependencies.includes(id)
    );
    for (const node of downstream) {
      if (!visited.has(node.id)) {
        result.push(node.id);
        walk(node.id);
      }
    }
  };

  walk(nodeId);
  return result;
};

const getDependencyChain = (nodeId) => {
  const node = DEFAULT_GRAPH.nodes.find((n) => n.id === nodeId);
  if (!node) return [];

  const visited = new Set();
  const chain = [];

  const walk = (id) => {
    if (visited.has(id)) return;
    visited.add(id);

    const depNode = DEFAULT_GRAPH.nodes.find((n) => n.id === id);
    if (!depNode) return;

    for (const dep of depNode.dependencies) {
      walk(dep);
    }
    if (!chain.includes(id)) chain.push(id);
  };

  walk(nodeId);
  return chain;
};

const getReadyNodes = (completedNodeIds) => {
  const completed = new Set(completedNodeIds);
  return DEFAULT_GRAPH.nodes
    .filter((node) => {
      if (completed.has(node.id)) return false;
      return node.dependencies.every((dep) => completed.has(dep));
    })
    .map((n) => n.id);
};

module.exports = {
  NODES,
  DEFAULT_GRAPH,
  getDownstreamNodes,
  getDependencyChain,
  getReadyNodes
};
