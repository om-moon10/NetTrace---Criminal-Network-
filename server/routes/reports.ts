import { Router } from 'express';
import { getDb, queryAll, queryOne } from '../database';
import { analyzeGraph } from '../services/graphEngine';
import { calculateNetworkRisk } from '../services/riskEngine';
import { rankInvestigationPriorities } from '../services/priorityEngine';
import { 
  generateReportSummary, 
  explainEntity, 
  explainNetwork,
  generateCaseBriefing,
  generateCopilotResponse
} from '../services/aiEngine';

const router = Router();

// GET /api/reports/:investigationId
router.get('/:investigationId', async (req, res) => {
  try {
    const db = await getDb();
    const id = req.params.investigationId;
    const inv = queryOne(db, 'SELECT * FROM investigations WHERE id = ?', [id]);

    if (!inv) {
      return res.status(404).json({ error: `Investigation ${id} not found` });
    }

    const entities = queryAll(db, 'SELECT * FROM entities WHERE investigation_id = ?', [id]);
    const relationships = queryAll(db, 'SELECT * FROM relationships WHERE investigation_id = ?', [id]);
    const evidence = queryAll(db, 'SELECT * FROM evidence WHERE investigation_id = ?', [id]);
    const timeline = queryAll(db, 'SELECT * FROM timeline_events WHERE investigation_id = ?', [id]);

    const graphMetrics = analyzeGraph(entities, relationships);
    const risk = calculateNetworkRisk(entities, relationships, evidence, timeline, graphMetrics);
    const priorities = rankInvestigationPriorities(entities, relationships, evidence, graphMetrics);

    const report = await generateReportSummary(inv, entities, relationships, evidence, priorities);

    res.json({
      investigationId: id,
      report,
      risk,
      priorities,
      metrics: {
        totalEntities: entities.length,
        totalRelationships: relationships.length,
        totalEvidence: evidence.length,
        totalTimelineEvents: timeline.length,
        totalMonitoredFundsUSD: inv.total_monitored_funds_usd,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/briefing
router.post('/briefing', async (req, res) => {
  try {
    const db = await getDb();
    const { caseId = 'NX-102', investigationId = 'NX-102' } = req.body;
    const id = caseId || investigationId;
    const inv = queryOne(db, 'SELECT * FROM investigations WHERE id = ?', [id]) ||
                queryOne(db, 'SELECT * FROM investigations LIMIT 1', []);

    if (!inv) {
      return res.status(404).json({ error: `Investigation ${id} not found` });
    }

    const entities = queryAll(db, 'SELECT * FROM entities WHERE investigation_id = ?', [inv.id]);
    const relationships = queryAll(db, 'SELECT * FROM relationships WHERE investigation_id = ?', [inv.id]);
    const evidence = queryAll(db, 'SELECT * FROM evidence WHERE investigation_id = ?', [inv.id]);

    const graphMetrics = analyzeGraph(entities, relationships);
    const priorities = rankInvestigationPriorities(entities, relationships, evidence, graphMetrics);

    const brief = await generateCaseBriefing(inv, entities, relationships, evidence, priorities);
    res.json(brief);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/copilot
router.post('/copilot', async (req, res) => {
  try {
    const db = await getDb();
    const { caseId = 'NX-102', investigationId = 'NX-102', userQuery = '' } = req.body;
    const id = caseId || investigationId;
    const inv = queryOne(db, 'SELECT * FROM investigations WHERE id = ?', [id]) ||
                queryOne(db, 'SELECT * FROM investigations LIMIT 1', []);

    if (!inv) {
      return res.status(404).json({ error: `Investigation not found` });
    }

    const entities = queryAll(db, 'SELECT * FROM entities WHERE investigation_id = ?', [inv.id]);
    const relationships = queryAll(db, 'SELECT * FROM relationships WHERE investigation_id = ?', [inv.id]);

    const reply = await generateCopilotResponse(inv, entities, relationships, userQuery);
    res.json(reply);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/report-summary & /api/ai/summary
router.post(['/summary', '/report-summary'], async (req, res) => {
  try {
    const db = await getDb();
    const { investigationId = 'NX-102', caseId = 'NX-102' } = req.body;
    const id = investigationId || caseId;
    const inv = queryOne(db, 'SELECT * FROM investigations WHERE id = ?', [id]) ||
                queryOne(db, 'SELECT * FROM investigations LIMIT 1', []);

    if (!inv) {
      return res.status(404).json({ error: `Investigation ${id} not found` });
    }

    const entities = queryAll(db, 'SELECT * FROM entities WHERE investigation_id = ?', [inv.id]);
    const relationships = queryAll(db, 'SELECT * FROM relationships WHERE investigation_id = ?', [inv.id]);
    const evidence = queryAll(db, 'SELECT * FROM evidence WHERE investigation_id = ?', [inv.id]);

    const graphMetrics = analyzeGraph(entities, relationships);
    const priorities = rankInvestigationPriorities(entities, relationships, evidence, graphMetrics);

    const report = await generateReportSummary(inv, entities, relationships, evidence, priorities);
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/explain
router.post('/explain', async (req, res) => {
  try {
    const db = await getDb();
    const { type = 'network', investigationId = 'NX-102', entityId } = req.body;

    if (type === 'entity' && entityId) {
      const entity = queryOne(db, 'SELECT * FROM entities WHERE id = ?', [entityId]);
      if (!entity) {
        return res.status(404).json({ error: `Entity ${entityId} not found` });
      }
      const allNodes = queryAll(db, 'SELECT * FROM entities WHERE investigation_id = ?', [entity.investigation_id]);
      const allEdges = queryAll(db, 'SELECT * FROM relationships WHERE investigation_id = ?', [entity.investigation_id]);
      const evidence = queryAll(db, 'SELECT * FROM evidence WHERE entity_id = ?', [entityId]);
      const directEdges = allEdges.filter((e) => e.source === entityId || e.target === entityId);

      const graphMetrics = analyzeGraph(allNodes, allEdges);
      const nm = graphMetrics.nodeMetrics[entityId];

      const explanation = await explainEntity(entity, nm, directEdges, evidence);
      return res.json(explanation);
    }

    // Default network explanation
    const inv = queryOne(db, 'SELECT * FROM investigations WHERE id = ?', [investigationId]);
    const nodes = queryAll(db, 'SELECT * FROM entities WHERE investigation_id = ?', [investigationId]);
    const edges = queryAll(db, 'SELECT * FROM relationships WHERE investigation_id = ?', [investigationId]);
    const evidence = queryAll(db, 'SELECT * FROM evidence WHERE investigation_id = ?', [investigationId]);
    const timeline = queryAll(db, 'SELECT * FROM timeline_events WHERE investigation_id = ?', [investigationId]);

    const graphMetrics = analyzeGraph(nodes, edges);
    const risk = calculateNetworkRisk(nodes, edges, evidence, timeline, graphMetrics);
    const priorities = rankInvestigationPriorities(nodes, edges, evidence, graphMetrics);

    const explanation = await explainNetwork(inv, graphMetrics, risk, priorities);
    res.json(explanation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
