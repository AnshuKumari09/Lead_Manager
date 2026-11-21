import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createDb } from '../src/db.js';
import { createApp } from '../src/app.js';

let app;
before(() => {
  app = createApp(createDb(':memory:'), { jwtSecret: 'test-secret' });
});

const validLead = {
  name: 'Asha Verma',
  email: 'asha@example.com',
  phone: '+91 98765 43210',
  company: 'Acme Pvt Ltd',
  source: 'Website',
  status: 'New',
};

async function signup(email) {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ name: 'Test User', email, password: 'password123' });
  assert.equal(res.status, 201);
  return { Authorization: `Bearer ${res.body.token}` };
}

test('signup rejects bad input and duplicate emails', async () => {
  const bad = await request(app).post('/api/auth/signup').send({ name: '', email: 'nope', password: '123' });
  assert.equal(bad.status, 400);
  assert.ok(bad.body.details.email && bad.body.details.password && bad.body.details.name);

  await signup('dup@example.com');
  const dup = await request(app)
    .post('/api/auth/signup')
    .send({ name: 'X', email: 'dup@example.com', password: 'password123' });
  assert.equal(dup.status, 409);
});

test('login works and wrong password is rejected', async () => {
  await signup('login@example.com');
  const ok = await request(app).post('/api/auth/login').send({ email: 'login@example.com', password: 'password123' });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token);
  const bad = await request(app).post('/api/auth/login').send({ email: 'login@example.com', password: 'wrong-pass' });
  assert.equal(bad.status, 401);
});

test('leads endpoints require a token', async () => {
  const res = await request(app).get('/api/leads');
  assert.equal(res.status, 401);
});

test('create, read, update status, delete a lead', async () => {
  const auth = await signup('crud@example.com');

  const created = await request(app).post('/api/leads').set(auth).send(validLead);
  assert.equal(created.status, 201);
  assert.equal(created.body.status, 'New');
  const id = created.body.id;

  const updated = await request(app).put(`/api/leads/${id}`).set(auth).send({ ...validLead, status: 'Qualified' });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.status, 'Qualified');

  const del = await request(app).delete(`/api/leads/${id}`).set(auth);
  assert.equal(del.status, 204);
  const gone = await request(app).get(`/api/leads/${id}`).set(auth);
  assert.equal(gone.status, 404);
});

test('lead validation returns field errors', async () => {
  const auth = await signup('validate@example.com');
  const res = await request(app)
    .post('/api/leads')
    .set(auth)
    .send({ ...validLead, email: 'not-an-email', name: '', source: 'Nowhere', status: 'Won' });
  assert.equal(res.status, 400);
  assert.deepEqual(Object.keys(res.body.details).sort(), ['email', 'name', 'source', 'status']);
});

test('users only see their own leads', async () => {
  const a = await signup('owner-a@example.com');
  const b = await signup('owner-b@example.com');
  const lead = await request(app).post('/api/leads').set(a).send(validLead);

  const listB = await request(app).get('/api/leads').set(b);
  assert.equal(listB.body.pagination.total, 0);
  assert.equal((await request(app).get(`/api/leads/${lead.body.id}`).set(b)).status, 404);
  assert.equal((await request(app).delete(`/api/leads/${lead.body.id}`).set(b)).status, 404);
});

test('search, status filter, sorting, pagination and stats', async () => {
  const auth = await signup('list@example.com');
  const rows = [
    ['Zoya Khan', 'Qualified'],
    ['Aman Gupta', 'New'],
    ['Aman Singh', 'Lost'],
    ['Ravi Rao', 'New'],
    ['Meera Iyer', 'Contacted'],
  ];
  for (const [name, status] of rows) {
    const r = await request(app)
      .post('/api/leads')
      .set(auth)
      .send({ ...validLead, name, status, email: `${name.split(' ')[0].toLowerCase()}@example.com` });
    assert.equal(r.status, 201);
  }

  const search = await request(app).get('/api/leads?search=aman').set(auth);
  assert.equal(search.body.pagination.total, 2);

  const filtered = await request(app).get('/api/leads?status=New').set(auth);
  assert.equal(filtered.body.pagination.total, 2);

  const sorted = await request(app).get('/api/leads?sort=name&order=asc').set(auth);
  assert.equal(sorted.body.data[0].name, 'Aman Gupta');

  const page2 = await request(app).get('/api/leads?limit=2&page=2&sort=name&order=asc').set(auth);
  assert.equal(page2.body.data.length, 2);
  assert.equal(page2.body.pagination.totalPages, 3);

  const stats = await request(app).get('/api/leads/stats').set(auth);
  assert.equal(stats.body.total, 5);
  assert.deepEqual(stats.body.byStatus, { New: 2, Contacted: 1, Qualified: 1, Lost: 1 });

  const badStatus = await request(app).get('/api/leads?status=Bogus').set(auth);
  assert.equal(badStatus.status, 400);
});
