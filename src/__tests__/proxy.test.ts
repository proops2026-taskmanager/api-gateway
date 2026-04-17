import express from 'express';
import type { Express } from 'express';
import { Server } from 'http';
import request from 'supertest';
import jwt from 'jsonwebtoken';

const TEST_JWT_SECRET = 'test-secret-minimum-32-characters-long';
const validToken = jwt.sign({ sub: 'user-uuid-123', role: 'member' }, TEST_JWT_SECRET, { expiresIn: '1h' });

let app: Express;
let userServer: Server;
let taskServer: Server;

beforeAll((done) => {
  process.env.USER_SERVICE_URL = 'http://127.0.0.1:14001';
  process.env.TASK_SERVICE_URL = 'http://127.0.0.1:14002';
  process.env.JWT_SECRET = TEST_JWT_SECRET;

  jest.resetModules();
  app = require('../app').default;

  const userMock = express();
  userMock.use(express.json());
  userMock.post('/users', (req, res) => res.status(201).json({ id: 'abc', email: req.body.email }));
  userMock.post('/auth/login', (_req, res) => res.status(200).json({ token: 'jwt123' }));
  userMock.get('/users/:id', (req, res) => res.status(200).json({ id: req.params.id, email: 'a@b.com' }));

  const taskMock = express();
  taskMock.use(express.json());
  taskMock.post('/tasks', (req, res) => res.status(201).json({ id: 't1', title: req.body.title, status: 'TODO' }));
  taskMock.get('/tasks', (_req, res) => res.status(200).json([{ id: 't1', title: 'Do stuff' }]));
  taskMock.get('/tasks/:id', (req, res) => res.status(200).json({ id: req.params.id, title: 'Do stuff' }));
  taskMock.patch('/tasks/:id/status', (req, res) => res.status(200).json({ id: req.params.id, status: req.body.status }));
  taskMock.delete('/tasks/:id', (_req, res) => res.status(204).end());
  taskMock.post('/tasks/:id/comments', (req, res) => res.status(201).json({ id: 'c1', body: req.body.body }));

  userServer = userMock.listen(14001, () => {
    taskServer = taskMock.listen(14002, done);
  });
});

afterAll((done) => {
  userServer.close(() => taskServer.close(done));
});

describe('Proxy routing — user-service (public)', () => {
  it('POST /api/users → user-service/users', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ email: 'a@b.com', password: 'pass1234', full_name: 'A B' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 'abc', email: 'a@b.com' });
  });

  it('POST /api/auth/login → user-service/auth/login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com', password: 'pass1234' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ token: 'jwt123' });
  });

  it('GET /api/users/:id → user-service/users/:id', async () => {
    const res = await request(app).get('/api/users/u1');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 'u1' });
  });
});

describe('JWT middleware — task routes require valid token', () => {
  it('POST /api/tasks without token → 401', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'x', assignee_id: 'u1' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'authorization header required' });
  });

  it('POST /api/tasks with invalid token → 401', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', 'Bearer not-a-valid-token')
      .send({ title: 'x', assignee_id: 'u1' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid token' });
  });

  it('POST /api/tasks with expired token → 401', async () => {
    const expired = jwt.sign({ sub: 'u1', role: 'member' }, TEST_JWT_SECRET, { expiresIn: -1 });
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', 'Bearer ' + expired)
      .send({ title: 'x', assignee_id: 'u1' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Token expired' });
  });
});

describe('Proxy routing — task-service (protected)', () => {
  it('POST /api/tasks → task-service/tasks', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ title: 'Do stuff', assignee_id: 'u1' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 't1', status: 'TODO' });
  });

  it('GET /api/tasks → task-service/tasks', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: 't1', title: 'Do stuff' }]);
  });

  it('GET /api/tasks/:id → task-service/tasks/:id', async () => {
    const res = await request(app)
      .get('/api/tasks/t1')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 't1' });
  });

  it('PATCH /api/tasks/:id/status → task-service/tasks/:id/status', async () => {
    const res = await request(app)
      .patch('/api/tasks/t1/status')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 't1', status: 'IN_PROGRESS' });
  });

  it('DELETE /api/tasks/:id → task-service/tasks/:id', async () => {
    const res = await request(app)
      .delete('/api/tasks/t1')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(204);
  });

  it('POST /api/tasks/:id/comments → task-service/tasks/:id/comments', async () => {
    const res = await request(app)
      .post('/api/tasks/t1/comments')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ body: 'Nice work' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 'c1', body: 'Nice work' });
  });
});
