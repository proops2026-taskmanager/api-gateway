import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

function isPublic(req: Request): boolean {
  if (req.method === 'POST' && req.path === '/users') return true;
  if (req.method === 'POST' && req.path === '/auth/login') return true;
  if (req.method === 'GET' && req.path.startsWith('/users/')) return true;
  return false;
}

export function jwtMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (isPublic(req)) {
    next();
    return;
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'authorization header required' });
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({ error: 'JWT_SECRET not configured' });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as {
      sub: string;
      role: string;
    };

    req.headers['x-user-id'] = payload.sub;
    req.headers['x-user-role'] = payload.role;
    delete req.headers['authorization'];

    next();
  } catch (err: unknown) {
    const message = err instanceof jwt.TokenExpiredError ? 'Token expired' : 'Invalid token';
    res.status(401).json({ error: message });
  }
}
