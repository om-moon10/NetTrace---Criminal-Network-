import { Router } from 'express';
import { getDb, queryAll, queryOne } from '../database';
import { analyzeGraph } from '../services/graphEngine';
import { calculateNetworkRisk, calculateEntityRisk } from '../services/riskEngine';
import { inferPotentialRoles } from '../services/roleEngine';
import { rankInvestigationPriorities } from '../services/priorityEngine';
import { explainEntity, explainNetwork } from '../services/aiEngine';

const router = Router();

// POST /api/analyze/network
router.post('/network', async (req, res) => {
  try {
    const db = await getDb();
    const { investigationId = 'NX-102' } = req.body;

    const inv = queryOne(db, 'SELECT * FROM investigations WHERE id = ?', [investigationId]);
    if (!inv) {
      return res.status(404).json({ error: `Investigation ${investigationId} not found` });
    }

    const nodes = queryAll(db, 'SELECT * FROM entities WHERE investigation_id = ?', [investigationId]);
    const edges = queryAll(db, 'SELECT * FROM relationships WHERE investigation_id = ?', [investigationId]);
    const evidence = queryAll(db, 'SELECT * FROM evidence WHERE investigation_id = ?', [investigationId]);
    const timeline = queryAll(db, 'SELECT * FROM timeline_events WHERE investigation_id = ?', [investigationId]);

    const graphMetrics = analyzeGraph(nodes, edges);
    const risk = calculateNetworkRisk(nodes, edges, evidence, timeline, graphMetrics);
    const priorities = rankInvestigationPriorities(nodes, edges, evidence, graphMetrics);
    const aiExplanation = await explainNetwork(inv, graphMetrics, risk, priorities);

    res.json({
      investigationId,
      graphMetrics,
      risk,
      priorities,
      aiExplanation,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/analyze/entity/:id
router.post('/entity/:id', async (req, res) => {
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

    const aiExplanation = await explainEntity(entity, nm, directEdges, evidence, roleInference);

    res.json({
      entity: {
        id: entity.id,
        name: entity.name,
        label: entity.label,
        type: entity.type,
        threatLevel: entity.threat_level,
      },
      risk: riskEval,
      potentialRoles: roleInference,
      centrality: nm,
      aiAnalysis: aiExplanation,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
