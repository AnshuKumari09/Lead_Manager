import { Router } from 'express';
import { HttpError } from '../errors.js';
import { STATUSES } from '../constants.js';
import { validateLead } from '../validation.js';

const SORTABLE = ['name', 'company', 'status', 'created_at'];

// Escape % and _ so a search like "50%" is treated literally.
const likePattern = (s) => `%${s.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

export function leadsRouter(db) {
  const router = Router();

  const findOwned = (id, userId) => {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ? AND user_id = ?').get(id, userId);
    if (!lead) throw new HttpError(404, 'Lead not found');
    return lead;
  };

  // GET /api/leads?search=&status=&sort=&order=&page=&limit=
  router.get('/', (req, res) => {
    const { search = '', status = '', sort = 'created_at', order = 'desc' } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));

    if (status && !STATUSES.includes(status)) throw new HttpError(400, 'Invalid status filter');
    const sortCol = SORTABLE.includes(sort) ? sort : 'created_at'; // whitelist: never put raw input in SQL
    const sortDir = String(order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const where = ['user_id = ?'];
    const params = [req.userId];
    if (status) {
      where.push('status = ?');
      params.push(status);
    }
    const term = String(search).trim();
    if (term) {
      where.push("(name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\' OR company LIKE ? ESCAPE '\\')");
      const p = likePattern(term);
      params.push(p, p, p);
    }
    const whereSql = where.join(' AND ');

    const total = db.prepare(`SELECT COUNT(*) AS n FROM leads WHERE ${whereSql}`).get(...params).n;
    const data = db
      .prepare(`SELECT * FROM leads WHERE ${whereSql} ORDER BY ${sortCol} ${sortDir}, id DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, (page - 1) * limit);

    res.json({ data, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
  });

  // GET /api/leads/stats  -> counts per status (defined before /:id on purpose)
  router.get('/stats', (req, res) => {
    const rows = db
      .prepare('SELECT status, COUNT(*) AS n FROM leads WHERE user_id = ? GROUP BY status')
      .all(req.userId);
    const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    rows.forEach((r) => (byStatus[r.status] = r.n));
    res.json({ total: Object.values(byStatus).reduce((a, b) => a + b, 0), byStatus });
  });

  router.get('/:id', (req, res) => {
    res.json(findOwned(req.params.id, req.userId));
  });

  router.post('/', (req, res) => {
    const { errors, value } = validateLead(req.body);
    if (Object.keys(errors).length) throw new HttpError(400, 'Validation failed', errors);
    const info = db
      .prepare(
        `INSERT INTO leads (user_id, name, email, phone, company, source, status)
         VALUES (@userId, @name, @email, @phone, @company, @source, @status)`
      )
      .run({ userId: req.userId, ...value });
    res.status(201).json(findOwned(info.lastInsertRowid, req.userId));
  });

  router.put('/:id', (req, res) => {
    findOwned(req.params.id, req.userId);
    const { errors, value } = validateLead(req.body);
    if (Object.keys(errors).length) throw new HttpError(400, 'Validation failed', errors);
    db.prepare(
      `UPDATE leads SET name=@name, email=@email, phone=@phone, company=@company,
         source=@source, status=@status, updated_at=datetime('now')
       WHERE id=@id AND user_id=@userId`
    ).run({ ...value, id: req.params.id, userId: req.userId });
    res.json(findOwned(req.params.id, req.userId));
  });

  router.delete('/:id', (req, res) => {
    findOwned(req.params.id, req.userId);
    db.prepare('DELETE FROM leads WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
    res.status(204).end();
  });

  return router;
}
