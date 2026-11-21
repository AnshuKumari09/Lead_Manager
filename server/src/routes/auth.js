import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { HttpError } from '../errors.js';
import { validateSignup } from '../validation.js';
import { requireAuth, signToken } from '../middleware/auth.js';

export function authRouter(db, secret) {
  const router = Router();
  const publicUser = ({ id, name, email }) => ({ id, name, email });

  router.post('/signup', (req, res) => {
    const { errors, value } = validateSignup(req.body);
    if (Object.keys(errors).length) throw new HttpError(400, 'Validation failed', errors);

    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(value.email)) {
      throw new HttpError(409, 'An account with this email already exists', { email: 'Email already registered' });
    }
    const hash = bcrypt.hashSync(value.password, 10);
    const info = db
      .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
      .run(value.name, value.email, hash);
    const user = { id: Number(info.lastInsertRowid), name: value.name, email: value.email };
    res.status(201).json({ token: signToken(user, secret), user });
  });

  router.post('/login', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    // Same message for both cases so we don't reveal which emails exist.
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      throw new HttpError(401, 'Incorrect email or password');
    }
    res.json({ token: signToken(user, secret), user: publicUser(user) });
  });

  router.get('/me', requireAuth(secret), (req, res) => {
    const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(req.userId);
    if (!user) throw new HttpError(401, 'Account no longer exists');
    res.json({ user });
  });

  return router;
}
