import { createProxyMiddleware } from 'http-proxy-middleware';
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

  // Apply JWT to task routes without stripping the path prefix
  router.use(requireJwt);

  // Public: /api/users, /api/auth → user-service (strip /api prefix)
  router.use(
    createProxyMiddleware({
      pathFilter: ['/api/users', '/api/auth'],
      target: userServiceUrl,
      changeOrigin: true,
      pathRewrite: { '^/api': '' },
    })
  );

  // Protected: /api/tasks → task-service (strip /api prefix)
  router.use(
    createProxyMiddleware({
      pathFilter: '/api/tasks',
      target: taskServiceUrl,
      changeOrigin: true,
      pathRewrite: { '^/api': '' },
    })
  );

  return router;
}
