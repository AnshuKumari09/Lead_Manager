# Lead Manager

A small full-stack app for a sales user to capture and track leads.
Built for the Meru Technosoft Full Stack Developer screening assignment.

**Live demo:** https://lead-manager-cyan.vercel.app

## Features

Required
- Add a lead (name, email, phone, company, source dropdown, status)
- Leads table with colour-coded status
- Edit a lead, or change its status straight from the table
- Delete with a confirmation dialog
- Search (name, email, company) and filter by status
- Validation on both frontend and backend

Bonus (all done)
- Signup / login (JWT). Each user sees only their own leads
- Sorting and pagination
- Dashboard counts per status (they also work as quick filters)
- Automated API tests (7 tests, `node:test` + supertest)

## Tech and why

| Part | Choice | Why |
|---|---|---|
| Frontend | React + Vite | Matches the stack you use; Vite is fast and simple |
| Backend | Node.js + Express | Small, easy to read, the standard REST choice |
| Database | SQLite (`better-sqlite3`) | Zero setup for reviewers: no DB server to install. Schema is plain SQL and ports to PostgreSQL easily |
| Auth | bcrypt + JWT | Stateless and simple for a single API |

## Run locally

Needs Node.js 18 or newer.

```bash
# 1. API
cd server
cp .env.example .env        # then set JWT_SECRET to any long random string
npm install
npm run dev                 # http://localhost:4000

# 2. Frontend (new terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```

Open http://localhost:5173, create an account, and add leads.
In development Vite forwards `/api` calls to the API, so no frontend config is needed.

Run the tests: `cd server && npm test`

## API

All `/api/leads` routes need the header `Authorization: Bearer <token>`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Create account, returns token |
| POST | `/api/auth/login` | Log in, returns token |
| GET | `/api/auth/me` | Current user |
| GET | `/api/leads?search=&status=&sort=&order=&page=&limit=` | List with filter, sort, pagination |
| GET | `/api/leads/stats` | Counts per status |
| POST | `/api/leads` | Create |
| GET | `/api/leads/:id` | Read one |
| PUT | `/api/leads/:id` | Update (including status) |
| DELETE | `/api/leads/:id` | Delete |

Errors use one shape: `{ "error": "message", "details": { "field": "message" } }`
with proper status codes (400 validation, 401 not logged in, 404 not found, 409 duplicate email).

## Database design

- `users` (email is unique)
- `leads` belongs to a user (`user_id`, cascade delete). Status has a `CHECK` constraint
- Indexes on `(user_id, status)` and `(user_id, created_at)`, because every query is scoped to one user and then filtered or sorted

## Decisions and assumptions

- Search matches name, email and company (the brief asked for name; this is a superset).
- Sorting columns are whitelisted on the server, and all SQL uses bound parameters.
- Email is not required to be unique across leads (two people can share a company inbox).
- The same validation rules live on the client (instant feedback) and the server (the real check).
- Login errors say "incorrect email or password" so they do not reveal which emails exist.
- The JWT is kept in `localStorage` to keep the demo simple.

## What I would improve with more time

- Store the token in an httpOnly cookie, add rate limiting on login and refresh tokens
- Move to PostgreSQL with a migration tool, and add a notes / activity history per lead
- Frontend tests (React Testing Library) and an end-to-end test (Playwright)
- CSV import / export, and a "follow-up date" with reminders
- Deploy: API on Render or Railway with a persistent disk, frontend on Vercel (`VITE_API_URL` points to the API)

## Something tricky

_Write 2–3 lines in your own words here (for example: keeping the table, stats and pagination in sync after
edits and deletes, or making the table readable on a phone)._
