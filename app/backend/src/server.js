import cors from "cors";
import express from "express";
import { randomBytes, randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
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

function isPrintableText(value) {
  return /^[\x20-\x7E]*$/.test(String(value || ""));
}

function parsePositiveIntegerQuery(value, fallbackValue) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallbackValue;
}

function normalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

function normalizeAddressField(value) {
  return normalizeText(value);
}

function validateAddressInput(rawAddress) {
  const address = {
    street: normalizeAddressField(rawAddress?.street),
    city: normalizeAddressField(rawAddress?.city),
    postalCode: normalizeAddressField(rawAddress?.postalCode),
    country: normalizeAddressField(rawAddress?.country)
  };
  const errors = {};

  if (!address.street) {
    errors.street = "Street is required";
  } else if (address.street.length > 50) {
    errors.street = "Street must be 50 characters or fewer";
  }

  if (!address.city) {
    errors.city = "City is required";
  } else if (address.city.length > 30) {
    errors.city = "City must be 30 characters or fewer";
  }

  if (!address.postalCode) {
    errors.postalCode = "Postal code is required";
  } else if (!/^[0-9-]{1,15}$/.test(address.postalCode)) {
    errors.postalCode = "Postal code must contain only digits and '-' and be 15 characters or fewer";
  }

  if (!address.country) {
    errors.country = "Country is required";
  } else if (address.country.length > 30) {
    errors.country = "Country must be 30 characters or fewer";
  }

  return {
    address,
    errors,
    hasErrors: Object.keys(errors).length > 0
  };
}

function mapUserPayload(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName || "",
    role: user.role || user.legacyRole || "user",
    roleId: user.roleId || 3,
    legacyRole: user.legacyRole,
    street: user.street || "",
    city: user.city || "",
    postalCode: user.postalCode || "",
    country: user.country || ""
  };
}

function firstValidationMessage(errors, fallbackMessage) {
  const firstError = Object.values(errors || {})[0];
  return String(firstError || fallbackMessage);
}

function createPublicOrderId(sequenceValue, timestamp = new Date()) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const year = String(date.getUTCFullYear());
  const sequence = String(Number(sequenceValue) || 0).padStart(5, "0");
  return `${month}${day}${year}-${sequence}`;
}

const ORDER_STATUS = Object.freeze({
  ORDERED: "Ordered",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled"
});

const CANCELLABLE_ORDER_STATUSES = new Set([ORDER_STATUS.ORDERED, ORDER_STATUS.PROCESSING]);
const ORDER_LIST_PAGE_SIZE_OPTIONS = Object.freeze([10, 20, 30, 40, 50]);
const DEFAULT_ORDER_LIST_PAGE_SIZE = 10;
const MAX_ORDER_LIST_QUERY_LENGTH = 60;
const MAX_CANCELLATION_REASON_LENGTH = 300;

function normalizeCancellationReason(value) {
  return String(value || "").trim();
}

function hasSupportedCancellationReasonCharacters(value) {
  return /^[\x09\x0A\x0D\x20-\x7E]*$/.test(String(value || ""));
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

async function getOrderStatusTypeId(statusName) {
  const row = await db.get(
    "SELECT id FROM order_status_types WHERE name = ? LIMIT 1",
    statusName
  );
  return row?.id || null;
}

async function requireAnyRole(req, res, next, allowedRoles) {
  const role = await getUserRole(req.userId);
  if (!role) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  if (!allowedRoles.includes(role)) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }
  next();
}

async function requireCatalogWriteAccess(req, res, next) {
  return requireAnyRole(req, res, next, ["editor", "manager"]);
}

async function requireCatalogProductManager(req, res, next) {
  return requireAnyRole(req, res, next, ["editor", "manager"]);
}

async function requireAdminAccess(req, res, next) {
  return requireAnyRole(req, res, next, ["admin"]);
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

app.get("/api/help", async (_req, res) => {
  try {
    res.json({
      navigationTips: [
        "Sign in to access your personalized store experience.",
        "Browse catalog items and view item details before adding to cart.",
        "Use checkout after adding at least one item to cart.",
        "Manager and editor users can create and edit products from header, catalog, and item detail pages.",
        "Admin users can manage user roles and profile details from the User admin page."
      ],
      apiNotes: [
        "POST /api/login authenticates using email and password.",
        "GET /api/catalog and checkout endpoints require a valid session token."
      ]
    });
  } catch {
    res.status(500).json({ message: "Unable to load help information" });
  }
});

app.post("/api/login", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "").trim();

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  const user = await db.get(
    `SELECT
      u.id,
      u.email,
      u.password,
      u.display_name AS displayName,
      u.street AS street,
      u.city AS city,
      u.postal_code AS postalCode,
      u.country AS country,
      u.role AS legacyRole,
      u.role_id AS roleId,
      rt.name AS role
    FROM users u
    LEFT JOIN role_types rt ON rt.id = u.role_id
    WHERE lower(u.email) = ?`,
    email
  );

  if (!user) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const isPasswordValid = await bcrypt.compare(password, String(user.password || ""));
  if (!isPasswordValid) {
    res.status(401).json({ message: "Invalid email or password" });
    return;
  }

  const token = createToken();
  tokens.set(token, user.id);

  res.json({
    token,
    user: mapUserPayload(user)
  });
});

app.post("/api/register", async (req, res) => {
  const displayName = normalizeText(req.body?.displayName);
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "").trim();
  const { address, errors: addressErrors, hasErrors: hasAddressErrors } = validateAddressInput(req.body);

  if (!displayName || !email || !password || hasAddressErrors) {
    const errors = {};
    if (!displayName) {
      errors.displayName = "Display name is required";
    }
    if (!email) {
      errors.email = "Email is required";
    }
    if (!password) {
      errors.password = "Password is required";
    }
    Object.assign(errors, addressErrors);
    res.status(400).json({
      message: firstValidationMessage(errors, "Registration input is invalid"),
      errors
    });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ message: "Password must be at least 8 characters" });
    return;
  }

  const existingUser = await db.get("SELECT id FROM users WHERE lower(email) = ?", email);
  if (existingUser) {
    res.status(409).json({ message: "An account with that email already exists" });
    return;
  }

  let result;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    result = await db.run(
      "INSERT INTO users (email, password, role, role_id, display_name, street, city, postal_code, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      email,
      hashedPassword,
      "user",
      3,
      displayName,
      address.street,
      address.city,
      address.postalCode,
      address.country
    );
  } catch (error) {
    if (String(error?.message || "").includes("UNIQUE constraint failed: users.email")) {
      res.status(409).json({ message: "An account with that email already exists" });
      return;
    }
    res.status(500).json({ message: "Unable to register user" });
    return;
  }

  const token = createToken();
  tokens.set(token, result.lastID);

  res.status(201).json({
    token,
    user: {
      id: result.lastID,
      email,
      displayName,
      role: "user",
      roleId: 3,
      legacyRole: "user",
      street: address.street,
      city: address.city,
      postalCode: address.postalCode,
      country: address.country
    }
  });
});

app.get("/api/admin/roles", authMiddleware, requireAdminAccess, async (_req, res) => {
  const roles = await db.all("SELECT id, name FROM role_types ORDER BY id");
  res.json({ roles });
});

app.get("/api/admin/users", authMiddleware, requireAdminAccess, async (_req, res) => {
  const users = await db.all(
    `SELECT
      u.id,
      u.email,
      u.display_name AS displayName,
      u.street AS street,
      u.city AS city,
      u.postal_code AS postalCode,
      u.country AS country,
      u.role AS legacyRole,
      u.role_id AS roleId,
      rt.name AS role
    FROM users u
    LEFT JOIN role_types rt ON rt.id = u.role_id
    ORDER BY u.id`
  );
  res.json({
    users: users.map((user) => mapUserPayload(user))
  });
});

app.get("/api/admin/users/:id", authMiddleware, requireAdminAccess, async (req, res) => {
  const userId = Number.parseInt(String(req.params.id || ""), 10);
  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(400).json({ message: "Invalid user id" });
    return;
  }

  const user = await db.get(
    `SELECT
      u.id,
      u.email,
      u.display_name AS displayName,
      u.street AS street,
      u.city AS city,
      u.postal_code AS postalCode,
      u.country AS country,
      u.role AS legacyRole,
      u.role_id AS roleId,
      rt.name AS role
    FROM users u
    LEFT JOIN role_types rt ON rt.id = u.role_id
    WHERE u.id = ?`,
    userId
  );
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  res.json({
    user: mapUserPayload(user)
  });
});

app.put("/api/admin/users/:id", authMiddleware, requireAdminAccess, async (req, res) => {
  const userId = Number.parseInt(String(req.params.id || ""), 10);
  const email = normalizeEmail(req.body?.email);
  const displayName = normalizeText(req.body?.displayName);
  const roleId = Number.parseInt(String(req.body?.roleId ?? ""), 10);
  const { address, errors: addressErrors, hasErrors: hasAddressErrors } = validateAddressInput(req.body);

  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(400).json({ message: "Invalid user id" });
    return;
  }
  if (!email || !isValidEmail(email)) {
    res.status(400).json({ message: "A valid email is required" });
    return;
  }
  if (!displayName) {
    res.status(400).json({ message: "Display name is required" });
    return;
  }
  if (!Number.isInteger(roleId) || roleId <= 0) {
    res.status(400).json({ message: "A valid roleId is required" });
    return;
  }
  if (hasAddressErrors) {
    res.status(400).json({
      message: firstValidationMessage(addressErrors, "Address input is invalid"),
      errors: addressErrors
    });
    return;
  }

  const existingUser = await db.get(
    `SELECT
      u.id,
      u.email,
      u.display_name AS displayName,
      COALESCE(rt.name, u.role, 'user') AS role
    FROM users u
    LEFT JOIN role_types rt ON rt.id = u.role_id
    WHERE u.id = ?`,
    userId
  );
  if (!existingUser) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const selectedRole = await db.get("SELECT id, name FROM role_types WHERE id = ?", roleId);
  if (!selectedRole) {
    res.status(400).json({ message: "Selected role is invalid" });
    return;
  }

  const duplicateEmailUser = await db.get("SELECT id FROM users WHERE lower(email) = ? AND id <> ?", email, userId);
  if (duplicateEmailUser) {
    res.status(409).json({ message: "An account with that email already exists" });
    return;
  }

  if (existingUser.role === "admin" && selectedRole.name !== "admin") {
    const adminCountRow = await db.get(
      `SELECT COUNT(*) AS count
      FROM users u
      LEFT JOIN role_types rt ON rt.id = u.role_id
      WHERE COALESCE(rt.name, u.role, 'user') = 'admin'`
    );
    if ((adminCountRow?.count || 0) <= 1) {
      res.status(409).json({ message: "Cannot remove the last remaining admin user" });
      return;
    }
  }

  await db.run(
    "UPDATE users SET email = ?, display_name = ?, role_id = ?, role = ?, street = ?, city = ?, postal_code = ?, country = ? WHERE id = ?",
    email,
    displayName,
    selectedRole.id,
    selectedRole.name,
    address.street,
    address.city,
    address.postalCode,
    address.country,
    userId
  );

  res.json({
    user: {
      id: userId,
      email,
      displayName,
      role: selectedRole.name,
      roleId: selectedRole.id,
      street: address.street,
      city: address.city,
      postalCode: address.postalCode,
      country: address.country
    }
  });
});

app.get("/api/catalog", authMiddleware, async (req, res) => {
  const rawSearchQuery = String(req.query?.q || "").trim();
  if (rawSearchQuery.length > 20) {
    res.status(400).json({ message: "Search query must be 20 characters or fewer" });
    return;
  }
  if (!isPrintableText(rawSearchQuery)) {
    res.status(400).json({ message: "Search query contains unsupported characters" });
    return;
  }

  const normalizedQuery = rawSearchQuery.toLowerCase();
  const hasSearchQuery = normalizedQuery.length > 0;
  const items = hasSearchQuery
    ? await db.all(
      `SELECT id, public_id AS publicId, sku, name, header, description, price_cents AS priceCents
       FROM catalog_items
       WHERE lower(name) LIKE ?
          OR lower(header) LIKE ?
          OR lower(description) LIKE ?
       ORDER BY id`,
      `%${normalizedQuery}%`,
      `%${normalizedQuery}%`,
      `%${normalizedQuery}%`
    )
    : await db.all(
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

app.put("/api/catalog/:id", authMiddleware, requireCatalogProductManager, async (req, res) => {
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
  const { items, payment, address: submittedAddress } = req.body;
  const { address, errors: addressErrors, hasErrors: hasAddressErrors } = validateAddressInput(submittedAddress);
  const normalizedCardNumber = String(payment?.cardNumber || "").replace(/\D/g, "");
  const nameOnCard = normalizeText(payment?.nameOnCard);

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ message: "Cart cannot be empty" });
    return;
  }

  if (!nameOnCard || normalizedCardNumber.length <= 4) {
    res.status(400).json({ message: "Payment details are required" });
    return;
  }
  if (hasAddressErrors) {
    res.status(400).json({
      message: firstValidationMessage(addressErrors, "Address input is invalid"),
      errors: addressErrors
    });
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

  const paymentLast4 = normalizedCardNumber.slice(-4);
  const createdAt = new Date().toISOString();
  const orderedStatusTypeId = await getOrderStatusTypeId(ORDER_STATUS.ORDERED);
  if (!orderedStatusTypeId) {
    res.status(500).json({ message: "Checkout failed" });
    return;
  }
  let publicOrderId = "";
  try {
    await db.run("BEGIN TRANSACTION");
    const result = await db.run(
      `INSERT INTO orders (
        public_order_id,
        user_id,
        shipping_street,
        shipping_city,
        shipping_postal_code,
        shipping_country,
        payment_name_on_card,
        order_status_type_id,
        total_cents,
        payment_last4,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      null,
      req.userId,
      address.street,
      address.city,
      address.postalCode,
      address.country,
      nameOnCard,
      orderedStatusTypeId,
      totalCents,
      paymentLast4,
      createdAt
    );
    publicOrderId = createPublicOrderId(result.lastID, createdAt);
    await db.run(
      "UPDATE orders SET public_order_id = ? WHERE id = ?",
      publicOrderId,
      result.lastID
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
    await db.run(
      "UPDATE users SET street = ?, city = ?, postal_code = ?, country = ? WHERE id = ?",
      address.street,
      address.city,
      address.postalCode,
      address.country,
      req.userId
    );
    await db.run("COMMIT");
  } catch (error) {
    try {
      await db.run("ROLLBACK");
    } catch {
      // Ignore rollback failures and report the original checkout failure.
    }
    res.status(500).json({ message: "Checkout failed" });
    return;
  }

  res.status(201).json({
    orderId: publicOrderId,
    totalCents,
    paymentLast4,
    user: {
      id: req.userId,
      street: address.street,
      city: address.city,
      postalCode: address.postalCode,
      country: address.country
    }
  });
});

app.get("/api/orders", authMiddleware, async (req, res) => {
  const rawSearchQuery = String(req.query?.q || "").trim();
  if (rawSearchQuery.length > MAX_ORDER_LIST_QUERY_LENGTH) {
    res.status(400).json({ message: `Search query must be ${MAX_ORDER_LIST_QUERY_LENGTH} characters or fewer` });
    return;
  }
  if (!isPrintableText(rawSearchQuery)) {
    res.status(400).json({ message: "Search query contains unsupported characters" });
    return;
  }

  const requestedPageSize = parsePositiveIntegerQuery(req.query?.pageSize, DEFAULT_ORDER_LIST_PAGE_SIZE);
  if (!ORDER_LIST_PAGE_SIZE_OPTIONS.includes(requestedPageSize)) {
    res.status(400).json({
      message: `pageSize must be one of: ${ORDER_LIST_PAGE_SIZE_OPTIONS.join(", ")}`
    });
    return;
  }

  const requestedPage = parsePositiveIntegerQuery(req.query?.page, 1);
  const normalizedQuery = rawSearchQuery.toLowerCase();
  const hasSearchQuery = normalizedQuery.length > 0;

  const countQuery = hasSearchQuery
    ? `SELECT COUNT(DISTINCT o.id) AS totalItems
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN catalog_items ci ON ci.id = oi.catalog_item_id
       WHERE o.user_id = ?
         AND (
           lower(COALESCE(o.public_order_id, '')) LIKE ?
           OR lower(COALESCE(ci.header, ci.name, '')) LIKE ?
           OR lower(COALESCE(ci.name, ci.header, '')) LIKE ?
           OR lower(COALESCE(ci.description, '')) LIKE ?
         )`
    : `SELECT COUNT(*) AS totalItems
       FROM orders o
       WHERE o.user_id = ?`;

  const likeQuery = `%${normalizedQuery}%`;
  const countRow = hasSearchQuery
    ? await db.get(countQuery, req.userId, likeQuery, likeQuery, likeQuery, likeQuery)
    : await db.get(countQuery, req.userId);
  const totalItems = Number(countRow?.totalItems || 0);
  const totalPages = Math.max(1, Math.ceil(totalItems / requestedPageSize));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * requestedPageSize;

  const rows = hasSearchQuery
    ? await db.all(
      `WITH filtered_orders AS (
        SELECT DISTINCT o.id
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        LEFT JOIN catalog_items ci ON ci.id = oi.catalog_item_id
        WHERE o.user_id = ?
          AND (
            lower(COALESCE(o.public_order_id, '')) LIKE ?
            OR lower(COALESCE(ci.header, ci.name, '')) LIKE ?
            OR lower(COALESCE(ci.name, ci.header, '')) LIKE ?
            OR lower(COALESCE(ci.description, '')) LIKE ?
          )
      )
      SELECT
        o.id,
        o.public_order_id AS publicOrderId,
        o.total_cents AS totalCents,
        o.created_at AS createdAt,
        COALESCE(ost.name, 'Ordered') AS status
      FROM orders o
      INNER JOIN filtered_orders fo ON fo.id = o.id
      LEFT JOIN order_status_types ost ON ost.id = o.order_status_type_id
      ORDER BY o.created_at DESC, o.id DESC
      LIMIT ? OFFSET ?`,
      req.userId,
      likeQuery,
      likeQuery,
      likeQuery,
      likeQuery,
      requestedPageSize,
      offset
    )
    : await db.all(
      `SELECT
        o.id,
        o.public_order_id AS publicOrderId,
        o.total_cents AS totalCents,
        o.created_at AS createdAt,
        COALESCE(ost.name, 'Ordered') AS status
      FROM orders o
      LEFT JOIN order_status_types ost ON ost.id = o.order_status_type_id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC, o.id DESC
      LIMIT ? OFFSET ?`,
      req.userId,
      requestedPageSize,
      offset
    );

  res.json({
    orders: rows.map((row) => ({
      orderId: row.publicOrderId || createPublicOrderId(row.id, row.createdAt),
      createdAt: row.createdAt,
      totalCents: row.totalCents,
      status: row.status
    })),
    pagination: {
      page,
      pageSize: requestedPageSize,
      totalItems,
      totalPages
    },
    filters: {
      query: rawSearchQuery
    }
  });
});

app.patch("/api/orders/:orderId/status", authMiddleware, async (req, res) => {
  const requestedOrderId = String(req.params.orderId || "").trim();
  const requestedStatus = normalizeText(req.body?.status);
  const normalizedReason = normalizeCancellationReason(req.body?.reason);

  if (!requestedOrderId) {
    res.status(404).json({ message: "Order not found" });
    return;
  }
  if (requestedStatus !== ORDER_STATUS.CANCELLED) {
    res.status(400).json({ message: "Only status Cancelled is supported" });
    return;
  }
  if (!normalizedReason) {
    res.status(400).json({ message: "Cancellation reason is required" });
    return;
  }
  if (normalizedReason.length > MAX_CANCELLATION_REASON_LENGTH) {
    res.status(400).json({
      message: `Cancellation reason must be ${MAX_CANCELLATION_REASON_LENGTH} characters or fewer`
    });
    return;
  }
  if (!hasSupportedCancellationReasonCharacters(normalizedReason)) {
    res.status(400).json({ message: "Cancellation reason contains unsupported characters" });
    return;
  }

  const byPublicId = await db.get(
    `SELECT
      o.id,
      o.public_order_id AS publicOrderId,
      o.created_at AS createdAt,
      COALESCE(ost.name, 'Ordered') AS status
    FROM orders o
    LEFT JOIN order_status_types ost ON ost.id = o.order_status_type_id
    WHERE o.user_id = ? AND o.public_order_id = ?
    LIMIT 1`,
    req.userId,
    requestedOrderId
  );

  let order = byPublicId;
  if (!order) {
    const legacyRows = await db.all(
      `SELECT
        o.id,
        o.public_order_id AS publicOrderId,
        o.created_at AS createdAt,
        COALESCE(ost.name, 'Ordered') AS status
      FROM orders o
      LEFT JOIN order_status_types ost ON ost.id = o.order_status_type_id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC, o.id DESC`,
      req.userId
    );
    order = legacyRows.find((row) => createPublicOrderId(row.id, row.createdAt) === requestedOrderId);
  }

  if (!order) {
    res.status(404).json({ message: "Order not found" });
    return;
  }

  if (!CANCELLABLE_ORDER_STATUSES.has(order.status)) {
    res.status(400).json({ message: "Order cannot be cancelled from current status" });
    return;
  }

  const cancelledStatusTypeId = await getOrderStatusTypeId(ORDER_STATUS.CANCELLED);
  if (!cancelledStatusTypeId) {
    res.status(500).json({ message: "Order cancellation failed" });
    return;
  }

  await db.run(
    "UPDATE orders SET order_status_type_id = ?, cancellation_reason = ? WHERE id = ?",
    cancelledStatusTypeId,
    normalizedReason,
    order.id
  );

  res.json({
    order: {
      orderId: order.publicOrderId || createPublicOrderId(order.id, order.createdAt),
      status: ORDER_STATUS.CANCELLED,
      cancellationReason: normalizedReason
    }
  });
});

app.get("/api/orders/:orderId", authMiddleware, async (req, res) => {
  const requestedOrderId = String(req.params.orderId || "").trim();
  if (!requestedOrderId) {
    res.status(404).json({ message: "Order not found" });
    return;
  }

  const byPublicId = await db.get(
    `SELECT
      o.id,
      o.public_order_id AS publicOrderId,
      o.created_at AS createdAt,
      o.total_cents AS totalCents,
      o.shipping_street AS shippingStreet,
      o.shipping_city AS shippingCity,
      o.shipping_postal_code AS shippingPostalCode,
      o.shipping_country AS shippingCountry,
      o.payment_name_on_card AS paymentNameOnCard,
      o.payment_last4 AS paymentLast4,
      o.cancellation_reason AS cancellationReason,
      COALESCE(ost.name, 'Ordered') AS status
    FROM orders o
    LEFT JOIN order_status_types ost ON ost.id = o.order_status_type_id
    WHERE o.user_id = ? AND o.public_order_id = ?
    LIMIT 1`,
    req.userId,
    requestedOrderId
  );

  let order = byPublicId;
  if (!order) {
    const legacyRows = await db.all(
      `SELECT
        o.id,
        o.public_order_id AS publicOrderId,
        o.created_at AS createdAt,
        o.total_cents AS totalCents,
        o.shipping_street AS shippingStreet,
        o.shipping_city AS shippingCity,
        o.shipping_postal_code AS shippingPostalCode,
        o.shipping_country AS shippingCountry,
        o.payment_name_on_card AS paymentNameOnCard,
        o.payment_last4 AS paymentLast4,
        o.cancellation_reason AS cancellationReason,
        COALESCE(ost.name, 'Ordered') AS status
      FROM orders o
      LEFT JOIN order_status_types ost ON ost.id = o.order_status_type_id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC, o.id DESC`,
      req.userId
    );
    order = legacyRows.find((row) => createPublicOrderId(row.id, row.createdAt) === requestedOrderId);
  }

  if (!order) {
    res.status(404).json({ message: "Order not found" });
    return;
  }

  const itemRows = await db.all(
    `SELECT
      oi.catalog_item_id AS catalogItemId,
      oi.quantity AS quantity,
      oi.unit_price_cents AS unitPriceCents,
      ci.public_id AS publicItemId,
      COALESCE(ci.header, ci.name, 'Catalog item') AS itemName
    FROM order_items oi
    LEFT JOIN catalog_items ci ON ci.id = oi.catalog_item_id
    WHERE oi.order_id = ?
    ORDER BY oi.id`,
    order.id
  );

  res.json({
    order: {
      orderId: order.publicOrderId || createPublicOrderId(order.id, order.createdAt),
      createdAt: order.createdAt,
      totalCents: order.totalCents,
      status: order.status,
      shipping: {
        street: order.shippingStreet || "",
        city: order.shippingCity || "",
        postalCode: order.shippingPostalCode || "",
        country: order.shippingCountry || ""
      },
      paymentSummary: {
        nameOnCard: order.paymentNameOnCard || "",
        last4: order.paymentLast4 || ""
      },
      cancellationReason: order.cancellationReason || ""
    },
    items: itemRows.map((item) => ({
      itemId: item.publicItemId || String(item.catalogItemId || ""),
      headerOrName: item.itemName || "Catalog item",
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: item.quantity * item.unitPriceCents
    }))
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
