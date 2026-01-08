import { Database } from "bun:sqlite";
import { readFileSync } from "fs";
import { join } from "path";

const DB_PATH =
  process.env.DB_PATH || join(import.meta.dir, "../../data/mini-jira.db");

// Ensure data directory exists
import { mkdirSync } from "fs";
mkdirSync(join(import.meta.dir, "../../data"), { recursive: true });

export const db = new Database(DB_PATH);

// Enable foreign keys
db.run("PRAGMA foreign_keys = ON");

// Initialize schema
export function initDb() {
  const schemaPath = join(import.meta.dir, "schema.sql");
  const schema = readFileSync(schemaPath, "utf-8");
  db.run(schema);
  console.log("✅ Database initialized");
}

// Helper for transactions
export function transaction<T>(fn: () => T): T {
  db.run("BEGIN");
  try {
    const result = fn();
    db.run("COMMIT");
    return result;
  } catch (error) {
    db.run("ROLLBACK");
    throw error;
  }
}
