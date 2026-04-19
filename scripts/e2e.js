#!/usr/bin/env node
// T-19: End-to-end test — register → login → create task → update status via gateway only
// Requires: docker compose stack running on localhost:8080

const BASE = process.env.GATEWAY_URL ?? 'http://localhost:8080';

async function post(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try {
    return { status: res.status, body: JSON.parse(text) };
  } catch {
    return { status: res.status, body: text };
  }
}

async function patch(path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try {
    return { status: res.status, body: JSON.parse(text) };
  } catch {
    return { status: res.status, body: text };
  }
}

function assert(label, condition, actual) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    return true;
  } else {
    console.log(`  ✕ ${label}`);
    console.log(`    got: ${JSON.stringify(actual)}`);
    return false;
  }
}

async function run() {
  let passed = 0;
  let failed = 0;

  function check(label, condition, actual) {
    if (assert(label, condition, actual)) passed++;
    else failed++;
  }

  const email = `e2e-${Date.now()}@test.com`;
  const password = 'e2epassword1';

  // ── Step 1: Register ──────────────────────────────────────────────────────
  console.log('\n[1] POST /api/users — register');
  const reg = await post('/api/users', {
    email,
    password,
    full_name: 'E2E User',
    role: 'lead',
  });
  check('201 Created', reg.status === 201, reg.status);
  check('body has id', typeof reg.body.id === 'string', reg.body);
  check('body has email', reg.body.email === email, reg.body.email);
  check('no password_hash leaked', reg.body.password_hash === undefined, reg.body);
  const userId = reg.body.id;

  if (!userId) {
    console.log('\nFATAL: registration failed — aborting');
    process.exit(1);
  }

  // ── Step 2: Login ─────────────────────────────────────────────────────────
  console.log('\n[2] POST /api/auth/login — login');
  const login = await post('/api/auth/login', { email, password });
  check('200 OK', login.status === 200, login.status);
  check('token present', typeof login.body.token === 'string', login.body);
  const token = login.body.token;

  if (!token) {
    console.log('\nFATAL: login failed — aborting');
    process.exit(1);
  }

  // ── Step 3: Create task ───────────────────────────────────────────────────
  console.log('\n[3] POST /api/tasks — create task');
  const create = await post(
    '/api/tasks',
    { title: 'T-19 e2e task', assignee_id: userId },
    token
  );
  check('201 Created', create.status === 201, create.status);
  check('task has id', typeof create.body.id === 'string', create.body);
  check('status is TODO', create.body.status === 'TODO', create.body.status);
  const taskId = create.body.id;

  if (!taskId) {
    console.log('\nFATAL: task creation failed — aborting');
    process.exit(1);
  }

  // ── Step 4: Update status ─────────────────────────────────────────────────
  console.log('\n[4] PATCH /api/tasks/:id/status — TODO → IN_PROGRESS');
  const update = await patch(`/api/tasks/${taskId}/status`, { status: 'IN_PROGRESS' }, token);
  check('200 OK', update.status === 200, update.status);
  check('status is IN_PROGRESS', update.body.status === 'IN_PROGRESS', update.body.status);

  // ── Step 5: No token → 401 ────────────────────────────────────────────────
  console.log('\n[5] POST /api/tasks without token — 401 guard');
  const noToken = await post('/api/tasks', { title: 'hack', assignee_id: userId });
  check('401 Unauthorized', noToken.status === 401, noToken.status);
  check('error message correct', noToken.body.error === 'authorization header required', noToken.body);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\nT-19 result: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
