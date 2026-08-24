import { analyzeGraph, GraphNode, GraphEdge } from './graphEngine';
import { calculateNetworkRisk } from './riskEngine';

export interface SimulationRequest {
  investigationId: string;
  entityId?: string;
  entityIds?: string[];
}

export interface SimulationResult {
  targetEntityIds: string[];
  targetEntities: { id: string; name: string; label: string; type: string }[];
  before: {
    networkSize: number;
    totalEdges: number;
    clusters: number;
    density: number;
    riskScore: number;
    riskLevel: string;
    totalVolumeUSD: number;
  };
  after: {
    networkSize: number;
    totalEdges: number;
    clusters: number;
    density: number;
    riskScore: number;
    riskLevel: string;
    totalVolumeUSD: number;
  };
  difference: {
    nodesRemoved: number;
    edgesSevered: number;
    volumeDisruptedUSD: number;
    disruptionPercentage: number;
    clusterIncrease: number;
    isolatedNodesCount: number;
  };
  disruptedNodes: { id: string; name: string; label: string; type: string }[];
  isolatedNodes: { id: string; name: string; label: string; type: string }[];
  componentSplits: { id: number; size: number; nodeLabels: string[] }[];
  disruption_level: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  explanation: string;
}

export function simulateNetworkDisruption(
  nodes: GraphNode[],
  edges: GraphEdge[],
  evidence: any[],
  timeline: any[],
  removedIds: string[]
): SimulationResult {
  const removeSet = new Set(removedIds);
  const targetEntities = nodes.filter((n) => removeSet.has(n.id)).map((n) => ({
    id: n.id,
    name: n.name,
    label: n.label,
    type: n.type,
  }));

  // Baseline (Before)
  const baselineMetrics = analyzeGraph(nodes, edges);
  const baselineRisk = calculateNetworkRisk(nodes, edges, evidence, timeline, baselineMetrics);

  // Filtered Graph (After)
  const remainingNodes = nodes.filter((n) => !removeSet.has(n.id));
  const remainingEdges = edges.filter((e) => !removeSet.has(e.source) && !removeSet.has(e.target));

  const afterMetrics = analyzeGraph(remainingNodes, remainingEdges);
  const afterRisk = calculateNetworkRisk(remainingNodes, remainingEdges, evidence, timeline, afterMetrics);

  // Identify disconnected or isolated nodes (nodes whose degree dropped to 0 after removal)
  const isolatedNodes = remainingNodes
    .filter((n) => (afterMetrics.nodeMetrics[n.id]?.totalDegree || 0) === 0)
    .map((n) => ({ id: n.id, name: n.name, label: n.label, type: n.type }));

  const severedEdges = edges.filter((e) => removeSet.has(e.source) || removeSet.has(e.target));
  let volumeDisrupted = 0;
  severedEdges.forEach((e) => {
    if (e.value) volumeDisrupted += Number(e.value);
  });

  const clusterDelta = afterMetrics.connectedComponentsCount - baselineMetrics.connectedComponentsCount;
  
  // Calculate disruption percentage based on severed edges, isolated nodes, and risk drop
  const edgeDropPct = baselineMetrics.totalEdges > 0 ? (severedEdges.length / baselineMetrics.totalEdges) * 45 : 0;
  const isolatedPct = baselineMetrics.totalNodes > 0 ? (isolatedNodes.length / baselineMetrics.totalNodes) * 35 : 0;
  const riskDropPct = ((baselineRisk.score - afterRisk.score) / (baselineRisk.score || 1)) * 20;
  
  const disruptionPct = Math.min(100, Math.max(5, Math.round(edgeDropPct + isolatedPct + Math.max(0, riskDropPct))));

  let disruptionLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' = 'MODERATE';
  if (disruptionPct >= 65 || clusterDelta >= 2) {
    disruptionLevel = 'CRITICAL';
  } else if (disruptionPct >= 45 || clusterDelta >= 1) {
    disruptionLevel = 'HIGH';
  } else if (disruptionPct >= 25) {
    disruptionLevel = 'MODERATE';
  } else {
    disruptionLevel = 'LOW';
  }

  // Component splits
  const nodeMap = new Map<string, GraphNode>();
  remainingNodes.forEach((n) => nodeMap.set(n.id, n));
  const componentSplits = afterMetrics.components.map((comp) => ({
    id: comp.id,
    size: comp.size,
    nodeLabels: comp.nodeIds.map((id) => nodeMap.get(id)?.label || id),
  }));

  const targetNames = targetEntities.map((t) => t.name).join(', ') || 'Selected Target';
  const explanation = `Simulated neutralization of [${targetNames}] severs ${severedEdges.length} active connection pathways and disrupts $${(volumeDisrupted / 1000000).toFixed(1)}M in verified transaction flow. The action fractures the network into ${afterMetrics.connectedComponentsCount} isolated sub-components and leaves ${isolatedNodes.length} downstream entities without upstream connectivity, reducing the overall investigative network risk rating from ${baselineRisk.score}/100 to ${afterRisk.score}/100.`;

  return {
    targetEntityIds: removedIds,
    targetEntities,
    before: {
      networkSize: baselineMetrics.totalNodes,
      totalEdges: baselineMetrics.totalEdges,
      clusters: baselineMetrics.connectedComponentsCount,
      density: baselineMetrics.density,
      riskScore: baselineRisk.score,
      riskLevel: baselineRisk.level,
      totalVolumeUSD: baselineMetrics.totalTransactionVolumeUSD,
    },
    after: {
      networkSize: afterMetrics.totalNodes,
      totalEdges: afterMetrics.totalEdges,
      clusters: afterMetrics.connectedComponentsCount,
      density: afterMetrics.density,
      riskScore: afterRisk.score,
      riskLevel: afterRisk.level,
      totalVolumeUSD: afterMetrics.totalTransactionVolumeUSD,
    },
    difference: {
      nodesRemoved: removedIds.length,
      edgesSevered: severedEdges.length,
      volumeDisruptedUSD: volumeDisrupted,
      disruptionPercentage: disruptionPct,
      clusterIncrease: Math.max(0, clusterDelta),
      isolatedNodesCount: isolatedNodes.length,
    },
    disruptedNodes: targetEntities,
    isolatedNodes,
    componentSplits,
    disruption_level: disruptionLevel,
    explanation,
  };
}
