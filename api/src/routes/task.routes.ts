import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { taskRepo } from "../repositories/task.repo";
import { boardRepo } from "../repositories/board.repo";
import { projectRepo } from "../repositories/project.repo";
import { commentRepo } from "../repositories/comment.repo";
import { labelRepo } from "../repositories/label.repo";
import { authMiddleware } from "../middlewares/auth";

const taskRoutes = new Hono();

// All task routes require authentication
taskRoutes.use("*", authMiddleware);

// Create task schema
const createTaskSchema = z.object({
  type: z.enum(["issue", "bugfix", "story", "subtask"]),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  assignee_id: z.number().optional(),
  deadline: z.string().optional(),
});

// Update task schema
const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  assignee_id: z.number().nullable().optional(),
  deadline: z.string().nullable().optional(),
  position: z.number().optional(),
});

// Helper to check board access
function checkBoardAccess(boardId: number, userId: number): { board: ReturnType<typeof boardRepo.findById>; role: string | null } {
  const board = boardRepo.findById(boardId);
  if (!board) {
    return { board: null, role: null };
  }
  const role = projectRepo.getMemberRole(board.project_id, userId);
  return { board, role };
}

// GET /boards/:boardId/tasks - List tasks
taskRoutes.get("/boards/:boardId/tasks", (c) => {
  const user = c.get("user");
  const boardId = parseInt(c.req.param("boardId"));
  
  const { board, role } = checkBoardAccess(boardId, user.id);
  if (!board) return c.json({ error: "Board not found" }, 404);
  if (!role) return c.json({ error: "Not a member of this project" }, 403);
  
  const tasks = taskRepo.findByBoardId(boardId);
  return c.json({ tasks });
});

// POST /boards/:boardId/tasks - Create task
taskRoutes.post("/boards/:boardId/tasks", zValidator("json", createTaskSchema), (c) => {
  const user = c.get("user");
  const boardId = parseInt(c.req.param("boardId"));
  const data = c.req.valid("json");
  
  const { board, role } = checkBoardAccess(boardId, user.id);
  if (!board) return c.json({ error: "Board not found" }, 404);
  if (!role) return c.json({ error: "Not a member of this project" }, 403);
  
  const task = taskRepo.create({
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
  
  return c.json({ task }, 201);
});

// GET /tasks/:id - Get task with subtasks and labels
taskRoutes.get("/tasks/:id", (c) => {
  const user = c.get("user");
  const taskId = parseInt(c.req.param("id"));
  
  const task = taskRepo.findByIdWithLabels(taskId);
  if (!task) return c.json({ error: "Task not found" }, 404);
  
  const { role } = checkBoardAccess(task.board_id, user.id);
  if (!role) return c.json({ error: "Not a member of this project" }, 403);
  
  const subtasks = taskRepo.getSubtasks(taskId);
  const comments = commentRepo.findByTaskId(taskId);
  
  return c.json({ task, subtasks, comments });
});

// PATCH /tasks/:id - Update task
taskRoutes.patch("/tasks/:id", zValidator("json", updateTaskSchema), (c) => {
  const user = c.get("user");
  const taskId = parseInt(c.req.param("id"));
  const data = c.req.valid("json");
  
  const task = taskRepo.findById(taskId);
  if (!task) return c.json({ error: "Task not found" }, 404);
  
  const { role } = checkBoardAccess(task.board_id, user.id);
  if (!role) return c.json({ error: "Not a member of this project" }, 403);
  
  const updated = taskRepo.update(taskId, data);
  return c.json({ task: updated });
});

// DELETE /tasks/:id - Delete task
taskRoutes.delete("/tasks/:id", (c) => {
  const user = c.get("user");
  const taskId = parseInt(c.req.param("id"));
  
  const task = taskRepo.findById(taskId);
  if (!task) return c.json({ error: "Task not found" }, 404);
  
  const { board, role } = checkBoardAccess(task.board_id, user.id);
  if (!role) return c.json({ error: "Not a member of this project" }, 403);
  
  // Only admin or reporter can delete
  if (role !== "admin" && task.reporter_id !== user.id) {
    return c.json({ error: "Only admin or task creator can delete" }, 403);
  }
  
  taskRepo.delete(taskId);
  return c.json({ message: "Task deleted successfully" });
});

// POST /tasks/:id/subtasks - Create subtask
taskRoutes.post("/tasks/:id/subtasks", zValidator("json", createTaskSchema.omit({ type: true })), (c) => {
  const user = c.get("user");
  const parentId = parseInt(c.req.param("id"));
  const data = c.req.valid("json");
  
  const parent = taskRepo.findById(parentId);
  if (!parent) return c.json({ error: "Parent task not found" }, 404);
  
  const { role } = checkBoardAccess(parent.board_id, user.id);
  if (!role) return c.json({ error: "Not a member of this project" }, 403);
  
  const subtask = taskRepo.create({
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
  
  return c.json({ subtask }, 201);
});

// POST /tasks/:id/labels/:labelId - Add label to task
taskRoutes.post("/tasks/:id/labels/:labelId", (c) => {
  const user = c.get("user");
  const taskId = parseInt(c.req.param("id"));
  const labelId = parseInt(c.req.param("labelId"));
  
  const task = taskRepo.findById(taskId);
  if (!task) return c.json({ error: "Task not found" }, 404);
  
  const { role } = checkBoardAccess(task.board_id, user.id);
  if (!role) return c.json({ error: "Not a member of this project" }, 403);
  
  labelRepo.addToTask(taskId, labelId);
  return c.json({ message: "Label added" });
});

// DELETE /tasks/:id/labels/:labelId - Remove label from task
taskRoutes.delete("/tasks/:id/labels/:labelId", (c) => {
  const user = c.get("user");
  const taskId = parseInt(c.req.param("id"));
  const labelId = parseInt(c.req.param("labelId"));
  
  const task = taskRepo.findById(taskId);
  if (!task) return c.json({ error: "Task not found" }, 404);
  
  const { role } = checkBoardAccess(task.board_id, user.id);
  if (!role) return c.json({ error: "Not a member of this project" }, 403);
  
  labelRepo.removeFromTask(taskId, labelId);
  return c.json({ message: "Label removed" });
});

// GET /tasks/:id/comments - List comments
taskRoutes.get("/tasks/:id/comments", (c) => {
  const user = c.get("user");
  const taskId = parseInt(c.req.param("id"));
  
  const task = taskRepo.findById(taskId);
  if (!task) return c.json({ error: "Task not found" }, 404);
  
  const { role } = checkBoardAccess(task.board_id, user.id);
  if (!role) return c.json({ error: "Not a member of this project" }, 403);
  
  const comments = commentRepo.findByTaskId(taskId);
  return c.json({ comments });
});

// POST /tasks/:id/comments - Add comment
taskRoutes.post("/tasks/:id/comments", zValidator("json", z.object({
  content: z.string().min(1),
})), (c) => {
  const user = c.get("user");
  const taskId = parseInt(c.req.param("id"));
  const { content } = c.req.valid("json");
  
  const task = taskRepo.findById(taskId);
  if (!task) return c.json({ error: "Task not found" }, 404);
  
  const { role } = checkBoardAccess(task.board_id, user.id);
  if (!role) return c.json({ error: "Not a member of this project" }, 403);
  
  const comment = commentRepo.create({
    task_id: taskId,
    author_id: user.id,
    content,
  });
  
  return c.json({ comment }, 201);
});

export { taskRoutes };
