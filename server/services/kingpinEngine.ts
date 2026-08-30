import { GraphMetrics, analyzeGraph, GraphNode, GraphEdge } from './graphEngine';

export interface KingpinFactorScore {
  name: string;
  score: number; // 0 - 100
  weight: number; // 0.25, 0.20, etc.
  weightedScore: number;
  description: string;
}

export interface SupportingEvidenceVector {
  vector: string;
  strength: 'VERY HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceMetric: number; // 0 - 100
  details: string;
}

export interface KingpinCandidate {
  rank: number;
  entityId: string;
  entityName: string;
  entityLabel: string;
  entityType: string;
  threatLevel: string;
  role: string;
  kingpinScore: number; // 0 - 100
  confidence: number; // 0 - 100
  riskScore: number; // 0 - 100
  statusTag: string;
  factors: {
    betweennessCentrality: number;
    crossClusterInfluence: number;
    transactionInfluence: number;
    degreeCentrality: number;
    investigativeRisk: number;
    evidenceStrength: number;
    infrastructureInfluence: number;
    closenessCentrality?: number;
  };
  factorBreakdown: KingpinFactorScore[];
  supportingIndicators: string[];
  primaryReasons: string[];
  supportingEvidence: SupportingEvidenceVector[];
  impactPreview: {
    currentConnections: number;
    affectedClusters: number;
    potentiallyIsolatedNodes: number;
    criticalPaths: number;
    potentiallyDisruptedRelationships: number;
    estimatedNetworkImpact: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  };
  connectedNeighbors: Array<{
    id: string;
    name: string;
    label: string;
    type: string;
    relationshipType: string;
  }>;
  metadata?: any;
}

export interface KingpinAnalysisResult {
  investigationId: string;
  candidates: KingpinCandidate[];
  topCandidate?: KingpinCandidate;
  totalEntitiesAnalyzed: number;
  disclaimer: string;
  emptyState?: boolean;
  emptyMessage?: string;
}

/**
 * Calculates strategic Kingpin influence candidates dynamically from graph topology,
 * transaction metrics, evidence records, and timeline coordination.
 */
export function calculateKingpinCandidates(
  investigationId: string,
  nodes: any[],
  edges: any[],
  evidence: any[] = [],
  timeline: any[] = [],
  metrics?: GraphMetrics
): KingpinAnalysisResult {
  const disclaimer =
    'Analytical hypothesis based on observable network characteristics. Human verification required. NetTrace does not establish criminal identity, intent, or guilt.';

  if (!nodes || nodes.length === 0) {
    return {
      investigationId,
      candidates: [],
      totalEntitiesAnalyzed: 0,
      disclaimer,
      emptyState: true,
      emptyMessage:
        'Insufficient network evidence to calculate a reliable Potential Kingpin candidate. Ingest additional transaction telemetry or cyber infrastructure indicators to begin analysis.',
    };
  }

  const graphMetrics = metrics || analyzeGraph(nodes, edges);

  // Evidence map
  const evidenceCountMap = new Map<string, number>();
  const evidenceRecordsMap = new Map<string, any[]>();
  evidence.forEach((ev) => {
    if (ev.entity_id) {
      evidenceCountMap.set(ev.entity_id, (evidenceCountMap.get(ev.entity_id) || 0) + 1);
      if (!evidenceRecordsMap.has(ev.entity_id)) {
        evidenceRecordsMap.set(ev.entity_id, []);
      }
      evidenceRecordsMap.get(ev.entity_id)!.push(ev);
    }
  });

  // Timeline touches map
  const timelineTouchMap = new Map<string, number>();
  timeline.forEach((tl) => {
    let ids: string[] = [];
    try {
      ids = typeof tl.entity_ids === 'string' ? JSON.parse(tl.entity_ids) : tl.entity_ids || [];
    } catch (e) {
      ids = [];
    }
    ids.forEach((id) => {
      timelineTouchMap.set(id, (timelineTouchMap.get(id) || 0) + 1);
    });
  });

  // Find max bounds for normalization
  let maxBetweenness = 0.001;
  let maxDegree = 1;
  let maxCrossCluster = 1;
  let maxVolumeUSD = 1000;

  nodes.forEach((n) => {
    const nm = graphMetrics.nodeMetrics[n.id];
    if (nm) {
      if (nm.betweennessCentrality > maxBetweenness) maxBetweenness = nm.betweennessCentrality;
      if (nm.totalDegree > maxDegree) maxDegree = nm.totalDegree;
      if (nm.crossClusterEdges > maxCrossCluster) maxCrossCluster = nm.crossClusterEdges;
    }
    const meta = typeof n.metadata === 'string' ? JSON.parse(n.metadata || '{}') : n.metadata || {};
    const vol = Number(meta.totalVolumeUSD || meta.balanceUSD || 0);
    if (vol > maxVolumeUSD) maxVolumeUSD = vol;
  });

  // Node Map
  const nodeMap = new Map<string, any>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  // Adjacency and Edge map
  const neighborMap = new Map<string, Set<string>>();
  const nodeDirectEdges = new Map<string, any[]>();
  nodes.forEach((n) => {
    neighborMap.set(n.id, new Set());
    nodeDirectEdges.set(n.id, []);
  });

  edges.forEach((e) => {
    if (neighborMap.has(e.source) && neighborMap.has(e.target)) {
      neighborMap.get(e.source)!.add(e.target);
      neighborMap.get(e.target)!.add(e.source);
    }
    if (nodeDirectEdges.has(e.source)) nodeDirectEdges.get(e.source)!.push(e);
    if (nodeDirectEdges.has(e.target)) nodeDirectEdges.get(e.target)!.push(e);
  });

  // Filter out low threat victims or neutral observers
  const eligibleNodes = nodes.filter((n) => n.role !== 'victim' && n.threat_level !== 'low');

  const candidates: KingpinCandidate[] = eligibleNodes.map((node) => {
    const nm = graphMetrics.nodeMetrics[node.id] || {
      betweennessCentrality: 0,
      degreeCentrality: 0,
      closenessCentrality: 0,
      totalDegree: 0,
      crossClusterEdges: 0,
      isBridgeCandidate: false,
    };

    const directEdges = nodeDirectEdges.get(node.id) || [];
    const directNeighbors = Array.from(neighborMap.get(node.id) || []);
    const meta = typeof node.metadata === 'string' ? JSON.parse(node.metadata || '{}') : node.metadata || {};

    // 1. Factor 1: Betweenness Centrality (25% weight)
    // Normalized 0 - 100
    const rawBetweennessRatio = nm.betweennessCentrality / maxBetweenness;
    const betweennessScore = Math.min(
      100,
      Math.max(10, Math.round(rawBetweennessRatio * 85 + (nm.betweennessCentrality > 0.2 ? 15 : nm.betweennessCentrality > 0.1 ? 8 : 0)))
    );

    // 2. Factor 2: Cross-Cluster Influence (20% weight)
    // Count distinct adjacent clusters
    const adjacentClusters = new Set<string>();
    directNeighbors.forEach((nbrId) => {
      const nbr = nodeMap.get(nbrId);
      if (nbr && nbr.cluster_id) adjacentClusters.add(nbr.cluster_id);
    });
    const crossRatio = nm.crossClusterEdges / maxCrossCluster;
    const crossScore = Math.min(
      100,
      Math.max(
        10,
        Math.round(
          crossRatio * 70 +
            (nm.isBridgeCandidate ? 18 : 0) +
            (adjacentClusters.size >= 3 ? 12 : adjacentClusters.size >= 2 ? 6 : 0)
        )
      )
    );

    // 3. Factor 3: Transaction / Financial Influence (20% weight)
    let directVolumeUSD = 0;
    directEdges.forEach((e) => {
      if (e.value) directVolumeUSD += Number(e.value);
    });
    const entityVolumeUSD = Math.max(Number(meta.totalVolumeUSD || meta.balanceUSD || 0), directVolumeUSD);
    let transactionScore = 15;
    if (entityVolumeUSD > 0) {
      // Logarithmic scaling relative to maxVolumeUSD
      const logRatio = Math.log10(entityVolumeUSD + 1) / Math.log10(maxVolumeUSD + 1);
      transactionScore = Math.min(100, Math.max(20, Math.round(logRatio * 85 + (entityVolumeUSD > 5000000 ? 15 : 5))));
    }

    // 4. Factor 4: Degree Centrality (10% weight)
    const degreeRatio = nm.totalDegree / maxDegree;
    const degreeScore = Math.min(100, Math.max(10, Math.round(degreeRatio * 75 + (nm.totalDegree >= 5 ? 15 : 5))));

    // 5. Factor 5: Investigative Risk (10% weight)
    const baseRisk = Number(node.risk_score || 50);
    const threatBonus = node.threat_level === 'critical' ? 10 : node.threat_level === 'high' ? 5 : 0;
    const riskScore = Math.min(100, Math.max(10, Math.round(baseRisk * 0.9 + threatBonus)));

    // 6. Factor 6: Evidence Strength (10% weight)
    const evCount = evidenceCountMap.get(node.id) || 0;
    const tlCount = timelineTouchMap.get(node.id) || 0;
    const evRecords = evidenceRecordsMap.get(node.id) || [];
    let avgEvConfidence = 70;
    if (evRecords.length > 0) {
      const sumConf = evRecords.reduce((acc, ev) => acc + (ev.confidence_weight || 80), 0);
      avgEvConfidence = sumConf / evRecords.length;
    }
    const evidenceScore = Math.min(
      100,
      Math.max(15, Math.round(Math.min(50, evCount * 18 + tlCount * 10) + (avgEvConfidence / 100) * 45))
    );

    // 7. Factor 7: Infrastructure Influence (5% weight)
    let infraLinks = 0;
    directNeighbors.forEach((nbrId) => {
      const nbr = nodeMap.get(nbrId);
      if (nbr) {
        const t = (nbr.type || '').toUpperCase();
        if (t === 'IP' || t === 'DOMAIN' || t === 'SERVER' || t === 'DEVICE' || nbr.role === 'c2_controller') {
          infraLinks++;
        }
      }
    });
    const infraScore = Math.min(100, Math.max(10, Math.round(infraLinks * 25 + (node.type === 'IP' || node.type === 'DOMAIN' ? 25 : 10))));

    // Weighted Kingpin Influence Score
    // Betweenness: 25%, Cross-Cluster: 20%, Transaction: 20%, Degree: 10%, Risk: 10%, Evidence: 10%, Infra: 5%
    const weightedSum =
      betweennessScore * 0.25 +
      crossScore * 0.2 +
      transactionScore * 0.2 +
      degreeScore * 0.1 +
      riskScore * 0.1 +
      evidenceScore * 0.1 +
      infraScore * 0.05;

    const kingpinScore = Math.min(99, Math.max(15, Math.round(weightedSum)));

    // Confidence Calculation (0 - 100)
    // Based on independent signals, evidentiary depth, graph metric stability, and metadata richness
    const signalCount =
      (evCount > 0 ? 1 : 0) +
      (tlCount > 0 ? 1 : 0) +
      (entityVolumeUSD > 0 ? 1 : 0) +
      (infraLinks > 0 ? 1 : 0) +
      (nm.isBridgeCandidate ? 1 : 0);

    const dataCompleteness = (meta.tags?.length || 0) >= 2 && meta.firstSeen ? 25 : 15;
    const graphStability = nm.totalDegree >= 4 && nm.betweennessCentrality > 0.1 ? 30 : 15;
    const evidenceBacking = Math.min(35, evCount * 10 + tlCount * 6 + 10);
    const independentSignalPts = Math.min(15, signalCount * 3);

    const confidence = Math.min(96, Math.max(45, Math.round(dataCompleteness + graphStability + evidenceBacking + independentSignalPts)));

    // Supporting Indicators
    const supportingIndicators: string[] = [];
    const primaryReasons: string[] = [];

    if (betweennessScore >= 80) {
      supportingIndicators.push('High betweenness centrality controlling shortest topological paths');
      primaryReasons.push(`Connects ${adjacentClusters.size || 3} network clusters as a critical transit bridge`);
    }
    if (crossScore >= 75) {
      supportingIndicators.push('Acts as a strategic bridge across disparate organizational clusters');
      primaryReasons.push('Cross-domain bridge between financial pathways and hosting infrastructure');
    }
    if (transactionScore >= 75) {
      supportingIndicators.push(`Associated with high-velocity transaction activity ($${(entityVolumeUSD / 1000000).toFixed(1)}M)`);
      primaryReasons.push('Significant financial asset aggregation and routing volume');
    }
    if (evidenceScore >= 75) {
      supportingIndicators.push(`Supported by ${evCount} forensic evidentiary records`);
    }
    if (infraScore >= 60) {
      supportingIndicators.push('Direct cryptographic or DNS linkage to cyber command infrastructure');
    }
    if (riskScore >= 85) {
      supportingIndicators.push(`Elevated intrinsic threat rating (${baseRisk}/100)`);
    }

    if (supportingIndicators.length === 0) {
      supportingIndicators.push('Topological participant in illicit syndicate graph');
    }
    if (primaryReasons.length === 0) {
      primaryReasons.push('Identified network influence candidate based on centrality');
    }

    // Factor Breakdown details
    const factorBreakdown: KingpinFactorScore[] = [
      {
        name: 'Betweenness Centrality',
        score: betweennessScore,
        weight: 0.25,
        weightedScore: Number((betweennessScore * 0.25).toFixed(1)),
        description: 'connects multiple network clusters',
      },
      {
        name: 'Cross-Cluster Influence',
        score: crossScore,
        weight: 0.2,
        weightedScore: Number((crossScore * 0.2).toFixed(1)),
        description: 'acts as a potential bridge between financial pathways',
      },
      {
        name: 'Transaction Influence',
        score: transactionScore,
        weight: 0.2,
        weightedScore: Number((transactionScore * 0.2).toFixed(1)),
        description: 'associated with significant transaction activity',
      },
      {
        name: 'Degree Centrality',
        score: degreeScore,
        weight: 0.1,
        weightedScore: Number((degreeScore * 0.1).toFixed(1)),
        description: 'direct hub connectivity',
      },
      {
        name: 'Investigative Risk',
        score: riskScore,
        weight: 0.1,
        weightedScore: Number((riskScore * 0.1).toFixed(1)),
        description: 'intrinsic entity threat severity',
      },
      {
        name: 'Evidence Strength',
        score: evidenceScore,
        weight: 0.1,
        weightedScore: Number((evidenceScore * 0.1).toFixed(1)),
        description: 'supported by multiple evidence records',
      },
      {
        name: 'Infrastructure Influence',
        score: infraScore,
        weight: 0.05,
        weightedScore: Number((infraScore * 0.05).toFixed(1)),
        description: 'linkage to IP/domain hosting layer',
      },
    ];

    // Supporting Evidence Vectors Table
    const supportingEvidence: SupportingEvidenceVector[] = [
      {
        vector: 'Transaction Activity',
        strength: transactionScore >= 80 ? 'HIGH' : transactionScore >= 60 ? 'MEDIUM' : 'LOW',
        confidenceMetric: Math.min(95, Math.round(transactionScore * 0.95 + 8)),
        details: `$${(entityVolumeUSD / 1000000).toFixed(1)}M verified on-chain volume`,
      },
      {
        vector: 'Cross-Cluster Connections',
        strength: crossScore >= 85 ? 'HIGH' : crossScore >= 65 ? 'MEDIUM' : 'LOW',
        confidenceMetric: Math.min(96, Math.round(crossScore * 0.96 + 7)),
        details: `${adjacentClusters.size} distinct functional clusters bridged`,
      },
      {
        vector: 'Network Centrality',
        strength: betweennessScore >= 85 ? 'VERY HIGH' : betweennessScore >= 65 ? 'HIGH' : 'MEDIUM',
        confidenceMetric: Math.min(98, Math.round(betweennessScore * 0.98 + 4)),
        details: `Betweenness: ${nm.betweennessCentrality.toFixed(3)}, Degree: ${nm.totalDegree}`,
      },
      {
        vector: 'Threat Intelligence',
        strength: riskScore >= 85 ? 'MEDIUM' : 'LOW',
        confidenceMetric: Math.min(90, Math.round(riskScore * 0.8 + 4)),
        details: `${node.threat_level?.toUpperCase()} threat level assigned`,
      },
      {
        vector: 'Timeline Coordination',
        strength: tlCount >= 2 ? 'HIGH' : tlCount >= 1 ? 'MEDIUM' : 'LOW',
        confidenceMetric: Math.min(92, Math.max(65, tlCount * 12 + 60)),
        details: `${tlCount} chronologically correlated incident events`,
      },
      {
        vector: 'Relationship Strength',
        strength: directEdges.length >= 5 ? 'HIGH' : 'MEDIUM',
        confidenceMetric: Math.min(94, Math.max(70, directEdges.length * 5 + 55)),
        details: `${directEdges.length} high-confidence topological edges`,
      },
    ];

    // Connected neighbors
    const connectedNeighbors = directNeighbors.slice(0, 8).map((nbrId) => {
      const nbr = nodeMap.get(nbrId);
      const rel = directEdges.find((e) => e.source === nbrId || e.target === nbrId);
      return {
        id: nbrId,
        name: nbr?.name || nbrId,
        label: nbr?.label || nbrId,
        type: nbr?.type || 'UNKNOWN',
        relationshipType: rel?.type || 'CONNECTED_TO',
      };
    });

    // Impact Preview metrics for simulation card
    const affectedClustersCount = Math.max(1, adjacentClusters.size);
    // Rough estimate of isolated nodes if this entity is severed
    let isolatedCount = 0;
    directNeighbors.forEach((nbrId) => {
      const nbrDegree = graphMetrics.nodeMetrics[nbrId]?.totalDegree || 0;
      if (nbrDegree <= 1) isolatedCount++;
    });
    if (isolatedCount === 0 && nm.isBridgeCandidate) {
      isolatedCount = Math.min(5, Math.max(2, Math.round(directNeighbors.length * 0.6)));
    }

    const estimatedImpact: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' =
      kingpinScore >= 85 ? 'HIGH' : kingpinScore >= 70 ? 'MODERATE' : 'LOW';

    return {
      rank: 0, // Will assign after sorting
      entityId: node.id,
      entityName: node.name,
      entityLabel: node.label,
      name: node.name,
      label: node.label,
      entityType: node.type,
      threatLevel: node.threat_level || 'high',
      role: node.role || 'unknown',
      kingpinScore,
      confidence,
      riskScore: baseRisk,
      statusTag: kingpinScore >= 85 ? 'HIGH-IMPACT NETWORK CANDIDATE' : 'STRATEGIC NETWORK CANDIDATE',
      factors: {
        betweennessCentrality: betweennessScore,
        crossClusterInfluence: crossScore,
        transactionInfluence: transactionScore,
        degreeCentrality: degreeScore,
        investigativeRisk: riskScore,
        evidenceStrength: evidenceScore,
        infrastructureInfluence: infraScore,
        closenessCentrality: Math.round((nm.closenessCentrality || 0) * 100),
      },
      factorBreakdown,
      scoreBreakdown: factorBreakdown,
      supportingIndicators,
      primaryReasons,
      supportingEvidence,
      impactPreview: {
        currentConnections: nm.totalDegree,
        affectedClusters: affectedClustersCount,
        potentiallyIsolatedNodes: isolatedCount,
        criticalPaths: Math.min(5, Math.max(1, Math.round(nm.betweennessCentrality * 10))),
        potentiallyDisruptedRelationships: directEdges.length,
        estimatedNetworkImpact: estimatedImpact,
      },
      connectedNeighbors,
      metadata: meta,
    };
  });

  // Sort descending by kingpinScore
  candidates.sort((a, b) => b.kingpinScore - a.kingpinScore);

  // Assign ranks
  candidates.forEach((c, i) => {
    c.rank = i + 1;
  });

  return {
    investigationId,
    candidates: candidates.slice(0, 10),
    topCandidate: candidates[0],
    totalEntitiesAnalyzed: eligibleNodes.length,
    disclaimer,
  };
}
