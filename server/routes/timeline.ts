import { Router } from 'express';
import { getDb, execute, queryAll, queryOne } from '../database';

const router = Router();

// GET /api/timeline
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const investigationId = (req.query.investigationId as string) || 'NX-102';
    const timeline = queryAll(
      db,
      'SELECT * FROM timeline_events WHERE investigation_id = ? ORDER BY timestamp ASC',
      [investigationId]
    );

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

    res.json({ timeline: parsedTimeline, timelineEvents: parsedTimeline });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/timeline
router.post('/', async (req, res) => {
  try {
    const db = await getDb();
    const {
      investigationId = 'NX-102',
      timestamp = new Date().toISOString(),
      title,
      description = '',
      entityIds = [],
      category = 'transaction',
      severity = 'medium',
      amountUSD,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    const id = `tl-${Date.now()}`;
    const entityIdsJson = Array.isArray(entityIds)
      ? JSON.stringify(entityIds)
      : typeof entityIds === 'string'
      ? entityIds
      : '[]';

    execute(
      db,
      `INSERT INTO timeline_events (
        id, investigation_id, timestamp, title, description, entity_ids, category, severity, amount_usd
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, investigationId, timestamp, title, description, entityIdsJson, category, severity, amountUSD || null]
    );

    const saved = queryOne(db, 'SELECT * FROM timeline_events WHERE id = ?', [id]);
    res.status(201).json({
      message: 'Timeline event created successfully',
      event: {
        ...saved,
        entityIds: typeof saved.entity_ids === 'string' ? JSON.parse(saved.entity_ids || '[]') : saved.entity_ids,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
