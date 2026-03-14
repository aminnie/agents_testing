import {
  openPostgresClient,
  openSqliteDb,
  parseTimestampOrThrow,
  getSqliteDbPath
} from "./lib/clients.mjs";

function quoteIdent(identifier) {
  return `"${String(identifier).replaceAll("\"", "\"\"")}"`;
}

async function copyRows(sqlite, pgClient, tableName, columns, mapRow = (row) => row) {
  const rows = await sqlite.all(`SELECT ${columns.join(", ")} FROM ${tableName} ORDER BY id ASC`);
  if (rows.length === 0) {
    return 0;
  }

  const escapedColumns = columns.map((column) => quoteIdent(column)).join(", ");
  const valuePlaceholders = columns.map((_, index) => `$${index + 1}`).join(", ");
  const statement = `INSERT INTO ${tableName} (${escapedColumns}) VALUES (${valuePlaceholders})`;

  for (const row of rows) {
    const mapped = mapRow(row);
    const values = columns.map((column) => mapped[column] ?? null);
    await pgClient.query(statement, values);
  }
  return rows.length;
}

async function main() {
  const sqlite = await openSqliteDb();
  const pgClient = await openPostgresClient();
  const counts = {};

  try {
    await pgClient.query("BEGIN");

    await pgClient.query(`
      TRUNCATE TABLE
        order_items,
        orders,
        catalog_items,
        users,
        order_status_types,
        role_types
      RESTART IDENTITY CASCADE
    `);

    counts.role_types = await copyRows(sqlite, pgClient, "role_types", ["id", "name"]);
    counts.order_status_types = await copyRows(sqlite, pgClient, "order_status_types", ["id", "name"]);
    counts.users = await copyRows(
      sqlite,
      pgClient,
      "users",
      ["id", "email", "password", "role", "role_id", "display_name", "street", "city", "postal_code", "country"]
    );
    counts.catalog_items = await copyRows(
      sqlite,
      pgClient,
      "catalog_items",
      ["id", "public_id", "sku", "name", "header", "description", "price_cents"]
    );
    counts.orders = await copyRows(
      sqlite,
      pgClient,
      "orders",
      [
        "id",
        "public_order_id",
        "user_id",
        "shipping_street",
        "shipping_city",
        "shipping_postal_code",
        "shipping_country",
        "payment_name_on_card",
        "total_cents",
        "payment_last4",
        "created_at",
        "order_status_type_id",
        "cancellation_reason"
      ],
      (row) => ({
        ...row,
        created_at: parseTimestampOrThrow(row.created_at, `orders.id=${row.id}`)
      })
    );
    counts.order_items = await copyRows(
      sqlite,
      pgClient,
      "order_items",
      ["id", "order_id", "catalog_item_id", "quantity", "unit_price_cents"]
    );

    await pgClient.query("COMMIT");
    console.log("SQLite -> Postgres rehearsal completed.");
    console.log(`SQLite source: ${getSqliteDbPath()}`);
    console.log(JSON.stringify(counts, null, 2));
  } catch (error) {
    await pgClient.query("ROLLBACK");
    throw error;
  } finally {
    await sqlite.close();
    await pgClient.end();
  }
}

main().catch((error) => {
  console.error("Failed SQLite -> Postgres rehearsal:", error.message);
  process.exitCode = 1;
});
