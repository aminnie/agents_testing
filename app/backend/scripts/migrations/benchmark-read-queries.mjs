import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openPostgresClient, openSqliteDb } from "./lib/clients.mjs";

const CURRENT_FILE_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(CURRENT_FILE_PATH), "..", "..", "..", "..");
const REPORTS_DIR = path.join(REPO_ROOT, "reports", "migration");
const REPORT_FILE = path.join(REPORTS_DIR, "performance-baseline.json");

const BENCHMARK_QUERIES = [
  {
    id: "orders_count",
    sqliteSql: "SELECT COUNT(*) AS count FROM orders",
    postgresSql: "SELECT COUNT(*)::int AS count FROM orders"
  },
  {
    id: "orders_with_items_page",
    sqliteSql: `
      SELECT o.id, o.public_order_id, o.created_at, COUNT(oi.id) AS item_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id
      ORDER BY o.created_at DESC, o.id DESC
      LIMIT 10 OFFSET 0
    `,
    postgresSql: `
      SELECT o.id, o.public_order_id, o.created_at, COUNT(oi.id) AS item_count
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id
      ORDER BY o.created_at DESC, o.id DESC
      LIMIT 10 OFFSET 0
    `
  }
];

async function timedSqliteQuery(db, sql) {
  const started = process.hrtime.bigint();
  await db.all(sql);
  const ended = process.hrtime.bigint();
  return Number(ended - started) / 1_000_000;
}

async function timedPostgresQuery(client, sql) {
  const started = process.hrtime.bigint();
  await client.query(sql);
  const ended = process.hrtime.bigint();
  return Number(ended - started) / 1_000_000;
}

async function main() {
  const sqlite = await openSqliteDb();
  const pgClient = await openPostgresClient();
  const results = [];

  try {
    for (const query of BENCHMARK_QUERIES) {
      const sqliteMs = await timedSqliteQuery(sqlite, query.sqliteSql);
      const postgresMs = await timedPostgresQuery(pgClient, query.postgresSql);
      results.push({
        id: query.id,
        sqliteMs: Number(sqliteMs.toFixed(3)),
        postgresMs: Number(postgresMs.toFixed(3))
      });
    }
  } finally {
    await sqlite.close();
    await pgClient.end();
  }

  const report = {
    generatedAt: new Date().toISOString(),
    measurements: results
  };

  await fs.mkdir(REPORTS_DIR, { recursive: true });
  await fs.writeFile(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`Performance baseline written to ${REPORT_FILE}`);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error("Failed benchmark run:", error.message);
  process.exitCode = 1;
});
