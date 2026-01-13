import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { labelRepo } from "../repositories/label.repo";
import { projectRepo } from "../repositories/project.repo";
import { authMiddleware } from "../middlewares/auth";
import { success, error } from "../utils/response";

const labelRoutes = new Hono();

// All label routes require authentication
labelRoutes.use("*", authMiddleware);

// Create label schema
const createLabelSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

// GET /projects/:projectId/labels - List labels for project
labelRoutes.get("/projects/:projectId/labels", async (c) => {
  const user = c.get("user");
  const projectId = parseInt(c.req.param("projectId"));
  
  // Check membership
  const role = await projectRepo.getMemberRole(projectId, user.id);
  if (!role) {
    return error(c, "Not a member of this project", 403);
  }
  
  const labels = await labelRepo.findByProjectId(projectId);
  return success(c, { labels }, "Labels retrieved successfully");
});

// POST /projects/:projectId/labels - Create label
labelRoutes.post("/projects/:projectId/labels", zValidator("json", createLabelSchema), async (c) => {
  const user = c.get("user");
  const projectId = parseInt(c.req.param("projectId"));
  const data = c.req.valid("json");
  
  // Check admin
  const role = await projectRepo.getMemberRole(projectId, user.id);
  if (role !== "admin") {
    return error(c, "Project admin access required", 403);
  }
  
  const label = await labelRepo.create({
    project_id: projectId,
    name: data.name,
    color: data.color,
  });
  
  return success(c, { label }, "Label created successfully", 201);
});

// PATCH /labels/:id - Update label
labelRoutes.patch("/labels/:id", zValidator("json", createLabelSchema.partial()), async (c) => {
  const user = c.get("user");
  const labelId = parseInt(c.req.param("id"));
  const data = c.req.valid("json");
  
  const label = await labelRepo.findById(labelId);
  if (!label) {
    return error(c, "Label not found", 404);
  }
  
  // Check admin
  const role = await projectRepo.getMemberRole(label.project_id, user.id);
  if (role !== "admin") {
    return error(c, "Project admin access required", 403);
  }
  
  const updated = await labelRepo.update(labelId, data);
  return success(c, { label: updated }, "Label updated successfully");
});

// DELETE /labels/:id - Delete label
labelRoutes.delete("/labels/:id", async (c) => {
  const user = c.get("user");
  const labelId = parseInt(c.req.param("id"));
  
  const label = await labelRepo.findById(labelId);
  if (!label) {
    return error(c, "Label not found", 404);
  }
  
  // Check admin
  const role = await projectRepo.getMemberRole(label.project_id, user.id);
  if (role !== "admin") {
    return error(c, "Project admin access required", 403);
  }
  
  await labelRepo.delete(labelId);
  return success(c, null, "Label deleted successfully");
});

export { labelRoutes };
