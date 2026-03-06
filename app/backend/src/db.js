import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const CURRENT_FILE_PATH = fileURLToPath(import.meta.url);
const BACKEND_ROOT = path.resolve(path.dirname(CURRENT_FILE_PATH), "..");
const DB_DIR = path.join(BACKEND_ROOT, "data");
const DB_FILE = path.join(DB_DIR, "store.db");
const LEGACY_DB_FILE = path.resolve(process.cwd(), "app", "backend", "data", "store.db");

function toSingleLine(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function deriveHeaderFromDescription(description) {
  const normalized = toSingleLine(description);
  if (!normalized) {
    return "Catalog item";
  }

  const firstSentence = normalized.split(/[.!?]/)[0].trim() || normalized;
  if (firstSentence.length <= 64) {
    return firstSentence;
  }

  return `${firstSentence.slice(0, 61).trimEnd()}...`;
}

function createCatalogItems() {
  return Array.from({ length: 20 }, (_, index) => ({
    public_id: randomUUID(),
    sku: `SKU-${String(index + 1).padStart(3, "0")}`,
    name: `Catalog Item ${index + 1}`,
    description: `This is catalog item ${index + 1}.`,
    header: deriveHeaderFromDescription(`This is catalog item ${index + 1}.`),
    price_cents: (index + 1) * 350
  }));
}

const seedUsers = [
  { email: "user@example.com", password: "CorrectHorseBatteryStaple1!", role: "customer" },
  { email: "shopper@example.com", password: "Password123!", role: "customer" },
  { email: "manager@example.com", password: "Password123!", role: "manager" },
  { email: "editor@example.com", password: "Password123!", role: "editor" },
  { email: "admin@example.com", password: "Password123!", role: "admin" }
];

export async function initDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  // One-time migration from an older cwd-dependent path.
  if (LEGACY_DB_FILE !== DB_FILE && fs.existsSync(LEGACY_DB_FILE) && !fs.existsSync(DB_FILE)) {
    fs.copyFileSync(LEGACY_DB_FILE, DB_FILE);
  }

  const db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS catalog_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      public_id TEXT UNIQUE,
      sku TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      header TEXT,
      description TEXT NOT NULL,
      price_cents INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total_cents INTEGER NOT NULL,
      payment_last4 TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      catalog_item_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price_cents INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (catalog_item_id) REFERENCES catalog_items(id)
    );
  `);

  const existingUsers = await db.get("SELECT COUNT(*) AS count FROM users");
  if (existingUsers.count === 0) {
    for (const user of seedUsers) {
      await db.run(
        "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
        user.email,
        user.password,
        user.role
      );
    }
  }

  const catalogColumns = await db.all("PRAGMA table_info(catalog_items)");
  const hasPublicId = catalogColumns.some((column) => column.name === "public_id");
  const hasHeader = catalogColumns.some((column) => column.name === "header");

  if (!hasPublicId) {
    await db.exec("ALTER TABLE catalog_items ADD COLUMN public_id TEXT");
  }

  if (!hasHeader) {
    await db.exec("ALTER TABLE catalog_items ADD COLUMN header TEXT");
  }

  await db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_catalog_items_public_id ON catalog_items(public_id)");

  const existingCatalog = await db.get("SELECT COUNT(*) AS count FROM catalog_items");
  if (existingCatalog.count === 0) {
    const items = createCatalogItems();
    for (const item of items) {
      await db.run(
        "INSERT INTO catalog_items (public_id, sku, name, header, description, price_cents) VALUES (?, ?, ?, ?, ?, ?)",
        item.public_id,
        item.sku,
        item.name,
        item.header,
        item.description,
        item.price_cents
      );
    }
  }

  const rowsNeedingBackfill = await db.all(
    "SELECT id, public_id, header, description FROM catalog_items WHERE public_id IS NULL OR TRIM(public_id) = '' OR header IS NULL OR TRIM(header) = ''"
  );

  for (const row of rowsNeedingBackfill) {
    const publicId = row.public_id && row.public_id.trim() ? row.public_id : randomUUID();
    const header = row.header && row.header.trim()
      ? row.header.trim()
      : deriveHeaderFromDescription(row.description);
    await db.run("UPDATE catalog_items SET public_id = ?, header = ? WHERE id = ?", publicId, header, row.id);
  }

  return db;
}
