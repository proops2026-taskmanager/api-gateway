import { Router, Request, Response, NextFunction } from 'express';

export function createProxyRouter(): Router {
  const router = Router();

  const userServiceUrl = () => process.env.USER_SERVICE_URL || 'http://localhost:3001';
  const taskServiceUrl = () => process.env.TASK_SERVICE_URL || 'http://localhost:3002';
  const notificationServiceUrl = () => process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003';

  // ─── User-service public routes ────────────────────────────────────────────

  async function registerUser(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await fetch(`${userServiceUrl()}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });
      res.status(response.status).json(await response.json());
    } catch (error) { next(error); }
  }

  async function loginUser(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await fetch(`${userServiceUrl()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });
      res.status(response.status).json(await response.json());
    } catch (error) { next(error); }
  }

  // Both /api/users (via ingress) and /users (docker-compose) work
  router.post('/api/users', registerUser);
  router.post('/users', registerUser);

  router.post('/api/auth/login', loginUser);
  router.post('/auth/login', loginUser);

  // ─── User-service protected routes ─────────────────────────────────────────

  async function listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await fetch(`${userServiceUrl()}/users`, {
        method: 'GET',
        headers: {
          'X-User-Id': req.headers['x-user-id'] as string || '',
          'X-User-Role': req.headers['x-user-role'] as string || '',
        },
      });
      res.status(response.status).json(await response.json());
    } catch (error) { next(error); }
  }

  async function getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await fetch(`${userServiceUrl()}/users/${req.params.id}`, {
        method: 'GET',
        headers: {
          'X-User-Id': req.headers['x-user-id'] as string || '',
          'X-User-Role': req.headers['x-user-role'] as string || '',
        },
      });
      res.status(response.status).json(await response.json());
    } catch (error) { next(error); }
  }

  router.get('/api/users', listUsers);
  router.get('/users', listUsers);

  router.get('/api/users/:id', getUser);
  router.get('/users/:id', getUser);

  // ─── Task-service protected routes ─────────────────────────────────────────

  async function listTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const qs = new URLSearchParams(req.query as Record<string, string>).toString();
      const response = await fetch(`${taskServiceUrl()}/tasks${qs ? `?${qs}` : ''}`, {
        method: 'GET',
        headers: {
          'X-User-Id': req.headers['x-user-id'] as string || '',
          'X-User-Role': req.headers['x-user-role'] as string || '',
        },
      });
      res.status(response.status).json(await response.json());
    } catch (error) { next(error); }
  }

  async function createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await fetch(`${taskServiceUrl()}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': req.headers['x-user-id'] as string || '',
          'X-User-Role': req.headers['x-user-role'] as string || '',
        },
        body: JSON.stringify(req.body),
      });
      res.status(response.status).json(await response.json());
    } catch (error) { next(error); }
  }

  async function getTask(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await fetch(`${taskServiceUrl()}/tasks/${req.params.id}`, {
        method: 'GET',
        headers: {
          'X-User-Id': req.headers['x-user-id'] as string || '',
          'X-User-Role': req.headers['x-user-role'] as string || '',
        },
      });
      res.status(response.status).json(await response.json());
    } catch (error) { next(error); }
  }

  async function updateTaskStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await fetch(`${taskServiceUrl()}/tasks/${req.params.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': req.headers['x-user-id'] as string || '',
          'X-User-Role': req.headers['x-user-role'] as string || '',
        },
        body: JSON.stringify(req.body),
      });
      res.status(response.status).json(await response.json());
    } catch (error) { next(error); }
  }

  async function deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await fetch(`${taskServiceUrl()}/tasks/${req.params.id}`, {
        method: 'DELETE',
        headers: {
          'X-User-Id': req.headers['x-user-id'] as string || '',
          'X-User-Role': req.headers['x-user-role'] as string || '',
        },
      });
      res.status(response.status).send();
    } catch (error) { next(error); }
  }

  async function editTask(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await fetch(`${taskServiceUrl()}/tasks/${req.params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': req.headers['x-user-id'] as string || '',
          'X-User-Role': req.headers['x-user-role'] as string || '',
        },
        body: JSON.stringify(req.body),
      });
      res.status(response.status).json(await response.json());
    } catch (error) { next(error); }
  }

  async function addComment(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await fetch(`${taskServiceUrl()}/tasks/${req.params.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': req.headers['x-user-id'] as string || '',
          'X-User-Role': req.headers['x-user-role'] as string || '',
        },
        body: JSON.stringify(req.body),
      });
      res.status(response.status).json(await response.json());
    } catch (error) { next(error); }
  }

  // ─── Notification-service protected routes ──────────────────────────────────

  async function listNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const qs = new URLSearchParams(req.query as Record<string, string>).toString();
      const response = await fetch(`${notificationServiceUrl()}/notifications${qs ? `?${qs}` : ''}`, {
        method: 'GET',
        headers: { 'X-User-Id': req.headers['x-user-id'] as string || '' },
      });
      res.status(response.status).json(await response.json());
    } catch (error) { next(error); }
  }

  async function markNotificationRead(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await fetch(`${notificationServiceUrl()}/notifications/${req.params.id}/read`, {
        method: 'PATCH',
        headers: { 'X-User-Id': req.headers['x-user-id'] as string || '' },
      });
      res.status(response.status).json(await response.json());
    } catch (error) { next(error); }
  }

  async function markAllNotificationsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const response = await fetch(`${notificationServiceUrl()}/notifications/read-all`, {
        method: 'PATCH',
        headers: { 'X-User-Id': req.headers['x-user-id'] as string || '' },
      });
      res.status(response.status).json(await response.json());
    } catch (error) { next(error); }
  }

  router.get('/api/tasks', listTasks);
  router.get('/tasks', listTasks);

  router.post('/api/tasks', createTask);
  router.post('/tasks', createTask);

  router.get('/api/tasks/:id', getTask);
  router.get('/tasks/:id', getTask);

  router.patch('/api/tasks/:id/status', updateTaskStatus);
  router.patch('/tasks/:id/status', updateTaskStatus);

  router.patch('/api/tasks/:id', editTask);
  router.patch('/tasks/:id', editTask);

  router.delete('/api/tasks/:id', deleteTask);
  router.delete('/tasks/:id', deleteTask);

  router.post('/api/tasks/:id/comments', addComment);
  router.post('/tasks/:id/comments', addComment);

  router.get('/api/notifications', listNotifications);
  router.get('/notifications', listNotifications);

  router.patch('/api/notifications/read-all', markAllNotificationsRead);
  router.patch('/notifications/read-all', markAllNotificationsRead);

  router.patch('/api/notifications/:id/read', markNotificationRead);
  router.patch('/notifications/:id/read', markNotificationRead);

  return router;
}
