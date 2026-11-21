import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { leadsRouter } from './routes/leads.js';
import { requireAuth } from './middleware/auth.js';
import { HttpError } from './errors.js';
import { SOURCES, STATUSES } from './constants.js';

export function createApp(db, { jwtSecret, clientOrigin } = {}) {
  const app = express();
  app.use(cors({ origin: clientOrigin ? clientOrigin.split(',') : true }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.get('/api/meta', (_req, res) => res.json({ statuses: STATUSES, sources: SOURCES }));
  app.use('/api/auth', authRouter(db, jwtSecret));
  app.use('/api/leads', requireAuth(jwtSecret), leadsRouter(db));

  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Route not found')));

  // Central error handler: one place decides what the client sees.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message, details: err.details });
    }
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Request body is not valid JSON' });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on our side' });
  });

  return app;
}
