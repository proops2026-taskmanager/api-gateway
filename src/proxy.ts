import { createProxyMiddleware } from 'http-proxy-middleware';
import { IncomingMessage } from 'http';
import { Router, Request } from 'express';

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

  // /users → user-service/users, /auth → user-service/auth
  // (Ingress strips /api prefix before requests reach api-gateway)
  router.use(createProxyMiddleware({
    pathFilter: ['/users', '/auth'],
    target: userServiceUrl,
    changeOrigin: true,
    on: { proxyRes: addCorsHeaders },
  }));

  // /tasks → task-service/tasks
  router.use(createProxyMiddleware({
    pathFilter: '/tasks',
    target: taskServiceUrl,
    changeOrigin: true,
    on: { proxyRes: addCorsHeaders },
  }));

  return router;
}
