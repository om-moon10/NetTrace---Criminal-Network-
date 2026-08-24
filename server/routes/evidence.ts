import { Router } from 'express';
import { getDb, execute, queryAll, queryOne } from '../database';

const router = Router();

// GET /api/evidence (all evidence or filtered by investigationId)
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const investigationId = req.query.investigationId as string;
    let sql = 'SELECT * FROM evidence ORDER BY timestamp DESC';
    let params: any[] = [];

    if (investigationId) {
      sql = 'SELECT * FROM evidence WHERE investigation_id = ? ORDER BY timestamp DESC';
      params = [investigationId];
    }

    const evidence = queryAll(db, sql, params);
    res.json({ evidence });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/evidence
router.post('/', async (req, res) => {
  try {
    const db = await getDb();
    const {
      investigationId = 'NX-102',
      entityId,
      sourceName = 'Manual Forensic Ingestion',
      sourceType = 'manual',
      rawContent,
      extractedIndicators = [],
      confidenceWeight = 85,
      timestamp = new Date().toISOString(),
    } = req.body;

    if (!rawContent) {
      return res.status(400).json({ error: 'rawContent is required' });
    }

    const id = `ev-${Date.now()}`;
    const indicatorsJson = Array.isArray(extractedIndicators)
      ? JSON.stringify(extractedIndicators)
      : typeof extractedIndicators === 'string'
      ? extractedIndicators
      : '[]';

    execute(
      db,
      `INSERT INTO evidence (
        id, investigation_id, entity_id, source_name, source_type, raw_content, extracted_indicators, confidence_weight, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, investigationId, entityId || null, sourceName, sourceType, rawContent, indicatorsJson, confidenceWeight, timestamp]
    );

    const saved = queryOne(db, 'SELECT * FROM evidence WHERE id = ?', [id]);

    res.status(201).json({
      message: 'Evidence added and persisted successfully',
      evidence: saved,
    });
  } catch (error: any) {
    console.error('Error creating evidence:', error);
    res.status(500).json({ error: error.message || 'Failed to persist evidence' });
  }
});

export default router;
