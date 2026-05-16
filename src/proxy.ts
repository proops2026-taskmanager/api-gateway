import { createProxyMiddleware } from 'http-proxy-middleware';
import { IncomingMessage } from 'http';
import { Router, Request, Response, NextFunction } from 'express';
import { jwtMiddleware } from './middleware/auth';

function requireJwt(req: Request, res: Response, next: NextFunction): void {
  if (req.path.startsWith('/api/tasks')) {
    jwtMiddleware(req, res, next);
  } else {
    next();
  }
}

export function createProxyRouter(): Router {
  const router = Router();

  const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
  const taskServiceUrl = process.env.TASK_SERVICE_URL || 'http://localhost:3002';
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';

  const addCorsHeaders = (proxyRes: IncomingMessage, req: IncomingMessage) => {
    const origin = (req as Request).headers.origin || corsOrigin;
    proxyRes.headers['access-control-allow-origin'] = origin;
    proxyRes.headers['access-control-allow-credentials'] = 'true';
  };

  // Apply JWT to task routes without stripping the path prefix
  router.use(requireJwt);

  // /api/users → user-service/users, /api/auth → user-service/auth
  router.use(createProxyMiddleware({
    pathFilter: ['/api/users', '/api/auth'],
    target: userServiceUrl,
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
    on: { proxyRes: addCorsHeaders },
  }));

  // /api/tasks → task-service/tasks
  router.use(createProxyMiddleware({
    pathFilter: '/api/tasks',
    target: taskServiceUrl,
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
    on: { proxyRes: addCorsHeaders },
  }));

  return router;
}
