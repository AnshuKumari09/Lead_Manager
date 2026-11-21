import 'dotenv/config';
import { createDb } from './db.js';
import { createApp } from './app.js';

const PORT = process.env.PORT || 4000;
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  console.error('JWT_SECRET is missing. Copy .env.example to .env and set it.');
  process.exit(1);
}

const db = createDb(process.env.DB_PATH || './data/leads.db');
const app = createApp(db, { jwtSecret, clientOrigin: process.env.CLIENT_ORIGIN });

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
