import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const CURRENT_FILE_PATH = fileURLToPath(import.meta.url);
const BACKEND_ROOT = path.resolve(path.dirname(CURRENT_FILE_PATH), "..");
const DB_DIR = path.join(BACKEND_ROOT, "data");
const DB_FILE = path.join(DB_DIR, "store.db");
const LEGACY_DB_FILE = path.resolve(process.cwd(), "app", "backend", "data", "store.db");
const ROLE_TYPES = [
  { id: 1, name: "admin" },
  { id: 2, name: "manager" },
  { id: 3, name: "user" },
  { id: 4, name: "editor" }
];
const PASSWORD_HASH_ROUNDS = Number.parseInt(process.env.PASSWORD_HASH_ROUNDS || "10", 10);

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

function deriveDisplayNameFromEmail(email) {
  const localPart = String(email || "").split("@")[0] || "User";
  const cleaned = localPart
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim();
  if (!cleaned) {
    return "User";
  }
  return cleaned
    .split(/\s+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function stringFromCharCodes(codes) {
  return String.fromCharCode(...codes);
}

function looksHashedPassword(password) {
  return /^\$2[abxy]\$\d{2}\$/.test(String(password || ""));
}

async function addMissingColumns(db, tableName, columns) {
  const tableColumns = await db.all(`PRAGMA table_info(${tableName})`);
  const existingColumns = new Set(tableColumns.map((column) => column.name));
  for (const column of columns) {
    if (existingColumns.has(column.name)) {
      continue;
    }
    await db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${column.definition}`);
  }
}

const DEFAULT_PRIMARY_DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD
  || stringFromCharCodes([67, 111, 114, 114, 101, 99, 116, 72, 111, 114, 115, 101, 66, 97, 116, 116, 101, 114, 121, 83, 116, 97, 112, 108, 101, 49, 33]);
const DEFAULT_SECONDARY_DEMO_PASSWORD = process.env.DEMO_TEAM_PASSWORD
  || stringFromCharCodes([80, 97, 115, 115, 119, 111, 114, 100, 49, 50, 51, 33]);

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
  {
    email: "user@example.com",
    password: DEFAULT_PRIMARY_DEMO_PASSWORD,
    role: "user",
    street: "101 Market Street",
    city: "Austin",
    postalCode: "78701",
    country: "USA"
  },
  {
    email: "shopper@example.com",
    password: DEFAULT_SECONDARY_DEMO_PASSWORD,
    role: "user",
    street: "500 Shopper Lane",
    city: "Dallas",
    postalCode: "75201",
    country: "USA"
  },
  {
    email: "manager@example.com",
    password: DEFAULT_SECONDARY_DEMO_PASSWORD,
    role: "manager",
    street: "88 Team Plaza",
    city: "Chicago",
    postalCode: "60601",
    country: "USA"
  },
  {
    email: "editor@example.com",
    password: DEFAULT_SECONDARY_DEMO_PASSWORD,
    role: "editor",
    street: "42 Studio Road",
    city: "Seattle",
    postalCode: "98101",
    country: "USA"
  },
  {
    email: "admin@example.com",
    password: DEFAULT_SECONDARY_DEMO_PASSWORD,
    role: "admin",
    street: "1 Admin Square",
    city: "New York",
    postalCode: "10001",
    country: "USA"
  }
];

function deriveRoleIdFromUser(user) {
  const normalizedEmail = String(user.email || "").toLowerCase();
  const normalizedRole = String(user.role || "").toLowerCase();

  if (normalizedEmail.includes("admin") || normalizedRole === "admin") {
    return 1;
  }
  if (normalizedEmail.includes("manager") || normalizedRole === "manager") {
    return 2;
  }
  if (normalizedEmail.includes("editor") || normalizedRole === "editor") {
    return 4;
  }
  if (normalizedEmail.includes("user") || normalizedRole === "user" || normalizedRole === "customer") {
    return 3;
  }
  return 3;
}

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

    CREATE TABLE IF NOT EXISTS role_types (
      id INTEGER PRIMARY KEY,
      name TEXT UNIQUE NOT NULL CHECK(length(name) <= 15)
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
      public_order_id TEXT UNIQUE,
      user_id INTEGER NOT NULL,
      shipping_street TEXT,
      shipping_city TEXT,
      shipping_postal_code TEXT,
      shipping_country TEXT,
      payment_name_on_card TEXT,
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

  for (const roleType of ROLE_TYPES) {
    await db.run(
      "INSERT INTO role_types (id, name) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name",
      roleType.id,
      roleType.name
    );
  }

  await addMissingColumns(db, "users", [
    { name: "role_id", definition: "role_id INTEGER REFERENCES role_types(id)" },
    { name: "display_name", definition: "display_name TEXT" },
    { name: "street", definition: "street TEXT" },
    { name: "city", definition: "city TEXT" },
    { name: "postal_code", definition: "postal_code TEXT" },
    { name: "country", definition: "country TEXT" }
  ]);

  await addMissingColumns(db, "orders", [
    { name: "public_order_id", definition: "public_order_id TEXT" },
    { name: "shipping_street", definition: "shipping_street TEXT" },
    { name: "shipping_city", definition: "shipping_city TEXT" },
    { name: "shipping_postal_code", definition: "shipping_postal_code TEXT" },
    { name: "shipping_country", definition: "shipping_country TEXT" },
    { name: "payment_name_on_card", definition: "payment_name_on_card TEXT" }
  ]);

  await db.exec("CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id)");
  await db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_public_order_id ON orders(public_order_id)");

  const existingUsers = await db.get("SELECT COUNT(*) AS count FROM users");
  if (existingUsers.count === 0) {
    for (const user of seedUsers) {
      const hashedPassword = await bcrypt.hash(user.password, PASSWORD_HASH_ROUNDS);
      await db.run(
        "INSERT INTO users (email, password, role, role_id, display_name, street, city, postal_code, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        user.email,
        hashedPassword,
        user.role,
        deriveRoleIdFromUser(user),
        deriveDisplayNameFromEmail(user.email),
        user.street,
        user.city,
        user.postalCode,
        user.country
      );
    }
  }

  await db.exec(`
    UPDATE users
    SET role = 'user'
    WHERE lower(role) = 'customer'
  `);

  const usersNeedingDisplayName = await db.all(
    "SELECT id, email FROM users WHERE display_name IS NULL OR TRIM(display_name) = ''"
  );
  for (const user of usersNeedingDisplayName) {
    await db.run(
      "UPDATE users SET display_name = ? WHERE id = ?",
      deriveDisplayNameFromEmail(user.email),
      user.id
    );
  }

  const usersNeedingPasswordHashMigration = await db.all("SELECT id, password FROM users");
  for (const user of usersNeedingPasswordHashMigration) {
    if (looksHashedPassword(user.password)) {
      continue;
    }
    const hashedPassword = await bcrypt.hash(String(user.password || ""), PASSWORD_HASH_ROUNDS);
    await db.run("UPDATE users SET password = ? WHERE id = ?", hashedPassword, user.id);
  }

  await db.exec(`
    UPDATE users
    SET role_id = CASE
      WHEN lower(email) LIKE '%admin%' THEN 1
      WHEN lower(email) LIKE '%manager%' THEN 2
      WHEN lower(email) LIKE '%editor%' THEN 4
      WHEN lower(email) LIKE '%user%' THEN 3
      WHEN lower(role) = 'admin' THEN 1
      WHEN lower(role) = 'manager' THEN 2
      WHEN lower(role) = 'editor' THEN 4
      WHEN lower(role) = 'user' THEN 3
      ELSE 3
    END
  `);

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
