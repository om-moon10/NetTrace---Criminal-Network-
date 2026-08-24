import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { setupApiRoutes } from './server/index';
import { getDb, queryAll, queryOne } from './server/database';
import { analyzeGraph } from './server/services/graphEngine';
import { inferPotentialRoles } from './server/services/roleEngine';
import { calculateNetworkRisk } from './server/services/riskEngine';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

async function startServer() {
  // Mount all SQLite, Graph Engine, Risk, AI, and Simulation routes
  await setupApiRoutes(app);

  // Backward compatibility alias: /api/cases -> SQLite investigations
  app.get('/api/cases', async (req, res) => {
    try {
      const db = await getDb();
      const invs = queryAll(db, 'SELECT * FROM investigations');
      const allNodes = queryAll(db, 'SELECT * FROM entities');
      const allEdges = queryAll(db, 'SELECT * FROM relationships');

      const cases = invs.map((inv) => {
        const rawNodes = allNodes.filter((n) => n.investigation_id === inv.id).map((e) => ({
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
        const edges = allEdges.filter((e) => e.investigation_id === inv.id);

        const graphMetrics = analyzeGraph(rawNodes, edges);

        const nodes = rawNodes.map((n) => {
          const nm = graphMetrics.nodeMetrics[n.id];
          const directEdges = edges.filter((e) => e.source === n.id || e.target === n.id);
          const roleInference = inferPotentialRoles(n, nm, directEdges);

          return {
            ...n,
            centrality: nm
              ? {
                  betweenness: nm.betweennessCentrality,
                  degree: nm.totalDegree,
                  closeness: nm.closenessCentrality,
                  pageRank: Number((nm.degreeCentrality * 0.8 + nm.betweennessCentrality * 0.2).toFixed(4)),
                  disruptionImpact: nm.isBridgeCandidate ? 88 : Math.max(20, Math.round(nm.betweennessCentrality * 100)),
                }
              : undefined,
            potentialRole: roleInference.primaryRole,
            potentialRoles: roleInference.all_potential_roles,
          };
        });

        return {
          id: inv.id,
          caseNumber: inv.case_number,
          title: inv.name,
          name: inv.name,
          description: inv.description,
          status: inv.status.toLowerCase(),
          leadInvestigator: inv.lead_investigator,
          agency: inv.agency,
          classification: inv.classification,
          createdAt: inv.created_at,
          updatedAt: inv.updated_at,
          nodes,
          edges,
          summary: inv.description,
          tags: ['Cyber-Financial', 'Phantom Ledger', 'Crypto-Intelligence'],
          totalMonitoredFundsUSD: inv.total_monitored_funds_usd,
          suspectsCount: nodes.filter((n) => n.threatLevel === 'critical' || n.threatLevel === 'high').length,
          infrastructureCount: nodes.filter((n) => ['IP', 'DOMAIN', 'DEVICE', 'server', 'ip_address', 'domain'].includes(n.type)).length,
        };
      });

      res.json({ cases });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/cases/:id', async (req, res) => {
    try {
      const db = await getDb();
      const inv = queryOne(db, 'SELECT * FROM investigations WHERE id = ?', [req.params.id]);
      if (!inv) {
        return res.status(404).json({ error: 'Case not found' });
      }

      const allNodes = queryAll(db, 'SELECT * FROM entities WHERE investigation_id = ?', [req.params.id]);
      const allEdges = queryAll(db, 'SELECT * FROM relationships WHERE investigation_id = ?', [req.params.id]);

      const rawNodes = allNodes.map((e) => ({
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

      const graphMetrics = analyzeGraph(rawNodes, allEdges);

      const nodes = rawNodes.map((n) => {
        const nm = graphMetrics.nodeMetrics[n.id];
        const directEdges = allEdges.filter((e) => e.source === n.id || e.target === n.id);
        const roleInference = inferPotentialRoles(n, nm, directEdges);

        return {
          ...n,
          centrality: nm
            ? {
                betweenness: nm.betweennessCentrality,
                degree: nm.totalDegree,
                closeness: nm.closenessCentrality,
                pageRank: Number((nm.degreeCentrality * 0.8 + nm.betweennessCentrality * 0.2).toFixed(4)),
                disruptionImpact: nm.isBridgeCandidate ? 88 : Math.max(20, Math.round(nm.betweennessCentrality * 100)),
              }
            : undefined,
          potentialRole: roleInference.primaryRole,
          potentialRoles: roleInference.all_potential_roles,
        };
      });

      const caseObj = {
        id: inv.id,
        caseNumber: inv.case_number,
        title: inv.name,
        name: inv.name,
        description: inv.description,
        status: inv.status.toLowerCase(),
        leadInvestigator: inv.lead_investigator,
        agency: inv.agency,
        classification: inv.classification,
        createdAt: inv.created_at,
        updatedAt: inv.updated_at,
        nodes,
        edges: allEdges,
        summary: inv.description,
        tags: ['Cyber-Financial', 'Phantom Ledger', 'Crypto-Intelligence'],
        totalMonitoredFundsUSD: inv.total_monitored_funds_usd,
        suspectsCount: nodes.filter((n) => n.threatLevel === 'critical' || n.threatLevel === 'high').length,
        infrastructureCount: nodes.filter((n) => ['IP', 'DOMAIN', 'DEVICE', 'server', 'ip_address', 'domain'].includes(n.type)).length,
      };

      res.json({ case: caseObj });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NetTrace] Full-stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
