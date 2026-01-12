import { db } from "./src/db/client";

const schema = db.query("SELECT sql FROM sqlite_master WHERE type='table' AND name='tasks'").get() as { sql: string };
console.log("Current schema for tasks table:");
console.log(schema.sql);
