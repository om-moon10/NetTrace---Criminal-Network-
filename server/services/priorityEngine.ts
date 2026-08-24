import { GraphMetrics } from './graphEngine';

export interface PriorityTarget {
  rank: number;
  entityId: string;
  entityName: string;
  entityLabel: string;
  entityType: string;
  threatLevel: string;
  priorityScore: number; // 0 - 100
  expectedInformationGain: 'VERY HIGH' | 'HIGH' | 'MEDIUM';
  networkImpact: 'VERY HIGH' | 'HIGH' | 'MODERATE' | 'LOW';
  reasons: string[];
  recommendedAction: string;
  metrics: {
    betweenness: number;
    degree: number;
    crossCluster: number;
    riskScore: number;
    evidenceCount: number;
  };
}

export function rankInvestigationPriorities(
  nodes: any[],
  edges: any[],
  evidence: any[],
  graphMetrics: GraphMetrics
): PriorityTarget[] {
  // Map evidence counts per entity
  const evidenceCountMap = new Map<string, number>();
  evidence.forEach((ev) => {
    if (ev.entity_id) {
      evidenceCountMap.set(ev.entity_id, (evidenceCountMap.get(ev.entity_id) || 0) + 1);
    }
  });

  const scoredTargets: {
    entity: any;
    score: number;
    reasons: string[];
    infoGain: 'VERY HIGH' | 'HIGH' | 'MEDIUM';
    netImpact: 'VERY HIGH' | 'HIGH' | 'MODERATE' | 'LOW';
    action: string;
    metrics: {
      betweenness: number;
      degree: number;
      crossCluster: number;
      riskScore: number;
      evidenceCount: number;
    };
  }[] = [];

  nodes.forEach((node) => {
    // Exclude victims from priority target list
    if (node.role === 'victim' || node.threat_level === 'low') {
      return;
    }

    const nm = graphMetrics.nodeMetrics[node.id] || {
      betweennessCentrality: 0,
      degreeCentrality: 0,
      crossClusterEdges: 0,
      isBridgeCandidate: false,
      totalDegree: 0,
    };

    const evCount = evidenceCountMap.get(node.id) || 0;
    const baseRisk = Number(node.risk_score || 50);

    const reasons: string[] = [];

    // Calculate priority components
    // 1. Betweenness Centrality (0 - 30 pts)
    const betweennessPts = Math.min(30, nm.betweennessCentrality * 120);
    if (nm.betweennessCentrality > 0.15) {
      reasons.push(`Key structural bottleneck (betweenness: ${nm.betweennessCentrality.toFixed(3)})`);
    }

    // 2. Cross-cluster bridging (0 - 20 pts)
    const crossClusterPts = Math.min(20, nm.crossClusterEdges * 8 + (nm.isBridgeCandidate ? 8 : 0));
    if (nm.isBridgeCandidate) {
      reasons.push('Identified as topological articulation bridge between core clusters');
    }

    // 3. Degree Centrality (0 - 15 pts)
    const degreePts = Math.min(15, nm.degreeCentrality * 40);
    if (nm.totalDegree >= 4) {
      reasons.push(`High hub degree centrality (${nm.totalDegree} direct links)`);
    }

    // 4. Intrinsic Risk Score (0 - 20 pts)
    const riskPts = (baseRisk / 100) * 20;
    if (baseRisk >= 85) {
      reasons.push(`High intrinsic threat severity rating (${baseRisk}/100)`);
    }

    // 5. Evidence Weight (0 - 15 pts)
    const evidencePts = Math.min(15, evCount * 6);
    if (evCount >= 2) {
      reasons.push(`${evCount} forensic evidentiary records directly correlate to entity`);
    }

    const totalScore = Math.min(99, Math.max(10, Math.round(betweennessPts + crossClusterPts + degreePts + riskPts + evidencePts)));

    // Categorize expected information gain & network impact
    let infoGain: 'VERY HIGH' | 'HIGH' | 'MEDIUM' = 'MEDIUM';
    let netImpact: 'VERY HIGH' | 'HIGH' | 'MODERATE' | 'LOW' = 'MODERATE';

    if (totalScore >= 88) {
      infoGain = 'VERY HIGH';
      netImpact = 'VERY HIGH';
    } else if (totalScore >= 75) {
      infoGain = 'HIGH';
      netImpact = 'HIGH';
    } else if (totalScore >= 60) {
      infoGain = 'HIGH';
      netImpact = 'MODERATE';
    }

    // Action recommendation based on entity type and role
    let action = 'Serve targeted MLAT / Subpoena to preserve telemetry';
    const type = (node.type || '').toUpperCase();
    if (type === 'WALLET') {
      action = 'Submit immediate emergency asset freeze request to exchange/bridge consortium';
    } else if (type === 'IP' || type === 'DOMAIN') {
      action = 'Coordinate international law enforcement takedown / C2 sinkhole order';
    } else if (type === 'PERSON') {
      action = 'Prepare INTERPOL Red Notice and mutual legal assistance warrant application';
    } else if (type === 'ORGANIZATION') {
      action = 'Execute corporate commercial bank account freeze and beneficial owner seizure order';
    }

    scoredTargets.push({
      entity: node,
      score: totalScore,
      reasons,
      infoGain,
      netImpact,
      action,
      metrics: {
        betweenness: nm.betweennessCentrality,
        degree: nm.totalDegree,
        crossCluster: nm.crossClusterEdges,
        riskScore: baseRisk,
        evidenceCount: evCount,
      },
    });
  });

  // Sort descending by priority score
  scoredTargets.sort((a, b) => b.score - a.score);

  return scoredTargets.map((item, index) => ({
    rank: index + 1,
    entityId: item.entity.id,
    entityName: item.entity.name,
    entityLabel: item.entity.label,
    entityType: item.entity.type,
    threatLevel: item.entity.threat_level || 'high',
    priorityScore: item.score,
    expectedInformationGain: item.infoGain,
    networkImpact: item.netImpact,
    reasons: item.reasons.length > 0 ? item.reasons : ['Correlated node in investigation network'],
    recommendedAction: item.action,
    metrics: item.metrics,
  }));
}
