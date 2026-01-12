import { db } from "../db/client";

export type TaskType = "issue" | "bugfix" | "story" | "subtask";
export type TaskStatus = string;
export type TaskPriority = "high" | "medium" | "low";

export interface Task {
  id: number;
  board_id: number;
  type: TaskType;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: number | null;
  reporter_id: number;
  parent_id: number | null;
  deadline: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface TaskCreate {
  board_id: number;
  type: TaskType;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: number;
  reporter_id: number;
  parent_id?: number;
  deadline?: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: number | null;
  deadline?: string | null;
  position?: number;
}

export const taskRepo = {
  create(data: TaskCreate): Task {
    // Get max position for the board
    const maxPos = db.query(`
      SELECT COALESCE(MAX(position), -1) as pos FROM tasks WHERE board_id = $board_id
    `).get({ $board_id: data.board_id }) as { pos: number };
    
    const stmt = db.prepare(`
      INSERT INTO tasks (board_id, type, title, description, status, priority, assignee_id, reporter_id, parent_id, deadline, position)
      VALUES ($board_id, $type, $title, $description, $status, $priority, $assignee_id, $reporter_id, $parent_id, $deadline, $position)
    `);
    stmt.run({
      $board_id: data.board_id,
      $type: data.type,
      $title: data.title,
      $description: data.description || null,
      $status: data.status || "todo",
      $priority: data.priority || "medium",
      $assignee_id: data.assignee_id || null,
      $reporter_id: data.reporter_id,
      $parent_id: data.parent_id || null,
      $deadline: data.deadline || null,
      $position: maxPos.pos + 1,
    });
    
    const lastId = db.query("SELECT last_insert_rowid() as id").get() as { id: number };
    return this.findById(lastId.id)!;
  },

  findById(id: number): Task | null {
    const stmt = db.prepare("SELECT * FROM tasks WHERE id = $id");
    return stmt.get({ $id: id }) as Task | null;
  },

  findByBoardId(boardId: number): Task[] {
    const stmt = db.prepare(`
      SELECT * FROM tasks WHERE board_id = $board_id AND parent_id IS NULL
      ORDER BY position
    `);
    return stmt.all({ $board_id: boardId }) as Task[];
  },

  getSubtasks(parentId: number): Task[] {
    const stmt = db.prepare("SELECT * FROM tasks WHERE parent_id = $parent_id ORDER BY position");
    return stmt.all({ $parent_id: parentId }) as Task[];
  },

  update(id: number, data: TaskUpdate): Task | null {
    const updates: string[] = [];
    const params: Record<string, unknown> = { $id: id };
    
    if (data.title !== undefined) {
      updates.push("title = $title");
      params.$title = data.title;
    }
    if (data.description !== undefined) {
      updates.push("description = $description");
      params.$description = data.description;
    }
    if (data.status !== undefined) {
      updates.push("status = $status");
      params.$status = data.status;
    }
    if (data.priority !== undefined) {
      updates.push("priority = $priority");
      params.$priority = data.priority;
    }
    if (data.assignee_id !== undefined) {
      updates.push("assignee_id = $assignee_id");
      params.$assignee_id = data.assignee_id;
    }
    if (data.deadline !== undefined) {
      updates.push("deadline = $deadline");
      params.$deadline = data.deadline;
    }
    if (data.position !== undefined) {
      updates.push("position = $position");
      params.$position = data.position;
    }
    
    if (updates.length === 0) return this.findById(id);
    
    updates.push("updated_at = CURRENT_TIMESTAMP");
    
    const stmt = db.prepare(`UPDATE tasks SET ${updates.join(", ")} WHERE id = $id`);
    stmt.run(params as any);
    
    return this.findById(id);
  },

  delete(id: number): void {
    const stmt = db.prepare("DELETE FROM tasks WHERE id = $id");
    stmt.run({ $id: id });
  },

  // Get task with labels
  findByIdWithLabels(id: number): (Task & { labels: { id: number; name: string; color: string }[] }) | null {
    const task = this.findById(id);
    if (!task) return null;
    
    const labels = db.query(`
      SELECT l.id, l.name, l.color FROM labels l
      INNER JOIN task_labels tl ON l.id = tl.label_id
      WHERE tl.task_id = $task_id
    `).all({ $task_id: id }) as { id: number; name: string; color: string }[];
    
    return { ...task, labels };
  },
};
