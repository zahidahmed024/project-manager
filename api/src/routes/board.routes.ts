import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { boardRepo } from "../repositories/board.repo";
import { taskRepo } from "../repositories/task.repo";
import { projectRepo } from "../repositories/project.repo";
import { columnRepo } from "../repositories/column.repo";
import { authMiddleware } from "../middlewares/auth";
import { success, error } from "../utils/response";

const boardRoutes = new Hono();

// All board routes require authentication
boardRoutes.use("*", authMiddleware);

// Create board schema
const createBoardSchema = z.object({
  name: z.string().min(1),
});

// Create column schema
const createColumnSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

// Reorder columns schema
const reorderColumnsSchema = z.object({
  columnIds: z.array(z.number()),
});

// GET /projects/:projectId/boards - List boards for project
boardRoutes.get("/projects/:projectId/boards", (c) => {
  const user = c.get("user");
  const projectId = parseInt(c.req.param("projectId"));
  
  // Check membership
  const role = projectRepo.getMemberRole(projectId, user.id);
  if (!role) {
    return error(c, "Not a member of this project", 403);
  }
  
  const boards = boardRepo.findByProjectId(projectId);
  return success(c, { boards }, "Boards retrieved successfully");
});

// POST /projects/:projectId/boards - Create board
boardRoutes.post("/projects/:projectId/boards", zValidator("json", createBoardSchema), (c) => {
  const user = c.get("user");
  const projectId = parseInt(c.req.param("projectId"));
  const { name } = c.req.valid("json");
  
  // Check membership
  const role = projectRepo.getMemberRole(projectId, user.id);
  if (!role) {
    return error(c, "Not a member of this project", 403);
  }
  
  const board = boardRepo.create({ project_id: projectId, name });
  return success(c, { board }, "Board created successfully", 201);
});

// GET /boards/:id - Get board with columns and tasks
boardRoutes.get("/boards/:id", (c) => {
  const user = c.get("user");
  const boardId = parseInt(c.req.param("id"));
  
  const board = boardRepo.findById(boardId);
  if (!board) {
    return error(c, "Board not found", 404);
  }
  
  // Check project membership
  const role = projectRepo.getMemberRole(board.project_id, user.id);
  if (!role) {
    return error(c, "Not a member of this project", 403);
  }
  
  const columns = columnRepo.findByBoardId(boardId);
  const tasks = taskRepo.findByBoardId(boardId);
  
  // Get subtasks for each task
  const tasksWithSubtasks = tasks.map(task => ({
    ...task,
    subtasks: taskRepo.getSubtasks(task.id),
  }));
  
  return success(c, { board, columns, tasks: tasksWithSubtasks }, "Board retrieved successfully");
});

// PATCH /boards/:id - Update board
boardRoutes.patch("/boards/:id", zValidator("json", createBoardSchema), (c) => {
  const user = c.get("user");
  const boardId = parseInt(c.req.param("id"));
  const { name } = c.req.valid("json");
  
  const board = boardRepo.findById(boardId);
  if (!board) {
    return error(c, "Board not found", 404);
  }
  
  // Check project admin
  const role = projectRepo.getMemberRole(board.project_id, user.id);
  if (role !== "admin") {
    return error(c, "Project admin access required", 403);
  }
  
  const updated = boardRepo.update(boardId, name);
  return success(c, { board: updated }, "Board updated successfully");
});

// DELETE /boards/:id - Delete board
boardRoutes.delete("/boards/:id", (c) => {
  const user = c.get("user");
  const boardId = parseInt(c.req.param("id"));
  
  const board = boardRepo.findById(boardId);
  if (!board) {
    return error(c, "Board not found", 404);
  }
  
  // Check project admin
  const role = projectRepo.getMemberRole(board.project_id, user.id);
  if (role !== "admin") {
    return error(c, "Project admin access required", 403);
  }
  
  boardRepo.delete(boardId);
  return success(c, null, "Board deleted successfully");
});

// ========== Column Routes ==========

// GET /boards/:boardId/columns - List columns for board
boardRoutes.get("/boards/:boardId/columns", (c) => {
  const user = c.get("user");
  const boardId = parseInt(c.req.param("boardId"));
  
  const board = boardRepo.findById(boardId);
  if (!board) {
    return error(c, "Board not found", 404);
  }
  
  const role = projectRepo.getMemberRole(board.project_id, user.id);
  if (!role) {
    return error(c, "Not a member of this project", 403);
  }
  
  const columns = columnRepo.findByBoardId(boardId);
  return success(c, { columns }, "Columns retrieved successfully");
});

// POST /boards/:boardId/columns - Create column
boardRoutes.post("/boards/:boardId/columns", zValidator("json", createColumnSchema), (c) => {
  const user = c.get("user");
  const boardId = parseInt(c.req.param("boardId"));
  const { name, color } = c.req.valid("json");
  
  const board = boardRepo.findById(boardId);
  if (!board) {
    return error(c, "Board not found", 404);
  }
  
  const role = projectRepo.getMemberRole(board.project_id, user.id);
  if (!role) {
    return error(c, "Not a member of this project", 403);
  }
  
  const column = columnRepo.create({ board_id: boardId, name, color });
  return success(c, { column }, "Column created successfully", 201);
});

// PATCH /columns/:id - Update column
boardRoutes.patch("/columns/:id", zValidator("json", createColumnSchema.partial()), (c) => {
  const user = c.get("user");
  const columnId = parseInt(c.req.param("id"));
  const data = c.req.valid("json");
  
  const column = columnRepo.findById(columnId);
  if (!column) {
    return error(c, "Column not found", 404);
  }
  
  const board = boardRepo.findById(column.board_id);
  if (!board) {
    return error(c, "Board not found", 404);
  }
  
  const role = projectRepo.getMemberRole(board.project_id, user.id);
  if (!role) {
    return error(c, "Not a member of this project", 403);
  }
  
  const updated = columnRepo.update(columnId, data);
  return success(c, { column: updated }, "Column updated successfully");
});

// DELETE /columns/:id - Delete column
boardRoutes.delete("/columns/:id", (c) => {
  const user = c.get("user");
  const columnId = parseInt(c.req.param("id"));
  
  const column = columnRepo.findById(columnId);
  if (!column) {
    return error(c, "Column not found", 404);
  }
  
  const board = boardRepo.findById(column.board_id);
  if (!board) {
    return error(c, "Board not found", 404);
  }
  
  const role = projectRepo.getMemberRole(board.project_id, user.id);
  if (!role) {
    return error(c, "Not a member of this project", 403);
  }
  
  // Check if this is the only column
  const columns = columnRepo.findByBoardId(board.id);
  if (columns.length <= 1) {
    return error(c, "Cannot delete the only column", 400);
  }
  
  columnRepo.delete(columnId);
  return success(c, null, "Column deleted successfully");
});

// PATCH /boards/:boardId/columns/reorder - Reorder columns
boardRoutes.patch("/boards/:boardId/columns/reorder", zValidator("json", reorderColumnsSchema), (c) => {
  const user = c.get("user");
  const boardId = parseInt(c.req.param("boardId"));
  const { columnIds } = c.req.valid("json");
  
  const board = boardRepo.findById(boardId);
  if (!board) {
    return error(c, "Board not found", 404);
  }
  
  const role = projectRepo.getMemberRole(board.project_id, user.id);
  if (!role) {
    return error(c, "Not a member of this project", 403);
  }
  
  columnRepo.reorder(boardId, columnIds);
  const columns = columnRepo.findByBoardId(boardId);
  return success(c, { columns }, "Columns reordered successfully");
});

export { boardRoutes };

