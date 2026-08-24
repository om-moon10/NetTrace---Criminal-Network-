export interface GraphNode {
  id: string;
  label: string;
  name: string;
  type: string;
  threat_level?: string;
  role?: string;
  risk_score?: number;
  confidence_score?: number;
  cluster_id?: string;
  metadata?: any;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  label?: string;
  value?: number;
  confidence?: number;
  protocol?: string;
  timestamp?: string;
  notes?: string;
}

export interface NodeMetrics {
  inDegree: number;
  outDegree: number;
  totalDegree: number;
  degreeCentrality: number;
  betweennessCentrality: number;
  closenessCentrality: number;
  isBridgeCandidate: boolean;
  crossClusterEdges: number;
  clusterId?: string;
}

export interface GraphMetrics {
  totalNodes: number;
  totalEdges: number;
  density: number;
  connectedComponentsCount: number;
  components: { id: number; nodeIds: string[]; size: number }[];
  clustersCount: number;
  bridgeNodeCandidates: string[];
  nodeMetrics: Record<string, NodeMetrics>;
  totalTransactionVolumeUSD: number;
}

/**
 * Calculates in-memory graph metrics using deterministic graph algorithms
 */
export function analyzeGraph(nodes: GraphNode[], edges: GraphEdge[]): GraphMetrics {
  const n = nodes.length;
  if (n === 0) {
    return {
      totalNodes: 0,
      totalEdges: 0,
      density: 0,
      connectedComponentsCount: 0,
      components: [],
      clustersCount: 0,
      bridgeNodeCandidates: [],
      nodeMetrics: {},
      totalTransactionVolumeUSD: 0,
    };
  }

  const nodeMap = new Map<string, GraphNode>();
  const inEdges = new Map<string, string[]>();
  const outEdges = new Map<string, string[]>();
  const neighbors = new Map<string, Set<string>>();

  nodes.forEach((node) => {
    // Normalize cluster_id across snake_case and camelCase
    if (!node.cluster_id && (node as any).clusterId) {
      node.cluster_id = (node as any).clusterId;
    }
    nodeMap.set(node.id, node);
    inEdges.set(node.id, []);
    outEdges.set(node.id, []);
    neighbors.set(node.id, new Set());
  });

  let totalVolume = 0;
  edges.forEach((edge) => {
    if (edge.value) {
      totalVolume += Number(edge.value);
    }
    if (outEdges.has(edge.source)) {
      outEdges.get(edge.source)!.push(edge.target);
    }
    if (inEdges.has(edge.target)) {
      inEdges.get(edge.target)!.push(edge.source);
    }
    if (neighbors.has(edge.source) && neighbors.has(edge.target)) {
      neighbors.get(edge.source)!.add(edge.target);
      neighbors.get(edge.target)!.add(edge.source);
    }
  });

  // 1. Density: 2 * |E| / (V * (V - 1)) for undirected
  const maxPossibleEdges = n > 1 ? (n * (n - 1)) / 2 : 1;
  const density = edges.length / (2 * maxPossibleEdges);

  // 2. Connected Components (BFS)
  const visited = new Set<string>();
  const components: { id: number; nodeIds: string[]; size: number }[] = [];
  let compId = 1;

  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      const compNodes: string[] = [];
      const queue: string[] = [node.id];
      visited.add(node.id);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        compNodes.push(curr);
        const adj = neighbors.get(curr) || new Set();
        adj.forEach((nbr) => {
          if (!visited.has(nbr)) {
            visited.add(nbr);
            queue.push(nbr);
          }
        });
      }

      components.push({
        id: compId++,
        nodeIds: compNodes,
        size: compNodes.length,
      });
    }
  });

  // 3. Cluster identification based on node cluster_id or connected subgraphs
  const uniqueClusters = new Set<string>();
  nodes.forEach((node) => {
    if (node.cluster_id) uniqueClusters.add(node.cluster_id);
  });
  const clustersCount = Math.max(uniqueClusters.size, components.length);

  // 4. Betweenness Centrality (Brandes Algorithm)
  const betweenness = new Map<string, number>();
  nodes.forEach((node) => betweenness.set(node.id, 0));

  nodes.forEach((s) => {
    const S: string[] = [];
    const P = new Map<string, string[]>();
    const sigma = new Map<string, number>();
    const d = new Map<string, number>();

    nodes.forEach((w) => {
      P.set(w.id, []);
      sigma.set(w.id, 0);
      d.set(w.id, -1);
    });

    sigma.set(s.id, 1);
    d.set(s.id, 0);

    const Q: string[] = [s.id];

    while (Q.length > 0) {
      const v = Q.shift()!;
      S.push(v);

      const adj = neighbors.get(v) || new Set();
      adj.forEach((w) => {
        // Path discovery
        if (d.get(w)! < 0) {
          Q.push(w);
          d.set(w, d.get(v)! + 1);
        }
        // Path counting
        if (d.get(w) === d.get(v)! + 1) {
          sigma.set(w, sigma.get(w)! + sigma.get(v)!);
          P.get(w)!.push(v);
        }
      });
    }

    // Accumulation
    const delta = new Map<string, number>();
    nodes.forEach((w) => delta.set(w.id, 0));

    while (S.length > 0) {
      const w = S.pop()!;
      const predecessors = P.get(w) || [];
      for (const v of predecessors) {
        const coeff = (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!);
        delta.set(v, delta.get(v)! + coeff);
      }
      if (w !== s.id) {
        betweenness.set(w, betweenness.get(w)! + delta.get(w)!);
      }
    }
  });

  // Normalize betweenness for undirected graph: 2 / ((n - 1) * (n - 2))
  const normFactor = n > 2 ? 2 / ((n - 1) * (n - 2)) : 1;
  const normBetweenness = new Map<string, number>();
  nodes.forEach((node) => {
    const raw = betweenness.get(node.id) || 0;
    // Divide by 2 because undirected counts each pair twice in Brandes
    normBetweenness.set(node.id, (raw / 2) * normFactor);
  });

  // 5. Articulation points / Bridge node candidate detection (Tarjan algorithm)
  const bridgeNodeCandidates: string[] = [];
  const disc = new Map<string, number>();
  const low = new Map<string, number>();
  const parent = new Map<string, string | null>();
  const apSet = new Set<string>();
  let timer = 0;

  function dfsAP(u: string) {
    disc.set(u, timer);
    low.set(u, timer);
    timer++;
    let children = 0;

    const adj = neighbors.get(u) || new Set();
    adj.forEach((v) => {
      if (!disc.has(v)) {
        children++;
        parent.set(v, u);
        dfsAP(v);

        low.set(u, Math.min(low.get(u)!, low.get(v)!));

        if (parent.get(u) === null && children > 1) {
          apSet.add(u);
        }
        if (parent.get(u) !== null && low.get(v)! >= disc.get(u)!) {
          apSet.add(u);
        }
      } else if (v !== parent.get(u)) {
        low.set(u, Math.min(low.get(u)!, disc.get(v)!));
      }
    });
  }

  nodes.forEach((node) => {
    if (!disc.has(node.id)) {
      parent.set(node.id, null);
      dfsAP(node.id);
    }
  });

  // Also include nodes that connect to multiple different cluster_ids
  nodes.forEach((node) => {
    const nbrs = neighbors.get(node.id) || new Set();
    const adjacentClusters = new Set<string>();
    nbrs.forEach((nbrId) => {
      const nbrNode = nodeMap.get(nbrId);
      if (nbrNode && nbrNode.cluster_id && nbrNode.cluster_id !== node.cluster_id) {
        adjacentClusters.add(nbrNode.cluster_id);
      }
    });

    if (apSet.has(node.id) || adjacentClusters.size >= 2 || (normBetweenness.get(node.id) || 0) > 0.15) {
      bridgeNodeCandidates.push(node.id);
    }
  });

  // 6. Build per-node metrics
  const nodeMetrics: Record<string, NodeMetrics> = {};

  nodes.forEach((node) => {
    const inDeg = inEdges.get(node.id)?.length || 0;
    const outDeg = outEdges.get(node.id)?.length || 0;
    const totDeg = (neighbors.get(node.id) || new Set()).size;
    const degCentrality = n > 1 ? totDeg / (n - 1) : 0;
    const bCent = normBetweenness.get(node.id) || 0;

    // Cross-cluster connections count
    let crossClusterEdges = 0;
    const nbrs = neighbors.get(node.id) || new Set();
    nbrs.forEach((nbrId) => {
      const nbrNode = nodeMap.get(nbrId);
      if (nbrNode && node.cluster_id && nbrNode.cluster_id && nbrNode.cluster_id !== node.cluster_id) {
        crossClusterEdges++;
      }
    });

    nodeMetrics[node.id] = {
      inDegree: inDeg,
      outDegree: outDeg,
      totalDegree: totDeg,
      degreeCentrality: Number(degCentrality.toFixed(4)),
      betweennessCentrality: Number(bCent.toFixed(4)),
      closenessCentrality: Number(((degCentrality + bCent) / 2).toFixed(4)),
      isBridgeCandidate: bridgeNodeCandidates.includes(node.id),
      crossClusterEdges,
      clusterId: node.cluster_id,
    };
  });

  return {
    totalNodes: n,
    totalEdges: edges.length,
    density: Number(density.toFixed(4)),
    connectedComponentsCount: components.length,
    components,
    clustersCount,
    bridgeNodeCandidates,
    nodeMetrics,
    totalTransactionVolumeUSD: totalVolume,
  };
}
