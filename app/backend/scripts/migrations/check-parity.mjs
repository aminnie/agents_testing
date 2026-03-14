import { openPostgresClient, openSqliteDb } from "./lib/clients.mjs";

const TABLES = [
  "role_types",
  "order_status_types",
  "users",
  "catalog_items",
  "orders",
  "order_items"
];

async function getSqliteCount(db, tableName) {
  const row = await db.get(`SELECT COUNT(*) AS count FROM ${tableName}`);
  return Number(row.count || 0);
}

async function getPostgresCount(client, tableName) {
  const result = await client.query(`SELECT COUNT(*)::int AS count FROM ${tableName}`);
  return Number(result.rows[0]?.count || 0);
}

async function getFkIntegrityViolations(client) {
  const queries = [
    {
      name: "orders.user_id -> users.id",
      sql: `
        SELECT COUNT(*)::int AS count
        FROM orders o
        LEFT JOIN users u ON u.id = o.user_id
        WHERE u.id IS NULL
      `
    },
    {
      name: "orders.order_status_type_id -> order_status_types.id",
      sql: `
        SELECT COUNT(*)::int AS count
        FROM orders o
        LEFT JOIN order_status_types os ON os.id = o.order_status_type_id
        WHERE o.order_status_type_id IS NOT NULL
          AND os.id IS NULL
      `
    },
    {
      name: "order_items.order_id -> orders.id",
      sql: `
        SELECT COUNT(*)::int AS count
        FROM order_items oi
        LEFT JOIN orders o ON o.id = oi.order_id
        WHERE o.id IS NULL
      `
    },
    {
      name: "order_items.catalog_item_id -> catalog_items.id",
      sql: `
        SELECT COUNT(*)::int AS count
        FROM order_items oi
        LEFT JOIN catalog_items ci ON ci.id = oi.catalog_item_id
        WHERE ci.id IS NULL
      `
    }
  ];

  const checks = [];
  for (const check of queries) {
    const result = await client.query(check.sql);
    checks.push({
      name: check.name,
      violations: Number(result.rows[0]?.count || 0)
    });
  }
  return checks;
}

async function main() {
  const sqlite = await openSqliteDb();
  const pgClient = await openPostgresClient();
  let hasFailures = false;

  try {
    console.log("Row-count parity results:");
    for (const table of TABLES) {
      const sqliteCount = await getSqliteCount(sqlite, table);
      const postgresCount = await getPostgresCount(pgClient, table);
      const match = sqliteCount === postgresCount;
      if (!match) {
        hasFailures = true;
      }

      console.log(
        JSON.stringify({
          table,
          sqliteCount,
          postgresCount,
          match
        })
      );
    }

    const fkChecks = await getFkIntegrityViolations(pgClient);
    console.log("Postgres relationship integrity results:");
    for (const check of fkChecks) {
      if (check.violations > 0) {
        hasFailures = true;
      }
      console.log(JSON.stringify(check));
    }

    if (hasFailures) {
      throw new Error("Parity validation failed. See mismatch and violation output above.");
    }

    console.log("Parity validation passed.");
  } finally {
    await sqlite.close();
    await pgClient.end();
  }
}

main().catch((error) => {
  console.error("Failed parity check:", error.message);
  process.exitCode = 1;
});
