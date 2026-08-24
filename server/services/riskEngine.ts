import { GraphMetrics } from './graphEngine';

export interface RiskBreakdown {
  transactionBehavior: number; // Max 25
  networkCentrality: number; // Max 20
  crossClusterConnectivity: number; // Max 20
  temporalCoordination: number; // Max 15
  threatIntelligence: number; // Max 10
  entityRelationships: number; // Max 10
}

export interface RiskEvaluation {
  score: number; // 0 - 100
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  breakdown: RiskBreakdown;
  indicators: string[];
  disclaimer: string;
}

export function calculateNetworkRisk(
  nodes: any[],
  edges: any[],
  evidence: any[],
  timeline: any[],
  graphMetrics: GraphMetrics
): RiskEvaluation {
  const indicators: string[] = [];

  // 1. Transaction Behavior (Weight: 25%)
  // Factors: High financial flow velocity, mixing patterns, cross-chain swaps
  const totalVolume = graphMetrics.totalTransactionVolumeUSD;
  let txScore = 0;
  if (totalVolume > 20000000) {
    txScore = 25;
    indicators.push(`High financial velocity: $${(totalVolume / 1000000).toFixed(1)}M monitored flow across entities`);
  } else if (totalVolume > 5000000) {
    txScore = 18;
    indicators.push(`Moderate-high transaction volume ($${(totalVolume / 1000000).toFixed(1)}M)`);
  } else if (totalVolume > 0) {
    txScore = 10;
  }

  // 2. Network Centrality (Weight: 20%)
  // Factors: High betweenness concentration, single points of failure (bottlenecks)
  let maxBetweenness = 0;
  Object.values(graphMetrics.nodeMetrics).forEach((m) => {
    if (m.betweennessCentrality > maxBetweenness) {
      maxBetweenness = m.betweennessCentrality;
    }
  });

  let centralityScore = 0;
  if (maxBetweenness > 0.25 || graphMetrics.bridgeNodeCandidates.length >= 3) {
    centralityScore = 20;
    indicators.push(`High topological bottleneck dependency (${graphMetrics.bridgeNodeCandidates.length} bridge-node candidates)`);
  } else if (maxBetweenness > 0.1) {
    centralityScore = 14;
    indicators.push('Moderate graph centralization around key hub addresses');
  } else {
    centralityScore = 8;
  }

  // 3. Cross-Cluster Connectivity (Weight: 20%)
  // Factors: Edges spanning across disparate functional clusters (e.g. C2 -> Mixer -> Escrow)
  let totalCrossClusterEdges = 0;
  Object.values(graphMetrics.nodeMetrics).forEach((m) => {
    totalCrossClusterEdges += m.crossClusterEdges;
  });

  let crossClusterScore = 0;
  if (totalCrossClusterEdges >= 8 && graphMetrics.clustersCount >= 3) {
    crossClusterScore = 20;
    indicators.push(`Extensive cross-cluster bridging detected across ${graphMetrics.clustersCount} functional subgraphs`);
  } else if (totalCrossClusterEdges >= 3) {
    crossClusterScore = 13;
    indicators.push('Inter-cluster flow bridging infrastructure and financial layers');
  } else {
    crossClusterScore = 6;
  }

  // 4. Temporal Coordination (Weight: 15%)
  // Factors: Rapid sequence of events, bursts in timeline
  let temporalScore = 0;
  if (timeline.length >= 10) {
    temporalScore = 15;
    indicators.push(`High temporal coordination (${timeline.length} correlated chronological events)`);
  } else if (timeline.length >= 5) {
    temporalScore = 10;
    indicators.push(`Moderate timeline event correlation (${timeline.length} events logged)`);
  } else {
    temporalScore = 5;
  }

  // 5. Threat Intelligence (Weight: 10%)
  // Factors: Evidence records matching known CVEs, C2 infrastructure, or SAR filings
  let threatScore = 0;
  const criticalEvidence = evidence.filter((e) => (e.confidence_weight || 0) >= 90);
  if (criticalEvidence.length >= 4) {
    threatScore = 10;
    indicators.push(`Strong external threat intelligence overlap (${criticalEvidence.length} high-confidence artifacts)`);
  } else if (evidence.length >= 2) {
    threatScore = 7;
  } else {
    threatScore = 3;
  }

  // 6. Entity Relationships (Weight: 10%)
  // Factors: Relationship density and presence of command / control / transfer patterns
  let relScore = 0;
  const criticalEntities = nodes.filter((n) => n.threat_level === 'critical' || (n.risk_score || 0) >= 85);
  if (criticalEntities.length >= 5) {
    relScore = 10;
    indicators.push(`${criticalEntities.length} critical high-threat entities identified in active topology`);
  } else if (criticalEntities.length >= 2) {
    relScore = 7;
  } else {
    relScore = 4;
  }

  const rawTotal = txScore + centralityScore + crossClusterScore + temporalScore + threatScore + relScore;
  const finalScore = Math.min(100, Math.max(0, Math.round(rawTotal)));

  let level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (finalScore >= 81) {
    level = 'CRITICAL';
  } else if (finalScore >= 61) {
    level = 'HIGH';
  } else if (finalScore >= 31) {
    level = 'MEDIUM';
  } else {
    level = 'LOW';
  }

  return {
    score: finalScore,
    level,
    breakdown: {
      transactionBehavior: txScore,
      networkCentrality: centralityScore,
      crossClusterConnectivity: crossClusterScore,
      temporalCoordination: temporalScore,
      threatIntelligence: threatScore,
      entityRelationships: relScore,
    },
    indicators,
    disclaimer: 'This investigative network risk score represents analytical topological and telemetry heuristics, not a definitive legal determination of criminality.',
  };
}

export function calculateEntityRisk(
  entity: any,
  nodeMetrics?: any,
  connectedEdges: any[] = []
): { score: number; level: string; breakdown: Record<string, number>; reasons: string[] } {
  let score = entity.risk_score || 50;
  const reasons: string[] = [];

  if (nodeMetrics) {
    if (nodeMetrics.betweennessCentrality > 0.15) {
      score = Math.min(100, score + 12);
      reasons.push('High betweenness centrality indicates structural routing conduit');
    }
    if (nodeMetrics.isBridgeCandidate) {
      score = Math.min(100, score + 10);
      reasons.push('Identified as key bridge-node connecting disjoint network clusters');
    }
    if (nodeMetrics.crossClusterEdges >= 2) {
      score = Math.min(100, score + 8);
      reasons.push('High cross-cluster connection fan-out');
    }
  }

  let totalVol = 0;
  connectedEdges.forEach((e) => {
    if (e.value) totalVol += Number(e.value);
  });
  if (totalVol > 5000000) {
    reasons.push(`High cumulative transfer volume ($${(totalVol / 1000000).toFixed(1)}M)`);
  }

  const finalScore = Math.min(100, Math.max(1, score));
  let level = 'LOW';
  if (finalScore >= 81) level = 'CRITICAL';
  else if (finalScore >= 61) level = 'HIGH';
  else if (finalScore >= 31) level = 'MEDIUM';

  return {
    score: finalScore,
    level,
    breakdown: {
      intrinsicThreat: entity.risk_score || 50,
      graphCentrality: nodeMetrics ? Math.round(nodeMetrics.degreeCentrality * 100) : 40,
      connectivityWeight: nodeMetrics ? Math.round(nodeMetrics.betweennessCentrality * 100) : 30,
    },
    reasons,
  };
}
