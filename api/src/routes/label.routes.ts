import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { labelRepo } from "../repositories/label.repo";
import { projectRepo } from "../repositories/project.repo";
import { authMiddleware } from "../middlewares/auth";

const labelRoutes = new Hono();

// All label routes require authentication
labelRoutes.use("*", authMiddleware);

// Create label schema
const createLabelSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

// GET /projects/:projectId/labels - List labels for project
labelRoutes.get("/projects/:projectId/labels", (c) => {
  const user = c.get("user");
  const projectId = parseInt(c.req.param("projectId"));
  
  // Check membership
  const role = projectRepo.getMemberRole(projectId, user.id);
  if (!role) {
    return c.json({ error: "Not a member of this project" }, 403);
  }
  
  const labels = labelRepo.findByProjectId(projectId);
  return c.json({ labels });
});

// POST /projects/:projectId/labels - Create label
labelRoutes.post("/projects/:projectId/labels", zValidator("json", createLabelSchema), (c) => {
  const user = c.get("user");
  const projectId = parseInt(c.req.param("projectId"));
  const data = c.req.valid("json");
  
  // Check admin
  const role = projectRepo.getMemberRole(projectId, user.id);
  if (role !== "admin") {
    return c.json({ error: "Project admin access required" }, 403);
  }
  
  const label = labelRepo.create({
    project_id: projectId,
    name: data.name,
    color: data.color,
  });
  
  return c.json({ label }, 201);
});

// PATCH /labels/:id - Update label
labelRoutes.patch("/labels/:id", zValidator("json", createLabelSchema.partial()), (c) => {
  const user = c.get("user");
  const labelId = parseInt(c.req.param("id"));
  const data = c.req.valid("json");
  
  const label = labelRepo.findById(labelId);
  if (!label) {
    return c.json({ error: "Label not found" }, 404);
  }
  
  // Check admin
  const role = projectRepo.getMemberRole(label.project_id, user.id);
  if (role !== "admin") {
    return c.json({ error: "Project admin access required" }, 403);
  }
  
  const updated = labelRepo.update(labelId, data);
  return c.json({ label: updated });
});

// DELETE /labels/:id - Delete label
labelRoutes.delete("/labels/:id", (c) => {
  const user = c.get("user");
  const labelId = parseInt(c.req.param("id"));
  
  const label = labelRepo.findById(labelId);
  if (!label) {
    return c.json({ error: "Label not found" }, 404);
  }
  
  // Check admin
  const role = projectRepo.getMemberRole(label.project_id, user.id);
  if (role !== "admin") {
    return c.json({ error: "Project admin access required" }, 403);
  }
  
  labelRepo.delete(labelId);
  return c.json({ message: "Label deleted successfully" });
});

export { labelRoutes };
