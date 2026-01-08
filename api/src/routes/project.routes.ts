import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { projectRepo } from "../repositories/project.repo";
import { boardRepo } from "../repositories/board.repo";
import { labelRepo } from "../repositories/label.repo";
import { authMiddleware } from "../middlewares/auth";
import { requireProjectAdmin, requireProjectMember } from "../middlewares/rbac";

const projectRoutes = new Hono();

// All project routes require authentication
projectRoutes.use("*", authMiddleware);

// Create project schema
const createProjectSchema = z.object({
  name: z.string().min(1),
  key: z.string().min(2).max(10).toUpperCase(),
  description: z.string().optional(),
});

// GET /projects - List user's projects
projectRoutes.get("/", (c) => {
  const user = c.get("user");
  const projects = projectRepo.findByUserId(user.id);
  return c.json({ projects });
});

// POST /projects - Create project
projectRoutes.post("/", zValidator("json", createProjectSchema), (c) => {
  const user = c.get("user");
  const data = c.req.valid("json");
  
  // Check if key already exists
  const existing = projectRepo.findByKey(data.key);
  if (existing) {
    return c.json({ error: "Project key already exists" }, 400);
  }
  
  const project = projectRepo.create({
    name: data.name,
    key: data.key,
    description: data.description,
    owner_id: user.id,
  });
  
  // Create default board
  boardRepo.create({ project_id: project.id, name: "Main Board" });
  
  return c.json({ project }, 201);
});

// GET /projects/:id - Get project details
projectRoutes.get("/:id", requireProjectMember, (c) => {
  const projectId = parseInt(c.req.param("id"));
  const project = projectRepo.findById(projectId);
  
  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }
  
  const members = projectRepo.getMembers(projectId);
  const boards = boardRepo.findByProjectId(projectId);
  const labels = labelRepo.findByProjectId(projectId);
  
  return c.json({ project, members, boards, labels });
});

// PATCH /projects/:id - Update project
projectRoutes.patch("/:id", requireProjectAdmin, zValidator("json", z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
})), (c) => {
  const projectId = parseInt(c.req.param("id"));
  const data = c.req.valid("json");
  
  const project = projectRepo.update(projectId, data);
  
  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }
  
  return c.json({ project });
});

// POST /projects/:id/members - Add member
projectRoutes.post("/:id/members", requireProjectAdmin, zValidator("json", z.object({
  user_id: z.number(),
  role: z.enum(["admin", "member"]).default("member"),
})), (c) => {
  const projectId = parseInt(c.req.param("id"));
  const { user_id, role } = c.req.valid("json");
  
  projectRepo.addMember(projectId, user_id, role);
  
  return c.json({ message: "Member added successfully" });
});

// DELETE /projects/:id/members/:userId - Remove member
projectRoutes.delete("/:id/members/:userId", requireProjectAdmin, (c) => {
  const projectId = parseInt(c.req.param("id"));
  const userId = parseInt(c.req.param("userId"));
  
  const project = projectRepo.findById(projectId);
  if (project && project.owner_id === userId) {
    return c.json({ error: "Cannot remove project owner" }, 400);
  }
  
  projectRepo.removeMember(projectId, userId);
  
  return c.json({ message: "Member removed successfully" });
});

export { projectRoutes };
