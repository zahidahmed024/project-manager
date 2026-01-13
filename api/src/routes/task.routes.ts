import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { taskRepo } from "../repositories/task.repo";
import { boardRepo } from "../repositories/board.repo";
import { projectRepo } from "../repositories/project.repo";
import { commentRepo } from "../repositories/comment.repo";
import { labelRepo } from "../repositories/label.repo";
import { authMiddleware } from "../middlewares/auth";
import { success, error } from "../utils/response";
import type { Board } from "../repositories/board.repo";

const taskRoutes = new Hono();

// All task routes require authentication
taskRoutes.use("*", authMiddleware);

// Create task schema
const createTaskSchema = z.object({
  type: z.enum(["issue", "bugfix", "story", "subtask"]),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.string().default("todo"), // Changed to string for dynamic columns
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  assignee_id: z.number().optional(),
  deadline: z.string().optional(),
});

// Update task schema
const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.string().optional(), // Changed to string for dynamic columns
  priority: z.enum(["high", "medium", "low"]).optional(),
  assignee_id: z.number().nullable().optional(),
  deadline: z.string().nullable().optional(),
  position: z.number().optional(),
});

// Helper to check board access
async function checkBoardAccess(boardId: number, userId: number): Promise<{ board: Board | null; role: string | null }> {
  const board = await boardRepo.findById(boardId);
  if (!board) {
    return { board: null, role: null };
  }
  const role = await projectRepo.getMemberRole(board.project_id, userId);
  return { board, role };
}

// GET /boards/:boardId/tasks - List tasks
taskRoutes.get("/boards/:boardId/tasks", async (c) => {
  const user = c.get("user");
  const boardId = parseInt(c.req.param("boardId"));
  
  const { board, role } = await checkBoardAccess(boardId, user.id);
  if (!board) return error(c, "Board not found", 404);
  if (!role) return error(c, "Not a member of this project", 403);
  
  const tasks = await taskRepo.findByBoardId(boardId);
  return success(c, { tasks }, "Tasks retrieved successfully");
});

// POST /boards/:boardId/tasks - Create task
taskRoutes.post("/boards/:boardId/tasks", zValidator("json", createTaskSchema), async (c) => {
  const user = c.get("user");
  const boardId = parseInt(c.req.param("boardId"));
  const data = c.req.valid("json");
  
  const { board, role } = await checkBoardAccess(boardId, user.id);
  if (!board) return error(c, "Board not found", 404);
  if (!role) return error(c, "Not a member of this project", 403);
  
  const task = await taskRepo.create({
    board_id: boardId,
    type: data.type,
    title: data.title,
    description: data.description,
    status: data.status,
    priority: data.priority,
    assignee_id: data.assignee_id,
    reporter_id: user.id,
    deadline: data.deadline,
  });
  
  return success(c, { task }, "Task created successfully", 201);
});

// GET /tasks/:id - Get task with subtasks and labels
taskRoutes.get("/tasks/:id", async (c) => {
  const user = c.get("user");
  const taskId = parseInt(c.req.param("id"));
  
  const task = await taskRepo.findByIdWithLabels(taskId);
  if (!task) return error(c, "Task not found", 404);
  
  const { role } = await checkBoardAccess(task.board_id, user.id);
  if (!role) return error(c, "Not a member of this project", 403);
  
  const subtasks = await taskRepo.getSubtasks(taskId);
  const comments = await commentRepo.findByTaskId(taskId);
  
  return success(c, { task, subtasks, comments }, "Task retrieved successfully");
});

// PATCH /tasks/:id - Update task
taskRoutes.patch("/tasks/:id", zValidator("json", updateTaskSchema), async (c) => {
  const user = c.get("user");
  const taskId = parseInt(c.req.param("id"));
  const data = c.req.valid("json");
  
  const task = await taskRepo.findById(taskId);
  if (!task) return error(c, "Task not found", 404);
  
  const { role } = await checkBoardAccess(task.board_id, user.id);
  if (!role) return error(c, "Not a member of this project", 403);
  
  const updated = await taskRepo.update(taskId, data);
  return success(c, { task: updated }, "Task updated successfully");
});

// DELETE /tasks/:id - Delete task
taskRoutes.delete("/tasks/:id", async (c) => {
  const user = c.get("user");
  const taskId = parseInt(c.req.param("id"));
  
  const task = await taskRepo.findById(taskId);
  if (!task) return error(c, "Task not found", 404);
  
  const { role } = await checkBoardAccess(task.board_id, user.id);
  if (!role) return error(c, "Not a member of this project", 403);
  
  // Only admin or reporter can delete
  if (role !== "admin" && task.reporter_id !== user.id) {
    return error(c, "Only admin or task creator can delete", 403);
  }
  
  await taskRepo.delete(taskId);
  return success(c, null, "Task deleted successfully");
});

// POST /tasks/:id/subtasks - Create subtask
taskRoutes.post("/tasks/:id/subtasks", zValidator("json", createTaskSchema.omit({ type: true })), async (c) => {
  const user = c.get("user");
  const parentId = parseInt(c.req.param("id"));
  const data = c.req.valid("json");
  
  const parent = await taskRepo.findById(parentId);
  if (!parent) return error(c, "Parent task not found", 404);
  
  const { role } = await checkBoardAccess(parent.board_id, user.id);
  if (!role) return error(c, "Not a member of this project", 403);
  
  const subtask = await taskRepo.create({
    board_id: parent.board_id,
    type: "subtask",
    title: data.title,
    description: data.description,
    status: data.status,
    priority: data.priority,
    assignee_id: data.assignee_id,
    reporter_id: user.id,
    parent_id: parentId,
    deadline: data.deadline,
  });
  
  return success(c, { subtask }, "Subtask created successfully", 201);
});

// POST /tasks/:id/labels/:labelId - Add label to task
taskRoutes.post("/tasks/:id/labels/:labelId", async (c) => {
  const user = c.get("user");
  const taskId = parseInt(c.req.param("id"));
  const labelId = parseInt(c.req.param("labelId"));
  
  const task = await taskRepo.findById(taskId);
  if (!task) return error(c, "Task not found", 404);
  
  const { role } = await checkBoardAccess(task.board_id, user.id);
  if (!role) return error(c, "Not a member of this project", 403);
  
  await labelRepo.addToTask(taskId, labelId);
  return success(c, null, "Label added successfully");
});

// DELETE /tasks/:id/labels/:labelId - Remove label from task
taskRoutes.delete("/tasks/:id/labels/:labelId", async (c) => {
  const user = c.get("user");
  const taskId = parseInt(c.req.param("id"));
  const labelId = parseInt(c.req.param("labelId"));
  
  const task = await taskRepo.findById(taskId);
  if (!task) return error(c, "Task not found", 404);
  
  const { role } = await checkBoardAccess(task.board_id, user.id);
  if (!role) return error(c, "Not a member of this project", 403);
  
  await labelRepo.removeFromTask(taskId, labelId);
  return success(c, null, "Label removed successfully");
});

// GET /tasks/:id/comments - List comments
taskRoutes.get("/tasks/:id/comments", async (c) => {
  const user = c.get("user");
  const taskId = parseInt(c.req.param("id"));
  
  const task = await taskRepo.findById(taskId);
  if (!task) return error(c, "Task not found", 404);
  
  const { role } = await checkBoardAccess(task.board_id, user.id);
  if (!role) return error(c, "Not a member of this project", 403);
  
  const comments = await commentRepo.findByTaskId(taskId);
  return success(c, { comments }, "Comments retrieved successfully");
});

// POST /tasks/:id/comments - Add comment
taskRoutes.post("/tasks/:id/comments", zValidator("json", z.object({
  content: z.string().min(1),
})), async (c) => {
  const user = c.get("user");
  const taskId = parseInt(c.req.param("id"));
  const { content } = c.req.valid("json");
  
  const task = await taskRepo.findById(taskId);
  if (!task) return error(c, "Task not found", 404);
  
  const { role } = await checkBoardAccess(task.board_id, user.id);
  if (!role) return error(c, "Not a member of this project", 403);
  
  const comment = await commentRepo.create({
    task_id: taskId,
    author_id: user.id,
    content,
  });
  
  return success(c, { comment }, "Comment added successfully", 201);
});

export { taskRoutes };
