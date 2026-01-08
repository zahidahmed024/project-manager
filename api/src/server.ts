import { app } from "./app";
import { initDb } from "./db/client";

const PORT = parseInt(process.env.PORT || "3000");

// Initialize database
initDb();

console.log(`
🚀 Mini Jira API Server
━━━━━━━━━━━━━━━━━━━━━━━━
📍 http://localhost:${PORT}
🔑 JWT Auth enabled
📦 SQLite database
Ready to accept connections!
`);

export default {
  port: PORT,
  fetch: app.fetch,
};
