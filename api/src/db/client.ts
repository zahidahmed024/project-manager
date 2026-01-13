import { Kysely, sql } from "kysely";
import type { Database } from "./types";
import { createSqliteDialect, getRawSqliteDb } from "./dialects/sqlite";
import { createPostgresDialect } from "./dialects/postgres";
import { createMysqlDialect } from "./dialects/mysql";
import { readFileSync } from "fs";
import { join } from "path";

export type DbType = "sqlite" | "postgres" | "mysql";

function getDbType(): DbType {
  const dbType = process.env.DB_TYPE || "sqlite";
  if (dbType !== "sqlite" && dbType !== "postgres" && dbType !== "mysql") {
    throw new Error(`Invalid DB_TYPE: ${dbType}. Must be sqlite, postgres, or mysql.`);
  }
  return dbType;
}

function createDialect(): Kysely<Database> {
  const dbType = getDbType();

  switch (dbType) {
    case "sqlite":
      return new Kysely<Database>(createSqliteDialect());
    case "postgres":
      return new Kysely<Database>(createPostgresDialect());
    case "mysql":
      return new Kysely<Database>(createMysqlDialect());
    default:
      throw new Error(`Unsupported database type: ${dbType}`);
  }
}

export const db = createDialect();
export const dbType = getDbType();

// Initialize schema based on database type
export async function initDb() {
  const type = getDbType();

  if (type === "sqlite") {
    // For SQLite, use the raw database to run schema SQL directly
    const sqliteDb = getRawSqliteDb();
    const schemaPath = join(import.meta.dir, "schema.sqlite.sql");
    const schema = readFileSync(schemaPath, "utf-8");
    sqliteDb.run(schema);
    console.log("✅ SQLite database initialized");
    // For PostgreSQL and MySQL, run the schema file
    // The schema files use "CREATE TABLE IF NOT EXISTS", so it's safe to run multiple times
    try {
      const schemaPath = join(import.meta.dir, `schema.${type}.sql`);
      const schema = readFileSync(schemaPath, "utf-8");
      
      // Split by semicolon to run statements individually (Kysely might not support multiple statements in one call depending on driver)
      // But typically sql`...` works for raw queries. Let's try executing raw sql.
      await sql.raw(schema).execute(db);
      
      console.log(`✅ ${type} schema initialized`);
    } catch (error) {
      console.error(`❌ Failed to initialize ${type} schema:`, error);
    }
  }
}

// Helper for transactions
export async function transaction<T>(fn: (trx: Kysely<Database>) => Promise<T>): Promise<T> {
  return await db.transaction().execute(fn);
}

// Helper to get the current timestamp SQL for the database type
export function currentTimestamp() {
  const type = getDbType();
  switch (type) {
    case "sqlite":
      return sql`CURRENT_TIMESTAMP`;
    case "postgres":
      return sql`NOW()`;
    case "mysql":
      return sql`NOW()`;
    default:
      return sql`CURRENT_TIMESTAMP`;
  }
}
