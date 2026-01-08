import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { HTTPException } from "hono/http-exception";

import { authRoutes } from "./routes/auth.routes";
import { projectRoutes } from "./routes/project.routes";
import { boardRoutes } from "./routes/board.routes";
import { taskRoutes } from "./routes/task.routes";
import { labelRoutes } from "./routes/label.routes";

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
  return c.json({
    name: "Mini Jira API",
    version: "1.0.0",
    status: "running",
  });
});

// Routes
app.route("/auth", authRoutes);
app.route("/projects", projectRoutes);
app.route("/", boardRoutes);   // /projects/:projectId/boards, /boards/:id
app.route("/", taskRoutes);    // /boards/:boardId/tasks, /tasks/:id
app.route("/", labelRoutes);   // /projects/:projectId/labels, /labels/:id

// Error handling
app.onError((err, c) => {
  console.error("Error:", err);
  
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  
  // Zod validation errors
  if (err.name === "ZodError") {
    return c.json({ error: "Validation error", details: err }, 400);
  }
  
  return c.json({ error: "Internal server error" }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});

export { app };
