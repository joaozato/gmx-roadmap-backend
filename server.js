const express = require("express");
const cors = require("cors");
const path = require("path");
const Database = require("better-sqlite3");

const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data.db");

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    payload TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    updated_by TEXT
  );
  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT,
    summary TEXT,
    created_at TEXT NOT NULL
  );
`);

const DEFAULT_DATA = require("./default-data.json");

function getState() {
  const row = db.prepare("SELECT payload, updated_at, updated_by FROM state WHERE id = 1").get();
  if (!row) {
    const now = new Date().toISOString();
    db.prepare(
      "INSERT INTO state (id, payload, updated_at, updated_by) VALUES (1, ?, ?, ?)"
    ).run(JSON.stringify(DEFAULT_DATA), now, "sistema");
    return { payload: DEFAULT_DATA, updated_at: now, updated_by: "sistema" };
  }
  return { payload: JSON.parse(row.payload), updated_at: row.updated_at, updated_by: row.updated_by };
}

function setState(payload, userName) {
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO state (id, payload, updated_at, updated_by) VALUES (1, ?, ?, ?) " +
    "ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at, updated_by = excluded.updated_by"
  ).run(JSON.stringify(payload), now, userName || "anonimo");
  db.prepare(
    "INSERT INTO audit_log (user_name, summary, created_at) VALUES (?, ?, ?)"
  ).run(userName || "anonimo", "atualizacao do roadmap", now);
  return now;
}

// GET current state
app.get("/api/data", (req, res) => {
  const state = getState();
  res.json(state);
});

// PUT replaces the entire roadmap state
app.put("/api/data", (req, res) => {
  const body = req.body;
  const userName = (req.body && req.body.__user) || req.header("x-user-name") || "anonimo";
  if (!body || !Array.isArray(body.pillars)) {
    return res.status(400).json({ error: "payload invalido: esperado objeto com 'pillars'" });
  }
  const cleanPayload = { pillars: body.pillars };
  const updatedAt = setState(cleanPayload, userName);
  res.json({ ok: true, updated_at: updatedAt, updated_by: userName });
});

// GET recent activity (last 30 changes)
app.get("/api/activity", (req, res) => {
  const rows = db
    .prepare("SELECT user_name, summary, created_at FROM audit_log ORDER BY id DESC LIMIT 30")
    .all();
  res.json(rows);
});

// Returns the original default content, without touching the saved state
app.get("/api/default-data", (req, res) => {
  res.json(DEFAULT_DATA);
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// SPA fallback -> serve the frontend for any non-api route
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`GMX roadmap backend rodando na porta ${PORT}`);
});
