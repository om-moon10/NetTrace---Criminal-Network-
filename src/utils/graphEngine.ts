import { Entity, EvidenceEdge, EntityCentrality, DisruptionSimulationResult } from '../types';

export const getEndpointId = (endpoint: any): string => {
  if (typeof endpoint === 'object' && endpoint !== null && 'id' in endpoint) {
    return String(endpoint.id);
  }
  return String(endpoint || '');
};

/**
 * Calculates centralities for all nodes in the graph using graph theory algorithms.
 */
export function calculateCentralities(nodes: Entity[], edges: EvidenceEdge[]): Map<string, EntityCentrality> {
  const nodeMap = new Map<string, Entity>();
  const adjacency = new Map<string, Set<string>>();
  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();

  nodes.forEach((n) => {
    nodeMap.set(n.id, n);
    adjacency.set(n.id, new Set());
    inDegree.set(n.id, 0);
    outDegree.set(n.id, 0);
  });

  edges.forEach((e) => {
    const s = getEndpointId(e.source);
    const t = getEndpointId(e.target);
    if (adjacency.has(s) && adjacency.has(t)) {
      adjacency.get(s)!.add(t);
      if (e.direction === 'bidirectional') {
        adjacency.get(t)!.add(s);
      }
      outDegree.set(s, (outDegree.get(s) || 0) + 1);
      inDegree.set(t, (inDegree.get(t) || 0) + 1);
    }
  });

  const N = nodes.length;
  const centralities = new Map<string, EntityCentrality>();

  if (N <= 1) {
    nodes.forEach((n) => {
      centralities.set(n.id, {
        betweenness: 0,
        degree: 0,
        closeness: 1,
        pageRank: 1,
        disruptionImpact: 0,
      });
    });
    return centralities;
  }

  // --- Brandes Algorithm for Betweenness Centrality ---
  const CB = new Map<string, number>();
  nodes.forEach((n) => CB.set(n.id, 0));

  nodes.forEach((s) => {
    const S: string[] = [];
    const P = new Map<string, string[]>();
    nodes.forEach((w) => P.set(w.id, []));

    const sigma = new Map<string, number>();
    nodes.forEach((t) => sigma.set(t.id, 0));
    sigma.set(s.id, 1);

    const d = new Map<string, number>();
    nodes.forEach((t) => d.set(t.id, -1));
    d.set(s.id, 0);

    const Q: string[] = [s.id];

    while (Q.length > 0) {
      const v = Q.shift()!;
      S.push(v);

      const neighbors = adjacency.get(v) || new Set();
      neighbors.forEach((w) => {
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

    const delta = new Map<string, number>();
    nodes.forEach((w) => delta.set(w.id, 0));

    while (S.length > 0) {
      const w = S.pop()!;
      P.get(w)!.forEach((v) => {
        const c = (sigma.get(v)! / (sigma.get(w) || 1)) * (1 + delta.get(w)!);
        delta.set(v, delta.get(v)! + c);
      });
      if (w !== s.id) {
        CB.set(w, CB.get(w)! + delta.get(w)!);
      }
    }
  });

  // Normalize betweenness
  const scale = (N - 1) * (N - 2);
  const maxB = scale > 0 ? scale : 1;

  // --- Closeness Centrality ---
  const CC = new Map<string, number>();
  nodes.forEach((s) => {
    const d = new Map<string, number>();
    nodes.forEach((t) => d.set(t.id, -1));
    d.set(s.id, 0);
    const Q: string[] = [s.id];
    let totalDist = 0;
    let reachable = 0;

    while (Q.length > 0) {
      const v = Q.shift()!;
      const neighbors = adjacency.get(v) || new Set();
      neighbors.forEach((w) => {
        if (d.get(w)! < 0) {
          d.set(w, d.get(v)! + 1);
          totalDist += d.get(w)!;
          reachable++;
          Q.push(w);
        }
      });
    }

    if (totalDist > 0 && reachable > 0) {
      CC.set(s.id, (reachable / (N - 1)) * (reachable / totalDist));
    } else {
      CC.set(s.id, 0);
    }
  });

  // --- PageRank Approximation (Power Iteration) ---
  const damping = 0.85;
  const PR = new Map<string, number>();
  nodes.forEach((n) => PR.set(n.id, 1 / N));

  for (let iter = 0; iter < 15; iter++) {
    const nextPR = new Map<string, number>();
    const base = (1 - damping) / N;
    nodes.forEach((n) => nextPR.set(n.id, base));

    nodes.forEach((u) => {
      const neighbors = adjacency.get(u.id) || new Set();
      if (neighbors.size > 0) {
        const share = (damping * PR.get(u.id)!) / neighbors.size;
        neighbors.forEach((v) => {
          nextPR.set(v, (nextPR.get(v) || 0) + share);
        });
      } else {
        // Sink node distribute evenly
        const share = (damping * PR.get(u.id)!) / N;
        nodes.forEach((v) => {
          nextPR.set(v.id, (nextPR.get(v.id) || 0) + share);
        });
      }
    });

    nodes.forEach((n) => PR.set(n.id, nextPR.get(n.id)!));
  }

  // Aggregate Centralities & Disruption Impact
  nodes.forEach((n) => {
    const rawBetweenness = (CB.get(n.id) || 0) / maxB;
    const normBetweenness = Math.min(1, rawBetweenness * 2.5); // Boost visibility
    const degree = (outDegree.get(n.id) || 0) + (inDegree.get(n.id) || 0);
    const normDegree = Math.min(1, degree / Math.max(1, N - 1));
    const closeness = CC.get(n.id) || 0;
    const pr = (PR.get(n.id) || 0) * N;

    // Disruption Impact Formula combining Betweenness (bridge role), Degree (hub role), & Risk score
    const roleWeight = n.role === 'kingpin' ? 1.5 : n.role === 'facilitator' ? 1.3 : n.role === 'c2_controller' ? 1.4 : 1.0;
    const impactScore = Math.min(100, Math.round((normBetweenness * 45 + normDegree * 25 + (n.riskScore / 100) * 30) * roleWeight));

    centralities.set(n.id, {
      betweenness: Number(normBetweenness.toFixed(4)),
      degree: degree,
      closeness: Number(closeness.toFixed(4)),
      pageRank: Number(pr.toFixed(4)),
      disruptionImpact: impactScore,
    });
  });

  return centralities;
}

/**
 * Finds connected components in an undirected projection of the network.
 */
export function findConnectedComponents(nodes: Entity[], edges: EvidenceEdge[], excludeNodeIds: Set<string> = new Set()): string[][] {
  const activeNodes = nodes.filter((n) => !excludeNodeIds.has(n.id));
  const activeNodeMap = new Set(activeNodes.map((n) => n.id));
  const adj = new Map<string, Set<string>>();

  activeNodes.forEach((n) => adj.set(n.id, new Set()));

  edges.forEach((e) => {
    const s = getEndpointId(e.source);
    const t = getEndpointId(e.target);
    if (activeNodeMap.has(s) && activeNodeMap.has(t) && !excludeNodeIds.has(s) && !excludeNodeIds.has(t)) {
      adj.get(s)?.add(t);
      adj.get(t)?.add(s);
    }
  });

  const visited = new Set<string>();
  const components: string[][] = [];

  activeNodes.forEach((n) => {
    if (!visited.has(n.id)) {
      const comp: string[] = [];
      const queue = [n.id];
      visited.add(n.id);

      while (queue.length > 0) {
        const curr = queue.shift()!;
        comp.push(curr);
        adj.get(curr)?.forEach((nbr) => {
          if (!visited.has(nbr)) {
            visited.add(nbr);
            queue.push(nbr);
          }
        });
      }
      components.push(comp);
    }
  });

  return components.sort((a, b) => b.length - a.length);
}

/**
 * Disruption & Counterfactual Simulation:
 * Simulates removal of specific node IDs (e.g. seized wallets, frozen servers, indicted actors)
 * and returns precise fragmentation, component splits, severed flow, and optimal cut rankings.
 */
export function simulateDisruption(nodes: Entity[], edges: EvidenceEdge[], removedIds: string[]): DisruptionSimulationResult {
  const removedSet = new Set(removedIds);
  const baselineComponents = findConnectedComponents(nodes, edges);
  const totalFlowUSD = edges.reduce((acc, e) => acc + (e.value || 0), 0);

  const remainingNodes = nodes.filter((n) => !removedSet.has(n.id));
  const remainingEdges = edges.filter((e) => {
    const s = getEndpointId(e.source);
    const t = getEndpointId(e.target);
    return !removedSet.has(s) && !removedSet.has(t);
  });
  const remainingFlowUSD = remainingEdges.reduce((acc, e) => acc + (e.value || 0), 0);

  const simulatedComponents = findConnectedComponents(nodes, edges, removedSet);
  const isolatedNodes = remainingNodes.filter((n) => {
    const hasEdge = remainingEdges.some((e) => {
      const s = getEndpointId(e.source);
      const t = getEndpointId(e.target);
      return s === n.id || t === n.id;
    });
    return !hasEdge;
  });

  // Calculate network density
  const maxPossibleEdges = (nodes.length * (nodes.length - 1)) / 2;
  const baselineDensity = maxPossibleEdges > 0 ? edges.length / maxPossibleEdges : 0;

  const remMaxEdges = (remainingNodes.length * (remainingNodes.length - 1)) / 2;
  const simDensity = remMaxEdges > 0 ? remainingEdges.length / remMaxEdges : 0;

  // Disruption score (0 - 100%)
  const flowLossPct = totalFlowUSD > 0 ? ((totalFlowUSD - remainingFlowUSD) / totalFlowUSD) * 50 : 0;
  const fragLossPct = nodes.length > 0 ? ((simulatedComponents.length - baselineComponents.length + isolatedNodes.length) / nodes.length) * 50 : 0;
  const disruptionPercentage = Math.min(100, Math.round(flowLossPct + fragLossPct + (removedIds.length > 0 ? 15 : 0)));

  // Component breakdown
  const componentSplits = simulatedComponents.map((nodeIds, idx) => {
    const compNodes = remainingNodes.filter((n) => nodeIds.includes(n.id));
    const compEdges = remainingEdges.filter((e) => {
      const s = getEndpointId(e.source);
      const t = getEndpointId(e.target);
      return nodeIds.includes(s) && nodeIds.includes(t);
    });
    const flow = compEdges.reduce((sum, e) => sum + (e.value || 0), 0);

    // Find dominant role
    const roleCounts: Record<string, number> = {};
    compNodes.forEach((n) => {
      roleCounts[n.role] = (roleCounts[n.role] || 0) + 1;
    });
    const dominantRole = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'mixed';

    return {
      id: idx + 1,
      size: nodeIds.length,
      nodeIds,
      dominantRole,
      flowValueUSD: flow,
    };
  });

  // Compute Optimal Interdiction Targets (Single Node Cut Analysis)
  const optimalCutRankings = remainingNodes.map((targetNode) => {
    const testSet = new Set([...removedIds, targetNode.id]);
    const testComps = findConnectedComponents(nodes, edges, testSet);
    const testEdges = edges.filter((e) => {
      const s = getEndpointId(e.source);
      const t = getEndpointId(e.target);
      return !testSet.has(s) && !testSet.has(t);
    });
    const testFlow = testEdges.reduce((acc, e) => acc + (e.value || 0), 0);
    const flowDiff = remainingFlowUSD - testFlow;

    const b = targetNode.centrality?.betweenness || 0;
    const d = targetNode.centrality?.degree || 0;
    const r = targetNode.riskScore;

    const cutScore = Math.min(100, Math.round(b * 40 + (testComps.length - simulatedComponents.length) * 20 + (flowDiff / (remainingFlowUSD || 1)) * 30 + (r / 100) * 10));

    let reason = 'Key transit bridge in the financial laundering conduit';
    if (targetNode.role === 'kingpin') reason = 'Syndicate command nexus; seizure collapses subordinate command chains';
    else if (targetNode.role === 'facilitator') reason = 'Critical money laundering exchange conduit linking multiple mule rings';
    else if (targetNode.role === 'c2_controller') reason = 'Primary command and control infrastructure node';
    else if (b > 0.4) reason = 'Top bottleneck articulation point; removal isolates sub-networks';

    return {
      nodeId: targetNode.id,
      nodeName: targetNode.name || targetNode.label,
      role: targetNode.role,
      type: targetNode.type,
      disruptionScore: cutScore,
      reason,
    };
  }).sort((a, b) => b.disruptionScore - a.disruptionScore).slice(0, 5);

  return {
    removedNodeIds: removedIds,
    baseline: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      componentsCount: baselineComponents.length,
      networkDensity: Number(baselineDensity.toFixed(3)),
      totalFlowUSD,
      isolatedNodesCount: 0,
      disruptionPercentage: 0,
    },
    simulated: {
      totalNodes: remainingNodes.length,
      totalEdges: remainingEdges.length,
      componentsCount: simulatedComponents.length,
      networkDensity: Number(simDensity.toFixed(3)),
      totalFlowUSD: remainingFlowUSD,
      isolatedNodesCount: isolatedNodes.length,
      disruptionPercentage,
    },
    componentSplits,
    disconnectedNodes: isolatedNodes,
    optimalCutRankings,
  };
}

/**
 * Dijkstra Shortest Path Finder between Source and Target node.
 */
export function findShortestPath(
  nodes: Entity[],
  edges: EvidenceEdge[],
  sourceId: string,
  targetId: string
): { pathNodeIds: string[]; pathEdgeIds: string[]; totalDistance: number; totalFlowUSD: number } | null {
  const adj = new Map<string, { target: string; edgeId: string; weight: number; value: number }[]>();
  nodes.forEach((n) => adj.set(n.id, []));

  edges.forEach((e) => {
    const s = getEndpointId(e.source);
    const t = getEndpointId(e.target);
    if (adj.has(s) && adj.has(t)) {
      adj.get(s)!.push({ target: t, edgeId: e.id, weight: 1, value: e.value || 0 });
      if (e.direction === 'bidirectional') {
        adj.get(t)!.push({ target: s, edgeId: e.id, weight: 1, value: e.value || 0 });
      }
    }
  });

  const dist = new Map<string, number>();
  const prev = new Map<string, { from: string; edgeId: string; value: number } | null>();
  const visited = new Set<string>();
  const queue: { id: string; d: number }[] = [];

  nodes.forEach((n) => {
    dist.set(n.id, Infinity);
    prev.set(n.id, null);
  });

  dist.set(sourceId, 0);
  queue.push({ id: sourceId, d: 0 });

  while (queue.length > 0) {
    queue.sort((a, b) => a.d - b.d);
    const { id: u, d } = queue.shift()!;

    if (u === targetId) break;
    if (visited.has(u)) continue;
    visited.add(u);

    const neighbors = adj.get(u) || [];
    for (const nbr of neighbors) {
      if (visited.has(nbr.target)) continue;
      const alt = d + nbr.weight;
      if (alt < dist.get(nbr.target)!) {
        dist.set(nbr.target, alt);
        prev.set(nbr.target, { from: u, edgeId: nbr.edgeId, value: nbr.value });
        queue.push({ id: nbr.target, d: alt });
      }
    }
  }

  if (dist.get(targetId) === Infinity) {
    return null;
  }

  const pathNodeIds: string[] = [];
  const pathEdgeIds: string[] = [];
  let totalFlowUSD = 0;
  let curr: string | null = targetId;

  while (curr) {
    pathNodeIds.unshift(curr);
    const p = prev.get(curr);
    if (p) {
      pathEdgeIds.unshift(p.edgeId);
      totalFlowUSD += p.value;
      curr = p.from;
    } else {
      curr = null;
    }
  }

  return {
    pathNodeIds,
    pathEdgeIds,
    totalDistance: pathNodeIds.length - 1,
    totalFlowUSD,
  };
}
