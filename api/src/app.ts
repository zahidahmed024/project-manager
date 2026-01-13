import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { HTTPException } from "hono/http-exception";

import { authRoutes } from "./routes/auth.routes";
import { projectRoutes } from "./routes/project.routes";
import { boardRoutes } from "./routes/board.routes";
import { taskRoutes } from "./routes/task.routes";
import { labelRoutes } from "./routes/label.routes";
import { success, error } from "./utils/response";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// Health check
app.get("/", (c) => {
  return success(c, {
    name: "Mini Jira API",
    version: "1.0.0",
    status: "running",
  }, "API is running");
});

// API Routes
const api = new Hono();
api.route("/auth", authRoutes);
api.route("/projects", projectRoutes);
api.route("/", boardRoutes);
api.route("/", taskRoutes);
api.route("/", labelRoutes);

// Mount API
app.route("/api", api);

// Error handling
app.onError((err, c) => {
  console.error("Error:", err);
  
  if (err instanceof HTTPException) {
    return error(c, err.message, err.status as 400 | 401 | 403 | 404 | 500);
  }
  
  // Zod validation errors
  if (err.name === "ZodError") {
    return error(c, "Validation error", 400);
  }
  
  return error(c, "Internal server error", 500);
});

// 404 handler
app.notFound((c) => {
  return error(c, "Not found", 404);
});

export { app };
