import { createProxyMiddleware } from 'http-proxy-middleware';
import { Router, Request, Response } from 'express';
import { IncomingMessage } from 'http';

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
