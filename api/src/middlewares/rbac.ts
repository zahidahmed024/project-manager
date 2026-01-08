import { createMiddleware } from "hono/factory";
import { projectRepo } from "../repositories/project.repo";
import type { Role } from "../utils/permissions";

// Middleware to require global admin role
export const requireAdmin = createMiddleware(async (c, next) => {
  const user = c.get("user");
  
  if (user.role !== "admin") {
    return c.json({ error: "Admin access required" }, 403);
  }
  
  await next();
});

// Middleware to require project membership
export const requireProjectMember = createMiddleware(async (c, next) => {
  const user = c.get("user");
  const projectId = parseInt(c.req.param("projectId") || c.req.param("id") || "0");
  
  if (!projectId) {
    return c.json({ error: "Project ID required" }, 400);
  }
  
  const role = projectRepo.getMemberRole(projectId, user.id);
  
  if (!role) {
    return c.json({ error: "Not a member of this project" }, 403);
  }
  
  // Store project role in context for later use
  c.set("projectRole" as never, role);
  
  await next();
});

// Middleware to require project admin role
export const requireProjectAdmin = createMiddleware(async (c, next) => {
  const user = c.get("user");
  const projectId = parseInt(c.req.param("projectId") || c.req.param("id") || "0");
  
  if (!projectId) {
    return c.json({ error: "Project ID required" }, 400);
  }
  
  const role = projectRepo.getMemberRole(projectId, user.id);
  
  if (role !== "admin") {
    return c.json({ error: "Project admin access required" }, 403);
  }
  
  await next();
});

// Factory to create role-checking middleware
export function requireRole(role: Role) {
  return createMiddleware(async (c, next) => {
    const user = c.get("user");
    
    if (role === "admin" && user.role !== "admin") {
      return c.json({ error: "Admin access required" }, 403);
    }
    
    await next();
  });
}
