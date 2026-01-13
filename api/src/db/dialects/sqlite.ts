import { BunSqliteDialect } from "kysely-bun-sqlite";
import { Database as BunDatabase } from "bun:sqlite";
import { join } from "path";
import { mkdirSync } from "fs";
import type { KyselyConfig } from "kysely";

export function createSqliteDialect(): KyselyConfig {
  const dbPath =
    process.env.DB_PATH || join(import.meta.dir, "../../../data/mini-jira.db");

  // Ensure data directory exists
  const dataDir = join(import.meta.dir, "../../../data");
  mkdirSync(dataDir, { recursive: true });

  const sqliteDb = new BunDatabase(dbPath);

  // Enable foreign keys
  sqliteDb.run("PRAGMA foreign_keys = ON");

  return {
    dialect: new BunSqliteDialect({
      database: sqliteDb,
    }),
  };
}

// Export the raw SQLite database for schema initialization
export function getRawSqliteDb(): BunDatabase {
  const dbPath =
    process.env.DB_PATH || join(import.meta.dir, "../../../data/mini-jira.db");

  const dataDir = join(import.meta.dir, "../../../data");
  mkdirSync(dataDir, { recursive: true });

  const sqliteDb = new BunDatabase(dbPath);
  sqliteDb.run("PRAGMA foreign_keys = ON");

  return sqliteDb;
}
