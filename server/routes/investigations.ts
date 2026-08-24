import { Router } from 'express';
import { getDb, queryAll, queryOne } from '../database';
import { analyzeGraph } from '../services/graphEngine';
import { calculateNetworkRisk } from '../services/riskEngine';
import { rankInvestigationPriorities } from '../services/priorityEngine';
import { inferPotentialRoles } from '../services/roleEngine';

const router = Router();

// GET /api/investigations
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const investigations = queryAll(db, 'SELECT * FROM investigations ORDER BY created_at DESC');
    const entities = queryAll(db, 'SELECT * FROM entities');
    const relationships = queryAll(db, 'SELECT * FROM relationships');

    const result = investigations.map((inv) => {
      const invNodes = entities.filter((e) => e.investigation_id === inv.id);
      const invEdges = relationships.filter((r) => r.investigation_id === inv.id);

      return {
        id: inv.id,
        caseNumber: inv.case_number,
        name: inv.name,
        description: inv.description,
        status: inv.status,
        leadInvestigator: inv.lead_investigator,
        agency: inv.agency,
        classification: inv.classification,
        totalFundsUSD: inv.total_monitored_funds_usd,
        nodesCount: invNodes.length,
        edgesCount: invEdges.length,
        createdAt: inv.created_at,
        updatedAt: inv.updated_at,
      };
    });

    res.json({ investigations: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/investigations/:id
router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const id = req.params.id;
    const inv = queryOne(db, 'SELECT * FROM investigations WHERE id = ?', [id]);

    if (!inv) {
      return res.status(404).json({ error: `Investigation ${id} not found` });
    }

    const entities = queryAll(db, 'SELECT * FROM entities WHERE investigation_id = ?', [id]);
    const relationships = queryAll(db, 'SELECT * FROM relationships WHERE investigation_id = ?', [id]);
    const evidence = queryAll(db, 'SELECT * FROM evidence WHERE investigation_id = ? ORDER BY timestamp DESC', [id]);
    const timeline = queryAll(db, 'SELECT * FROM timeline_events WHERE investigation_id = ? ORDER BY timestamp ASC', [id]);

    // Parse metadata for nodes
    const parsedNodes = entities.map((e) => {
      let meta = {};
      try {
        meta = typeof e.metadata === 'string' ? JSON.parse(e.metadata || '{}') : e.metadata;
      } catch (err) {}
      return {
        id: e.id,
        label: e.label,
        name: e.name,
        type: e.type,
        threatLevel: e.threat_level,
        role: e.role,
        riskScore: e.risk_score,
        confidenceScore: e.confidence_score,
        clusterId: e.cluster_id,
        metadata: meta,
      };
    });

    const parsedEdges = relationships.map((r) => ({
      id: r.id,
      source: r.source,
      target: r.target,
      type: r.type,
      label: r.label,
      value: r.value,
      confidence: r.confidence,
      protocol: r.protocol,
      timestamp: r.timestamp,
      notes: r.notes,
    }));

    const graphMetrics = analyzeGraph(parsedNodes, parsedEdges);
    const risk = calculateNetworkRisk(parsedNodes, parsedEdges, evidence, timeline, graphMetrics);
    const priorities = rankInvestigationPriorities(parsedNodes, parsedEdges, evidence, graphMetrics);

    // Attach graph centrality and potential role info to nodes
    const enrichedNodes = parsedNodes.map((n) => {
      const nm = graphMetrics.nodeMetrics[n.id];
      const directEdges = parsedEdges.filter((e) => e.source === n.id || e.target === n.id);
      const roleInference = inferPotentialRoles(n, nm, directEdges);

      return {
        ...n,
        centrality: nm
          ? {
              betweenness: nm.betweennessCentrality,
              degree: nm.totalDegree,
              closeness: nm.closenessCentrality,
              pageRank: Number((nm.degreeCentrality * 0.8 + nm.betweennessCentrality * 0.2).toFixed(4)),
              disruptionImpact: nm.isBridgeCandidate ? 88 : Math.round(nm.betweennessCentrality * 100),
            }
          : undefined,
        potentialRole: roleInference.primaryRole,
        potentialRoles: roleInference.all_potential_roles,
      };
    });

    res.json({
      investigation: {
        id: inv.id,
        caseNumber: inv.case_number,
        title: inv.name,
        name: inv.name,
        description: inv.description,
        status: inv.status,
        leadInvestigator: inv.lead_investigator,
        agency: inv.agency,
        classification: inv.classification,
        totalMonitoredFundsUSD: inv.total_monitored_funds_usd,
        createdAt: inv.created_at,
        updatedAt: inv.updated_at,
        summary: inv.description,
        tags: ['Cyber-Financial', 'Cryptocurrency', 'Phishing', 'Wasabi Mixer'],
        nodes: enrichedNodes,
        edges: parsedEdges,
        evidence,
        timeline,
        graphMetrics,
        riskScore: risk.score,
        riskLevel: risk.level,
        riskBreakdown: risk.breakdown,
        riskIndicators: risk.indicators,
        priorities,
      },
    });
  } catch (error: any) {
    console.error('Error fetching investigation:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/investigations/:id/graph
router.get('/:id/graph', async (req, res) => {
  try {
    const db = await getDb();
    const id = req.params.id;
    const entities = queryAll(db, 'SELECT * FROM entities WHERE investigation_id = ?', [id]);
    const relationships = queryAll(db, 'SELECT * FROM relationships WHERE investigation_id = ?', [id]);

    const parsedNodes = entities.map((e) => ({
      id: e.id,
      label: e.label,
      name: e.name,
      type: e.type,
      threatLevel: e.threat_level,
      role: e.role,
      riskScore: e.risk_score,
      confidenceScore: e.confidence_score,
      clusterId: e.cluster_id,
      metadata: typeof e.metadata === 'string' ? JSON.parse(e.metadata || '{}') : e.metadata,
    }));

    const parsedEdges = relationships.map((r) => ({
      id: r.id,
      source: r.source,
      target: r.target,
      type: r.type,
      label: r.label,
      value: r.value,
      confidence: r.confidence,
      protocol: r.protocol,
      timestamp: r.timestamp,
      notes: r.notes,
    }));

    const graphMetrics = analyzeGraph(parsedNodes, parsedEdges);

    const nodesWithMetrics = parsedNodes.map((n) => {
      const nm = graphMetrics.nodeMetrics[n.id];
      const directEdges = parsedEdges.filter((e) => e.source === n.id || e.target === n.id);
      const roleInference = inferPotentialRoles(n, nm, directEdges);

      return {
        ...n,
        centrality: nm
          ? {
              betweenness: nm.betweennessCentrality,
              degree: nm.totalDegree,
              closeness: nm.closenessCentrality,
              pageRank: Number((nm.degreeCentrality * 0.8 + nm.betweennessCentrality * 0.2).toFixed(4)),
              disruptionImpact: nm.isBridgeCandidate ? 88 : Math.round(nm.betweennessCentrality * 100),
            }
          : undefined,
        potentialRole: roleInference.primaryRole,
        isBridgeCandidate: nm?.isBridgeCandidate || false,
      };
    });

    res.json({
      investigationId: id,
      nodes: nodesWithMetrics,
      edges: parsedEdges,
      metrics: graphMetrics,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/investigations/:id/evidence
router.get('/:id/evidence', async (req, res) => {
  try {
    const db = await getDb();
    const id = req.params.id;
    const evidence = queryAll(db, 'SELECT * FROM evidence WHERE investigation_id = ? ORDER BY timestamp DESC', [id]);
    res.json({ evidence });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/investigations/:id/timeline
router.get('/:id/timeline', async (req, res) => {
  try {
    const db = await getDb();
    const id = req.params.id;
    const timeline = queryAll(db, 'SELECT * FROM timeline_events WHERE investigation_id = ? ORDER BY timestamp ASC', [id]);
    
    const parsedTimeline = timeline.map((t) => ({
      id: t.id,
      timestamp: t.timestamp,
      title: t.title,
      description: t.description,
      entityIds: typeof t.entity_ids === 'string' ? JSON.parse(t.entity_ids || '[]') : t.entity_ids || [],
      category: t.category,
      severity: t.severity,
      amountUSD: t.amount_usd,
    }));

    res.json({ timeline: parsedTimeline });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/investigations/:id/priorities
router.get('/:id/priorities', async (req, res) => {
  try {
    const db = await getDb();
    const id = req.params.id;
    const entities = queryAll(db, 'SELECT * FROM entities WHERE investigation_id = ?', [id]);
    const relationships = queryAll(db, 'SELECT * FROM relationships WHERE investigation_id = ?', [id]);
    const evidence = queryAll(db, 'SELECT * FROM evidence WHERE investigation_id = ?', [id]);

    const graphMetrics = analyzeGraph(entities, relationships);
    const priorities = rankInvestigationPriorities(entities, relationships, evidence, graphMetrics);

    res.json({
      investigationId: id,
      priorities,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
