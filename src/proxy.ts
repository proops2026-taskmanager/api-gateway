import { createProxyMiddleware } from 'http-proxy-middleware';
import { Router } from 'express';
import { jwtMiddleware } from './middleware/auth';

export function createProxyRouter(): Router {
  const router = Router();

  const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
  const taskServiceUrl = process.env.TASK_SERVICE_URL || 'http://localhost:3002';

  // Public: /api/users, /api/auth → user-service (strip /api prefix)
  // Also route POST /users for frontend compatibility
  router.use(
    createProxyMiddleware({
      pathFilter: ['/api/users', '/api/auth'],
      target: userServiceUrl,
      changeOrigin: true,
      pathRewrite: { '^/api': '' },
    })
  );

  // Also handle /users (POST only) - frontend uses this path
  router.post('/users', async (req, res, next) => {
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
    try {
      const response = await fetch(`${userServiceUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      next(error);
    }
  });

  // Also handle GET /users (with JWT) - frontend uses this path for listing users
  router.get('/users', jwtMiddleware, async (req, res, next) => {
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
    try {
      // Forward the X-User-Id and X-User-Role headers
      const response = await fetch(`${userServiceUrl}/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': req.headers['x-user-id'] as string || '',
          'X-User-Role': req.headers['x-user-role'] as string || '',
        },
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      next(error);
    }
  });

  // Also handle /tasks endpoints - frontend uses this path
  router.get('/tasks', jwtMiddleware, async (req, res, next) => {
    const taskServiceUrl = process.env.TASK_SERVICE_URL || 'http://localhost:3002';
    try {
      const response = await fetch(`${taskServiceUrl}/tasks?${new URLSearchParams(req.query as Record<string, string>)}`, {
        method: 'GET',
        headers: {
          'X-User-Id': req.headers['x-user-id'] as string || '',
          'X-User-Role': req.headers['x-user-role'] as string || '',
        },
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      next(error);
    }
  });

  router.post('/tasks', jwtMiddleware, async (req, res, next) => {
    const taskServiceUrl = process.env.TASK_SERVICE_URL || 'http://localhost:3002';
    try {
      const response = await fetch(`${taskServiceUrl}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': req.headers['x-user-id'] as string || '',
          'X-User-Role': req.headers['x-user-role'] as string || '',
        },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      next(error);
    }
  });

  router.get('/tasks/:id', jwtMiddleware, async (req, res, next) => {
    const taskServiceUrl = process.env.TASK_SERVICE_URL || 'http://localhost:3002';
    try {
      const response = await fetch(`${taskServiceUrl}/tasks/${req.params.id}`, {
        method: 'GET',
        headers: {
          'X-User-Id': req.headers['x-user-id'] as string || '',
          'X-User-Role': req.headers['x-user-role'] as string || '',
        },
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      next(error);
    }
  });

  // Also handle /auth/login - frontend uses this path
  router.post('/auth/login', async (req, res, next) => {
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';
    try {
      const response = await fetch(`${userServiceUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      next(error);
    }
  });

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
