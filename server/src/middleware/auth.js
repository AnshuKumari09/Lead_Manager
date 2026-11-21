import jwt from 'jsonwebtoken';
import { HttpError } from '../errors.js';

export function signToken(user, secret) {
  return jwt.sign({ sub: user.id }, secret, { expiresIn: '7d' });
}

export function requireAuth(secret) {
  return (req, _res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next(new HttpError(401, 'Please log in to continue'));
    try {
      req.userId = jwt.verify(token, secret).sub;
      next();
    } catch {
      next(new HttpError(401, 'Your session has expired. Please log in again'));
    }
  };
}
