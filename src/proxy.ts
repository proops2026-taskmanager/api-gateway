import { createProxyMiddleware } from 'http-proxy-middleware';
import { Router } from 'express';

export function createProxyRouter(): Router {
  const router = Router();

  const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
  const taskServiceUrl = process.env.TASK_SERVICE_URL || 'http://localhost:3002';

  // /api/users → user-service/users, /api/auth → user-service/auth
  router.use(createProxyMiddleware({
    pathFilter: ['/api/users', '/api/auth'],
    target: userServiceUrl,
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
  }));

  // /api/tasks → task-service/tasks
  router.use(createProxyMiddleware({
    pathFilter: '/api/tasks',
    target: taskServiceUrl,
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
  }));

  return router;
}
