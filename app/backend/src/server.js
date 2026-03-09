import cors from "cors";
import express from "express";
import { randomBytes, randomUUID } from "node:crypto";
import { initDb } from "./db.js";

const app = express();
const port = Number(process.env.PORT || 4000);

app.disable("x-powered-by");
app.use(cors());
app.use(express.json());

const tokens = new Map();
let db;

function createToken() {
  return randomBytes(32).toString("hex");
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function deriveHeaderFromDescription(description) {
  const normalized = normalizeText(description);
  if (!normalized) {
    return "Catalog item";
  }

  const firstSentence = normalized.split(/[.!?]/)[0].trim() || normalized;
  if (firstSentence.length <= 64) {
    return firstSentence;
  }

  return `${firstSentence.slice(0, 61).trimEnd()}...`;
}

async function getUserRole(userId) {
  const user = await db.get(
    `SELECT
      u.role AS legacyRole,
      u.role_id AS roleId,
      rt.name AS role
    FROM users u
    LEFT JOIN role_types rt ON rt.id = u.role_id
    WHERE u.id = ?`,
    userId
  );
  if (!user) {
    return null;
  }
  return user.role || user.legacyRole || "user";
}

async function requireCatalogWriteAccess(req, res, next) {
  const role = await getUserRole(req.userId);
  if (!role) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  if (!["editor", "manager", "admin"].includes(role)) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }
  next();
}

async function requireCatalogEditor(req, res, next) {
  const role = await getUserRole(req.userId);
  if (!role) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  if (role !== "editor") {
    res.status(403).json({ message: "Forbidden" });
    return;
  }
  next();
}

function mapCatalogItem(row) {
  const header = row.header || row.name;
  return {
    id: row.publicId || String(row.id),
    header,
    name: header,
    description: row.description,
    priceCents: row.priceCents
  };
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  const userId = tokens.get(token);

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  req.userId = userId;
  next();
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  const user = await db.get(
    `SELECT
      u.id,
      u.email,
      u.role AS legacyRole,
      u.role_id AS roleId,
      rt.name AS role
    FROM users u
    LEFT JOIN role_types rt ON rt.id = u.role_id
    WHERE u.email = ? AND u.password = ?`,
    email,
    password
  );

  if (!user) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const token = createToken();
  tokens.set(token, user.id);

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role || user.legacyRole || "user",
      roleId: user.roleId || 3,
      legacyRole: user.legacyRole
    }
  });
});

app.get("/api/catalog", authMiddleware, async (_req, res) => {
  const items = await db.all(
    "SELECT id, public_id AS publicId, sku, name, header, description, price_cents AS priceCents FROM catalog_items ORDER BY id"
  );
  res.json({ items: items.map(mapCatalogItem) });
});

app.get("/api/catalog/:id", authMiddleware, async (req, res) => {
  const item = await db.get(
    "SELECT id, public_id AS publicId, sku, name, header, description, price_cents AS priceCents FROM catalog_items WHERE public_id = ?",
    req.params.id
  );

  if (!item) {
    res.status(404).json({ message: "Catalog item not found" });
    return;
  }

  res.json({ item: mapCatalogItem(item) });
});

app.post("/api/catalog", authMiddleware, requireCatalogWriteAccess, async (req, res) => {
  const header = normalizeText(req.body?.header);
  const description = normalizeText(req.body?.description);
  const priceCents = Number(req.body?.priceCents);

  if (!description) {
    res.status(400).json({ message: "Item description is required" });
    return;
  }

  if (!Number.isInteger(priceCents) || priceCents <= 0) {
    res.status(400).json({ message: "priceCents must be a positive integer" });
    return;
  }

  const publicId = randomUUID();
  const resolvedHeader = header || deriveHeaderFromDescription(description);
  const sku = `SKU-${publicId.slice(0, 8).toUpperCase()}`;

  const result = await db.run(
    "INSERT INTO catalog_items (public_id, sku, name, header, description, price_cents) VALUES (?, ?, ?, ?, ?, ?)",
    publicId,
    sku,
    resolvedHeader,
    resolvedHeader,
    description,
    priceCents
  );

  res.status(201).json({
    item: {
      id: publicId,
      header: resolvedHeader,
      name: resolvedHeader,
      description,
      priceCents,
      internalId: result.lastID
    }
  });
});

app.put("/api/catalog/:id", authMiddleware, requireCatalogEditor, async (req, res) => {
  const header = normalizeText(req.body?.header);
  const description = normalizeText(req.body?.description);
  const priceCents = Number(req.body?.priceCents);

  if (!header) {
    res.status(400).json({ message: "Item header is required" });
    return;
  }

  if (!description) {
    res.status(400).json({ message: "Item description is required" });
    return;
  }

  if (!Number.isInteger(priceCents) || priceCents <= 0) {
    res.status(400).json({ message: "priceCents must be a positive integer" });
    return;
  }

  const existingItem = await db.get(
    "SELECT id FROM catalog_items WHERE public_id = ?",
    req.params.id
  );
  if (!existingItem) {
    res.status(404).json({ message: "Catalog item not found" });
    return;
  }

  await db.run(
    "UPDATE catalog_items SET name = ?, header = ?, description = ?, price_cents = ? WHERE public_id = ?",
    header,
    header,
    description,
    priceCents,
    req.params.id
  );

  res.json({
    item: {
      id: req.params.id,
      header,
      name: header,
      description,
      priceCents
    }
  });
});

app.post("/api/checkout", authMiddleware, async (req, res) => {
  const { items, payment } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ message: "Cart cannot be empty" });
    return;
  }

  if (!payment?.cardNumber || !payment?.nameOnCard) {
    res.status(400).json({ message: "Payment details are required" });
    return;
  }

  const normalizedItems = [];
  for (const item of items) {
    const itemId = String(item.id ?? "").trim();
    if (!itemId) {
      res.status(400).json({ message: "Invalid catalog item id" });
      return;
    }

    const catalogItem = await db.get(
      "SELECT id, price_cents AS priceCents FROM catalog_items WHERE public_id = ? OR CAST(id AS TEXT) = ?",
      itemId,
      itemId
    );

    if (!catalogItem) {
      res.status(400).json({ message: `Invalid catalog item id ${itemId}` });
      return;
    }

    const quantity = Number(item.quantity || 1);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      res.status(400).json({ message: `Invalid quantity for item id ${itemId}` });
      return;
    }

    normalizedItems.push({
      catalogItemId: catalogItem.id,
      quantity,
      unitPriceCents: catalogItem.priceCents
    });
  }

  const totalCents = normalizedItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceCents,
    0
  );

  const paymentLast4 = String(payment.cardNumber).slice(-4);
  const createdAt = new Date().toISOString();

  const result = await db.run(
    "INSERT INTO orders (user_id, total_cents, payment_last4, created_at) VALUES (?, ?, ?, ?)",
    req.userId,
    totalCents,
    paymentLast4,
    createdAt
  );

  for (const item of normalizedItems) {
    await db.run(
      "INSERT INTO order_items (order_id, catalog_item_id, quantity, unit_price_cents) VALUES (?, ?, ?, ?)",
      result.lastID,
      item.catalogItemId,
      item.quantity,
      item.unitPriceCents
    );
  }

  res.status(201).json({
    orderId: result.lastID,
    totalCents,
    paymentLast4
  });
});

initDb()
  .then((database) => {
    db = database;
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`Backend running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error("Failed to initialize database", error);
    process.exit(1);
  });
