const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");

const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL nao definida. Configure a connection string do Postgres (Supabase).");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const DEFAULT_DATA = require("./default-data.json");

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      updated_by TEXT
    );
    CREATE TABLE IF NOT EXISTS audit_log (
      id SERIAL PRIMARY KEY,
      user_name TEXT,
      summary TEXT,
      created_at TIMESTAMPTZ NOT NULL
    );
  `);
}

async function getState() {
  const { rows } = await pool.query(
    "SELECT payload, updated_at, updated_by FROM state WHERE id = 1"
  );
  if (rows.length === 0) {
    const now = new Date().toISOString();
    await pool.query(
      "INSERT INTO state (id, payload, updated_at, updated_by) VALUES (1, $1, $2, $3)",
      [DEFAULT_DATA, now, "sistema"]
    );
    return { payload: DEFAULT_DATA, updated_at: now, updated_by: "sistema" };
  }
  const row = rows[0];
  return { payload: row.payload, updated_at: row.updated_at, updated_by: row.updated_by };
}

async function setState(payload, userName) {
  const now = new Date().toISOString();
  await pool.query(
    "INSERT INTO state (id, payload, updated_at, updated_by) VALUES (1, $1, $2, $3) " +
    "ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at, updated_by = excluded.updated_by",
    [payload, now, userName || "anonimo"]
  );
  await pool.query(
    "INSERT INTO audit_log (user_name, summary, created_at) VALUES ($1, $2, $3)",
    [userName || "anonimo", "atualizacao do roadmap", now]
  );
  return now;
}

// GET current state
app.get("/api/data", async (req, res) => {
  try {
    const state = await getState();
    res.json(state);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "erro ao ler estado" });
  }
});

// PUT replaces the entire roadmap state
app.put("/api/data", async (req, res) => {
  const body = req.body;
  const userName = (req.body && req.body.__user) || req.header("x-user-name") || "anonimo";
  if (!body || !Array.isArray(body.pillars)) {
    return res.status(400).json({ error: "payload invalido: esperado objeto com 'pillars'" });
  }
  const cleanPayload = { pillars: body.pillars };
  try {
    const updatedAt = await setState(cleanPayload, userName);
    res.json({ ok: true, updated_at: updatedAt, updated_by: userName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "erro ao salvar estado" });
  }
});

// GET recent activity (last 30 changes)
app.get("/api/activity", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT user_name, summary, created_at FROM audit_log ORDER BY id DESC LIMIT 30"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "erro ao ler atividade" });
  }
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

ensureSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`GMX roadmap backend rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Falha ao inicializar o schema do banco:", err);
    process.exit(1);
  });
