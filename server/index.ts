import express, { Express } from 'express';
import dotenv from 'dotenv';
import { getDb } from './database';
import { seedDatabase } from './seed';

import dashboardRouter from './routes/dashboard';
import investigationsRouter from './routes/investigations';
import entitiesRouter from './routes/entities';
import evidenceRouter from './routes/evidence';
import analysisRouter from './routes/analysis';
import simulationRouter from './routes/simulation';
import timelineRouter from './routes/timeline';
import threatIntelRouter from './routes/threatIntel';
import reportsRouter from './routes/reports';

dotenv.config();

export async function setupApiRoutes(app: Express): Promise<void> {
  // Initialize Database and Seed data
  const db = await getDb();
  seedDatabase(db);

  // Health endpoint as strictly specified in user prompt
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'NetTrace API',
    });
  });

  // API Route Handlers
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/investigations', investigationsRouter);
  app.use('/api/entities', entitiesRouter);
  app.use('/api/evidence', evidenceRouter);
  app.use('/api/analyze', analysisRouter);
  app.use('/api/simulation', simulationRouter);
  app.use('/api/threat-intel', threatIntelRouter);
  app.use('/api/timeline', timelineRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/ai', reportsRouter);
}

export async function createServer(): Promise<Express> {
  const app = express();
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // CORS middleware for local development
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  await setupApiRoutes(app);
  return app;
}

// If executed directly (e.g. tsx server/index.ts)
if (process.argv[1] && process.argv[1].includes('server/index.ts')) {
  const PORT = Number(process.env.PORT) || 8000;
  createServer().then((app) => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[NetTrace Backend] Server started and listening on http://0.0.0.0:${PORT}`);
    });
  });
}
