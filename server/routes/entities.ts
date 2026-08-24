import { Router } from 'express';
import { getDb, queryAll, queryOne } from '../database';
import { analyzeGraph } from '../services/graphEngine';
import { inferPotentialRoles } from '../services/roleEngine';
import { calculateEntityRisk } from '../services/riskEngine';

const router = Router();

// GET /api/entities/:id
router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const id = req.params.id;
    const entity = queryOne(db, 'SELECT * FROM entities WHERE id = ?', [id]);

    if (!entity) {
      return res.status(404).json({ error: `Entity ${id} not found` });
    }

    const investigationId = entity.investigation_id;
    const allNodes = queryAll(db, 'SELECT * FROM entities WHERE investigation_id = ?', [investigationId]);
    const allEdges = queryAll(db, 'SELECT * FROM relationships WHERE investigation_id = ?', [investigationId]);
    const evidence = queryAll(db, 'SELECT * FROM evidence WHERE entity_id = ?', [id]);
    const directEdges = allEdges.filter((e) => e.source === id || e.target === id);

    const graphMetrics = analyzeGraph(allNodes, allEdges);
    const nm = graphMetrics.nodeMetrics[id];

    const roleInference = inferPotentialRoles(entity, nm, directEdges);
    const riskEval = calculateEntityRisk(entity, nm, directEdges);

    let meta = {};
    try {
      meta = typeof entity.metadata === 'string' ? JSON.parse(entity.metadata || '{}') : entity.metadata;
    } catch (err) {}

    res.json({
      entity: {
        id: entity.id,
        investigationId: entity.investigation_id,
        label: entity.label,
        name: entity.name,
        type: entity.type,
        threatLevel: entity.threat_level,
        role: entity.role,
        riskScore: riskEval.score,
        riskLevel: riskEval.level,
        riskBreakdown: riskEval.breakdown,
        riskReasons: riskEval.reasons,
        confidenceScore: entity.confidence_score,
        clusterId: entity.cluster_id,
        metadata: meta,
        centrality: nm
          ? {
              betweenness: nm.betweennessCentrality,
              degree: nm.totalDegree,
              inDegree: nm.inDegree,
              outDegree: nm.outDegree,
              degreeCentrality: nm.degreeCentrality,
              isBridgeCandidate: nm.isBridgeCandidate,
              crossClusterEdges: nm.crossClusterEdges,
            }
          : undefined,
        potentialRole: roleInference.primaryRole,
        potentialRoles: roleInference.all_potential_roles,
        supportingIndicators: roleInference.supporting_indicators,
        directConnectionsCount: directEdges.length,
        evidenceCount: evidence.length,
        evidence,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/entities/:id/connections
router.get('/:id/connections', async (req, res) => {
  try {
    const db = await getDb();
    const id = req.params.id;
    const entity = queryOne(db, 'SELECT * FROM entities WHERE id = ?', [id]);

    if (!entity) {
      return res.status(404).json({ error: `Entity ${id} not found` });
    }

    const allEdges = queryAll(db, 'SELECT * FROM relationships WHERE investigation_id = ?', [entity.investigation_id]);
    const directEdges = allEdges.filter((e) => e.source === id || e.target === id);

    const connectedNodeIds = new Set<string>();
    directEdges.forEach((e) => {
      connectedNodeIds.add(e.source);
      connectedNodeIds.add(e.target);
    });
    connectedNodeIds.delete(id);

    const connectedNodes = queryAll(
      db,
      `SELECT * FROM entities WHERE id IN (${Array.from(connectedNodeIds).map(() => '?').join(',') || "''"})`,
      Array.from(connectedNodeIds)
    );

    res.json({
      entityId: id,
      totalConnections: directEdges.length,
      edges: directEdges,
      connectedEntities: connectedNodes.map((n) => ({
        id: n.id,
        label: n.label,
        name: n.name,
        type: n.type,
        threatLevel: n.threat_level,
        role: n.role,
        riskScore: n.risk_score,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
