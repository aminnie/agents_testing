const BASE_URL = String(process.env.RATE_LIMIT_VERIFY_BASE_URL || "http://localhost:4000").replace(/\/$/, "");
const LOGIN_EMAIL = String(process.env.RATE_LIMIT_VERIFY_LOGIN_EMAIL || "user@example.com");
const LOGIN_PASSWORD = String(process.env.RATE_LIMIT_VERIFY_LOGIN_PASSWORD || "");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function postJson(path, payload, extraHeaders = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...extraHeaders
    },
    body: JSON.stringify(payload)
  });
  let body = {};
  try {
    body = await response.json();
  } catch {
    body = {};
  }
  return {
    status: response.status,
    body,
    headers: response.headers
  };
}

async function getJson(path, extraHeaders = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: extraHeaders
  });
  const body = await response.json();
  return {
    status: response.status,
    body
  };
}

async function verifyLoginThrottle() {
  assert(Boolean(LOGIN_PASSWORD), "RATE_LIMIT_VERIFY_LOGIN_PASSWORD is required for login throttle verification");
  const statuses = [];
  for (let index = 0; index < 6; index += 1) {
    const response = await postJson("/api/login", {
      email: LOGIN_EMAIL,
      password: LOGIN_PASSWORD
    });
    statuses.push(response.status);
  }

  assert(statuses.includes(429), "Expected login flow to eventually return 429");
  return statuses;
}

async function verifyRegisterThrottle() {
  const statuses = [];
  for (let index = 0; index < 4; index += 1) {
    const response = await postJson("/api/register", {
      displayName: "",
      email: "",
      password: "",
      street: "",
      city: "",
      postalCode: "",
      country: ""
    });
    statuses.push(response.status);
  }

  assert(statuses.includes(429), "Expected register flow to eventually return 429");
  return statuses;
}

async function verifyCheckoutThrottle() {
  assert(Boolean(LOGIN_PASSWORD), "RATE_LIMIT_VERIFY_LOGIN_PASSWORD is required for checkout throttle verification");
  const login = await postJson("/api/login", {
    email: LOGIN_EMAIL,
    password: LOGIN_PASSWORD
  });
  assert(login.status === 200, "Checkout verification login must succeed");
  const token = String(login.body?.token || "");
  assert(Boolean(token), "Checkout verification token missing");

  const catalog = await getJson("/api/catalog", {
    authorization: `Bearer ${token}`
  });
  assert(catalog.status === 200, "Catalog fetch for checkout verification failed");
  const itemId = String(catalog.body?.items?.[0]?.id || "");
  assert(Boolean(itemId), "Catalog item id missing for checkout verification");

  const checkoutPayload = {
    items: [{ id: itemId, quantity: 1 }],
    payment: {
      nameOnCard: "Rate Limit Verifier",
      cardNumber: "4111 1111 1111 1111"
    },
    address: {
      street: "101 Main Street",
      city: "Austin",
      postalCode: "78701",
      country: "USA"
    }
  };

  const statuses = [];
  for (let index = 0; index < 4; index += 1) {
    const response = await postJson("/api/checkout", checkoutPayload, {
      authorization: `Bearer ${token}`
    });
    statuses.push(response.status);
  }

  assert(statuses.includes(429), "Expected checkout flow to eventually return 429");
  return statuses;
}

async function main() {
  const checkoutStatuses = await verifyCheckoutThrottle();
  const registerStatuses = await verifyRegisterThrottle();
  const loginStatuses = await verifyLoginThrottle();

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        baseUrl: BASE_URL,
        loginStatuses,
        registerStatuses,
        checkoutStatuses
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(`Rate-limit verification failed: ${error.message}`);
  process.exitCode = 1;
});
