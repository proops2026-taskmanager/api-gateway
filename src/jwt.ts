import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const PUBLIC_ROUTES: Array<{ method: string; path: string }> = [
  { method: 'POST', path: '/users' },
  { method: 'POST', path: '/auth/login' },
];

function isPublic(req: Request): boolean {
  return PUBLIC_ROUTES.some(
    (r) => r.method === req.method && req.path === r.path
  );
}

export function jwtMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (isPublic(req)) {
    next();
    return;
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
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
      userId: string;
      role: string;
    };

    req.headers['x-user-id'] = payload.userId;
    req.headers['x-user-role'] = payload.role;
    delete req.headers['authorization'];

    next();
  } catch (err: unknown) {
    const message = err instanceof jwt.TokenExpiredError ? 'Token expired' : 'Invalid token';
    res.status(401).json({ error: message });
  }
}
