import { Router } from 'express';
import { getDb, queryAll, queryOne } from '../database';
import { analyzeGraph } from '../services/graphEngine';
import { calculateNetworkRisk } from '../services/riskEngine';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const db = await getDb();

    // 1. Get investigations
    const investigations = queryAll(db, 'SELECT * FROM investigations ORDER BY created_at DESC');
    
    // 2. Total counts
    const entities = queryAll(db, 'SELECT * FROM entities');
    const relationships = queryAll(db, 'SELECT * FROM relationships');
    const evidence = queryAll(db, 'SELECT * FROM evidence');
    const timeline = queryAll(db, 'SELECT * FROM timeline_events ORDER BY timestamp DESC');

    const criticalEntities = entities.filter((e) => e.threat_level === 'critical' || e.risk_score >= 85);
    const highRiskEntities = entities.filter((e) => e.risk_score >= 70);

    // Calculate total funds
    let totalFunds = 0;
    investigations.forEach((inv) => {
      totalFunds += Number(inv.total_monitored_funds_usd || 0);
    });

    // 3. For each investigation, compute real risk score
    const invSummaries = investigations.map((inv) => {
      const invNodes = entities.filter((e) => e.investigation_id === inv.id);
      const invEdges = relationships.filter((r) => r.investigation_id === inv.id);
      const invEvidence = evidence.filter((e) => e.investigation_id === inv.id);
      const invTimeline = timeline.filter((t) => t.investigation_id === inv.id);

      const metrics = analyzeGraph(invNodes, invEdges);
      const risk = calculateNetworkRisk(invNodes, invEdges, invEvidence, invTimeline, metrics);

      return {
        id: inv.id,
        caseNumber: inv.case_number,
        name: inv.name,
        description: inv.description,
        status: inv.status,
        classification: inv.classification,
        leadInvestigator: inv.lead_investigator,
        agency: inv.agency,
        totalFundsUSD: inv.total_monitored_funds_usd,
        nodesCount: invNodes.length,
        edgesCount: invEdges.length,
        evidenceCount: invEvidence.length,
        riskScore: risk.score,
        riskLevel: risk.level,
        riskBreakdown: risk.breakdown,
        updatedAt: inv.updated_at,
      };
    });

    res.json({
      metrics: {
        activeInvestigations: investigations.filter((i) => i.status === 'ACTIVE').length,
        highRiskNetworks: invSummaries.filter((i) => i.riskScore >= 70).length,
        criticalEntities: criticalEntities.length,
        suspiciousEvents: timeline.length,
        evidenceItems: evidence.length,
        totalMonitoredFundsUSD: totalFunds,
      },
      investigations: invSummaries,
      recentActivity: timeline.slice(0, 8),
      topThreatEntities: highRiskEntities.slice(0, 6).map((e) => ({
        id: e.id,
        label: e.label,
        name: e.name,
        type: e.type,
        role: e.role,
        riskScore: e.risk_score,
        threatLevel: e.threat_level,
        investigationId: e.investigation_id,
      })),
    });
  } catch (error: any) {
    console.error('Dashboard API error:', error);
    res.status(500).json({ error: error.message || 'Failed to load dashboard data' });
  }
});

export default router;
