import path from "node:path";
import { fileURLToPath } from "node:url";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import pg from "pg";

const { Client } = pg;
const CURRENT_FILE_PATH = fileURLToPath(import.meta.url);
const BACKEND_ROOT = path.resolve(path.dirname(CURRENT_FILE_PATH), "..", "..", "..");
const DEFAULT_SQLITE_DB_PATH = path.resolve(BACKEND_ROOT, "data", "store.db");

function requiredEnv(name, fallback = "") {
  const value = String(process.env[name] ?? fallback).trim();
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

export function getSqliteDbPath() {
  const configuredPath = String(process.env.SQLITE_DB_PATH || "").trim();
  return configuredPath || DEFAULT_SQLITE_DB_PATH;
}

export function getPostgresConfigFromEnv() {
  const host = requiredEnv("POSTGRES_HOST", "localhost");
  const port = Number.parseInt(requiredEnv("POSTGRES_PORT", "5432"), 10);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("POSTGRES_PORT must be a positive integer");
  }

  return {
    host,
    port,
    database: requiredEnv("POSTGRES_DB", "happyvibes"),
    user: requiredEnv("POSTGRES_USER", "happyvibes"),
    password: requiredEnv("POSTGRES_PASSWORD", "happyvibes")
  };
}

export async function openSqliteDb() {
  return open({
    filename: getSqliteDbPath(),
    driver: sqlite3.Database
  });
}

export async function openPostgresClient() {
  const client = new Client(getPostgresConfigFromEnv());
  await client.connect();
  return client;
}

export function parseTimestampOrThrow(value, context) {
  const date = new Date(String(value || ""));
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid timestamp for ${context}: ${value}`);
  }
  return date.toISOString();
}
