import fs from "node:fs/promises";

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getAuthHeaders(options = {}) {
  const includeJsonContentType = options.includeJsonContentType ?? true;
  const email = getRequiredEnv("JIRA_EMAIL");
  const token = getRequiredEnv("JIRA_API_TOKEN");
  const encoded = Buffer.from(`${email}:${token}`).toString("base64");
  const headers = {
    Accept: "application/json",
    Authorization: `Basic ${encoded}`,
  };
  if (includeJsonContentType) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

export function getBaseUrl() {
  const raw = getRequiredEnv("JIRA_BASE_URL");
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export async function jiraRequest(path, options = {}) {
  const url = `${getBaseUrl()}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(
      `Jira request failed (${response.status} ${response.statusText}): ${bodyText}`
    );
  }

  if (response.status === 204) {
    return null;
  }

  const rawBody = await response.text();
  if (!rawBody.trim()) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return rawBody;
  }

  return JSON.parse(rawBody);
}

export function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (!key.startsWith("--")) {
      continue;
    }
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key.slice(2)] = true;
    } else {
      args[key.slice(2)] = next;
      i += 1;
    }
  }
  return args;
}

export async function writeOutputFile(path, content) {
  await fs.writeFile(path, `${content}\n`, "utf8");
}
