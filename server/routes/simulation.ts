import { Router } from 'express';
import { getDb, queryAll, queryOne } from '../database';
import { simulateNetworkDisruption } from '../services/simulationEngine';

const router = Router();

// POST /api/simulation and POST /api/simulation/run
const handleSimulation = async (req: any, res: any) => {
  try {
    const db = await getDb();
    const { investigationId = 'NX-102', entityId, entityIds, removedNodeIds, removedEntityIds } = req.body;

    const targets: string[] = [];
    if (Array.isArray(entityIds)) {
      targets.push(...entityIds);
    } else if (Array.isArray(removedNodeIds)) {
      targets.push(...removedNodeIds);
    } else if (Array.isArray(removedEntityIds)) {
      targets.push(...removedEntityIds);
    } else if (entityId) {
      targets.push(entityId);
    }

    if (targets.length === 0) {
      return res.status(400).json({ error: 'entityId or entityIds array is required for simulation' });
    }

    const nodes = queryAll(db, 'SELECT * FROM entities WHERE investigation_id = ?', [investigationId]);
    const edges = queryAll(db, 'SELECT * FROM relationships WHERE investigation_id = ?', [investigationId]);
    const evidence = queryAll(db, 'SELECT * FROM evidence WHERE investigation_id = ?', [investigationId]);
    const timeline = queryAll(db, 'SELECT * FROM timeline_events WHERE investigation_id = ?', [investigationId]);

    const result = simulateNetworkDisruption(nodes, edges, evidence, timeline, targets);

    res.json({
      investigationId,
      simulation: result,
      // For compatibility with frontend components expecting DisruptionSimulationResult schema
      targetEntityIds: result.targetEntityIds,
      before: result.before,
      after: result.after,
      difference: result.difference,
      delta: result.difference,
      disruption_level: result.disruption_level,
      explanation: result.explanation,
    });
  } catch (error: any) {
    console.error('Simulation error:', error);
    res.status(500).json({ error: error.message || 'Simulation execution failed' });
  }
};

router.post('/', handleSimulation);
router.post('/run', handleSimulation);

export default router;
