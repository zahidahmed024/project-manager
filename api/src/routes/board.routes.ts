import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { boardRepo } from "../repositories/board.repo";
import { taskRepo } from "../repositories/task.repo";
import { projectRepo } from "../repositories/project.repo";
import { authMiddleware } from "../middlewares/auth";

const boardRoutes = new Hono();

// All board routes require authentication
boardRoutes.use("*", authMiddleware);

// Create board schema
const createBoardSchema = z.object({
  name: z.string().min(1),
});

// GET /projects/:projectId/boards - List boards for project
boardRoutes.get("/projects/:projectId/boards", (c) => {
  const user = c.get("user");
  const projectId = parseInt(c.req.param("projectId"));
  
  // Check membership
  const role = projectRepo.getMemberRole(projectId, user.id);
  if (!role) {
    return c.json({ error: "Not a member of this project" }, 403);
  }
  
  const boards = boardRepo.findByProjectId(projectId);
  return c.json({ boards });
});

// POST /projects/:projectId/boards - Create board
boardRoutes.post("/projects/:projectId/boards", zValidator("json", createBoardSchema), (c) => {
  const user = c.get("user");
  const projectId = parseInt(c.req.param("projectId"));
  const { name } = c.req.valid("json");
  
  // Check membership
  const role = projectRepo.getMemberRole(projectId, user.id);
  if (!role) {
    return c.json({ error: "Not a member of this project" }, 403);
  }
  
  const board = boardRepo.create({ project_id: projectId, name });
  return c.json({ board }, 201);
});

// GET /boards/:id - Get board with tasks
boardRoutes.get("/boards/:id", (c) => {
  const user = c.get("user");
  const boardId = parseInt(c.req.param("id"));
  
  const board = boardRepo.findById(boardId);
  if (!board) {
    return c.json({ error: "Board not found" }, 404);
  }
  
  // Check project membership
  const role = projectRepo.getMemberRole(board.project_id, user.id);
  if (!role) {
    return c.json({ error: "Not a member of this project" }, 403);
  }
  
  const tasks = taskRepo.findByBoardId(boardId);
  
  // Get subtasks for each task
  const tasksWithSubtasks = tasks.map(task => ({
    ...task,
    subtasks: taskRepo.getSubtasks(task.id),
  }));
  
  return c.json({ board, tasks: tasksWithSubtasks });
});

// PATCH /boards/:id - Update board
boardRoutes.patch("/boards/:id", zValidator("json", createBoardSchema), (c) => {
  const user = c.get("user");
  const boardId = parseInt(c.req.param("id"));
  const { name } = c.req.valid("json");
  
  const board = boardRepo.findById(boardId);
  if (!board) {
    return c.json({ error: "Board not found" }, 404);
  }
  
  // Check project admin
  const role = projectRepo.getMemberRole(board.project_id, user.id);
  if (role !== "admin") {
    return c.json({ error: "Project admin access required" }, 403);
  }
  
  const updated = boardRepo.update(boardId, name);
  return c.json({ board: updated });
});

// DELETE /boards/:id - Delete board
boardRoutes.delete("/boards/:id", (c) => {
  const user = c.get("user");
  const boardId = parseInt(c.req.param("id"));
  
  const board = boardRepo.findById(boardId);
  if (!board) {
    return c.json({ error: "Board not found" }, 404);
  }
  
  // Check project admin
  const role = projectRepo.getMemberRole(board.project_id, user.id);
  if (role !== "admin") {
    return c.json({ error: "Project admin access required" }, 403);
  }
  
  boardRepo.delete(boardId);
  return c.json({ message: "Board deleted successfully" });
});

export { boardRoutes };
