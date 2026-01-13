import { MysqlDialect } from "kysely";
import { createPool } from "mysql2";
import type { KyselyConfig } from "kysely";

export function createMysqlDialect(): KyselyConfig {
  const pool = createPool({
    host: process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.MYSQL_PORT || "3306"),
    database: process.env.MYSQL_DATABASE || "mini_jira",
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "password",
    connectionLimit: 10,
  });

  return {
    dialect: new MysqlDialect({
      pool: pool.promise(),
    }),
  };
}
