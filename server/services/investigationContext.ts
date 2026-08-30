import { Database as SqlJsDatabase } from 'sql.js';
import { queryAll, queryOne } from '../database';
import { analyzeGraph } from './graphEngine';
import { calculateNetworkRisk } from './riskEngine';
import { rankInvestigationPriorities } from './priorityEngine';
import { analyzeInvestigationHiddenRelationships } from './hiddenRelationshipEngine';

export interface InvestigationContext {
  investigation: {
    id: string;
    caseNumber: string;
    name: string;
    description: string;
    status: string;
    leadInvestigator: string;
    agency: string;
    classification: string;
    totalMonitoredFundsUSD: number;
    createdAt?: string;
  };
  summary: {
    totalEntities: number;
    totalRelationships: number;
    totalEvidence: number;
    totalTimelineEvents: number;
    highRiskEntityCount: number;
    networkRiskScore: number;
    networkRiskLevel: string;
  };
  entities: Array<{
    id: string;
    label: string;
    name: string;
    type: string;
    threatLevel: string;
    role: string;
    riskScore: number;
    clusterId?: string;
    metadata?: any;
  }>;
  relationships: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
    label?: string;
    value?: number;
    confidence: number;
    protocol?: string;
    timestamp?: string;
  }>;
  topTargets: Array<{
    entityId: string;
    entityName: string;
    entityLabel: string;
    entityType: string;
    priorityScore: number;
    threatLevel?: string;
    primaryRole?: string;
    riskScore: number;
    recommendedAction: string;
  }>;
  bridgeNodes: Array<{
    id: string;
    name: string;
    label: string;
    betweenness: number;
  }>;
  timelineHighlights: Array<{
    id: string;
    timestamp: string;
    title: string;
    description?: string;
    severity: string;
    amountUSD?: number;
  }>;
  evidenceHighlights: Array<{
    id: string;
    sourceName: string;
    sourceType: string;
    title?: string;
    indicators?: string;
    confidence: number;
  }>;
  hiddenRelationships: {
    recommendedPairs: any[];
    highRelevancePathCount: number;
  };
  selectedEntityContext?: {
    entity: any;
    directConnections: any[];
    connectedEvidence: any[];
    betweenness: number;
  };
}

export function buildInvestigationContext(
  db: SqlJsDatabase,
  investigationId: string = 'NX-102',
  options?: {
    selectedEntityId?: string;
    selectedPathId?: string;
    currentView?: string;
  }
): InvestigationContext | null {
  const inv = queryOne(db, 'SELECT * FROM investigations WHERE id = ?', [investigationId]) ||
              queryOne(db, 'SELECT * FROM investigations LIMIT 1', []);

  if (!inv) return null;

  const entities = queryAll(db, 'SELECT * FROM entities WHERE investigation_id = ?', [inv.id]);
  const relationships = queryAll(db, 'SELECT * FROM relationships WHERE investigation_id = ?', [inv.id]);
  const evidence = queryAll(db, 'SELECT * FROM evidence WHERE investigation_id = ?', [inv.id]);
  const timeline = queryAll(db, 'SELECT * FROM timeline_events WHERE investigation_id = ? ORDER BY timestamp ASC', [inv.id]);

  // Compute graph & risk analytics
  const graphMetrics = analyzeGraph(entities, relationships);
  const riskMetrics = calculateNetworkRisk(entities, relationships, evidence, timeline, graphMetrics);
  const priorities = rankInvestigationPriorities(entities, relationships, evidence, graphMetrics);
  const hiddenRelAnalysis = analyzeInvestigationHiddenRelationships(inv.id, entities, relationships, evidence, timeline);

  const highRiskEntityCount = entities.filter((e: any) => (e.risk_score || 0) >= 80).length;

  const bridgeNodes = graphMetrics.bridgeNodeCandidates.map((nodeId) => {
    const ent = entities.find((e: any) => e.id === nodeId);
    const nm = graphMetrics.nodeMetrics[nodeId];
    return {
      id: nodeId,
      name: ent?.name || nodeId,
      label: ent?.label || nodeId,
      betweenness: nm?.betweennessCentrality || 0,
    };
  });

  // Selected Entity Enrichment if provided
  let selectedEntityContext: InvestigationContext['selectedEntityContext'] = undefined;
  if (options?.selectedEntityId) {
    const sel = entities.find((e: any) => e.id === options.selectedEntityId);
    if (sel) {
      const direct = relationships.filter((r: any) => r.source === sel.id || r.target === sel.id);
      const connEvidence = evidence.filter((ev: any) => ev.entity_id === sel.id);
      const nm = graphMetrics.nodeMetrics[sel.id];
      selectedEntityContext = {
        entity: {
          id: sel.id,
          name: sel.name,
          label: sel.label,
          type: sel.type,
          role: sel.role,
          threatLevel: sel.threat_level,
          riskScore: sel.risk_score,
        },
        directConnections: direct.map((r: any) => {
          const otherId = r.source === sel.id ? r.target : r.source;
          const otherEnt = entities.find((e: any) => e.id === otherId);
          return {
            edgeId: r.id,
            relationshipType: r.type,
            connectedEntity: otherEnt?.name || otherId,
            connectedLabel: otherEnt?.label || otherId,
            valueUSD: r.value,
          };
        }),
        connectedEvidence: connEvidence.map((ev: any) => ({
          id: ev.id,
          sourceName: ev.source_name,
          title: ev.title || ev.source_name,
        })),
        betweenness: nm?.betweennessCentrality || 0,
      };
    }
  }

  return {
    investigation: {
      id: inv.id,
      caseNumber: inv.case_number,
      name: inv.name,
      description: inv.description,
      status: inv.status,
      leadInvestigator: inv.lead_investigator,
      agency: inv.agency,
      classification: inv.classification,
      totalMonitoredFundsUSD: inv.total_monitored_funds_usd,
      createdAt: inv.created_at,
    },
    summary: {
      totalEntities: entities.length,
      totalRelationships: relationships.length,
      totalEvidence: evidence.length,
      totalTimelineEvents: timeline.length,
      highRiskEntityCount,
      networkRiskScore: riskMetrics.score,
      networkRiskLevel: riskMetrics.level,
    },
    entities: entities.map((e: any) => ({
      id: e.id,
      label: e.label,
      name: e.name,
      type: e.type,
      threatLevel: e.threat_level,
      role: e.role,
      riskScore: e.risk_score,
      clusterId: e.cluster_id,
      metadata: typeof e.metadata === 'string' ? JSON.parse(e.metadata || '{}') : e.metadata,
    })),
    relationships: relationships.map((r: any) => ({
      id: r.id,
      source: r.source,
      target: r.target,
      type: r.type,
      label: r.label,
      value: r.value,
      confidence: r.confidence,
      protocol: r.protocol,
      timestamp: r.timestamp,
    })),
    topTargets: priorities.slice(0, 5).map((p) => ({
      entityId: p.entityId,
      entityName: p.entityName,
      entityLabel: p.entityLabel,
      entityType: p.entityType,
      priorityScore: p.priorityScore,
      threatLevel: p.threatLevel,
      riskScore: p.metrics.riskScore,
      recommendedAction: p.recommendedAction,
    })),
    bridgeNodes: bridgeNodes.slice(0, 4),
    timelineHighlights: timeline.slice(0, 5).map((t: any) => ({
      id: t.id,
      timestamp: t.timestamp,
      title: t.title,
      description: t.description,
      severity: t.severity,
      amountUSD: t.amount_usd,
    })),
    evidenceHighlights: evidence.slice(0, 6).map((ev: any) => ({
      id: ev.id,
      sourceName: ev.source_name,
      sourceType: ev.source_type,
      title: ev.title,
      indicators: ev.extracted_indicators,
      confidence: ev.confidence_weight,
    })),
    hiddenRelationships: {
      recommendedPairs: hiddenRelAnalysis.recommendedPairs || [],
      highRelevancePathCount: hiddenRelAnalysis.paths.length,
    },
    selectedEntityContext,
  };
}
