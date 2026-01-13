import { db } from "../db/client";
import type { Task } from "../db/types";

export type { Task };

export type TaskType = "issue" | "bugfix" | "story" | "subtask";
export type TaskStatus = string;
export type TaskPriority = "high" | "medium" | "low";

export type TaskCreate = {
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
};

export type TaskUpdate = {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee_id?: number | null;
  deadline?: string | null;
  position?: number;
};

export const taskRepo = {
  async create(data: TaskCreate): Promise<Task> {
    // Get max position for the board
    const maxPosResult = await db
      .selectFrom("tasks")
      .select(db.fn.max("position").as("pos"))
      .where("board_id", "=", data.board_id)
      .executeTakeFirst();

    const position = (maxPosResult?.pos ?? -1) + 1;

    const result = await db
      .insertInto("tasks")
      .values({
        board_id: data.board_id,
        type: data.type,
        title: data.title,
        description: data.description ?? null,
        status: data.status || "todo",
        priority: data.priority || "medium",
        assignee_id: data.assignee_id ?? null,
        reporter_id: data.reporter_id,
        parent_id: data.parent_id ?? null,
        deadline: data.deadline ?? null,
        position: position,
      })
      .returningAll()
      .executeTakeFirst();

    if (!result) {
      const lastId = await db
        .selectFrom("tasks")
        .select(db.fn.max("id").as("id"))
        .executeTakeFirst();
      return (await this.findById(lastId?.id ?? 0))!;
    }

    return result;
  },

  async findById(id: number): Promise<Task | null> {
    const result = await db
      .selectFrom("tasks")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    return result ?? null;
  },

  async findByBoardId(boardId: number): Promise<Task[]> {
    return await db
      .selectFrom("tasks")
      .selectAll()
      .where("board_id", "=", boardId)
      .where("parent_id", "is", null)
      .orderBy("position")
      .execute();
  },

  async getSubtasks(parentId: number): Promise<Task[]> {
    return await db
      .selectFrom("tasks")
      .selectAll()
      .where("parent_id", "=", parentId)
      .orderBy("position")
      .execute();
  },

  async update(id: number, data: TaskUpdate): Promise<Task | null> {
    if (Object.keys(data).length === 0) {
      return this.findById(id);
    }

    await db
      .updateTable("tasks")
      .set({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .where("id", "=", id)
      .execute();

    return this.findById(id);
  },

  async delete(id: number): Promise<void> {
    await db.deleteFrom("tasks").where("id", "=", id).execute();
  },

  // Get task with labels
  async findByIdWithLabels(id: number): Promise<(Task & { labels: { id: number; name: string; color: string }[] }) | null> {
    const task = await this.findById(id);
    if (!task) return null;

    const labels = await db
      .selectFrom("labels as l")
      .innerJoin("task_labels as tl", "l.id", "tl.label_id")
      .select(["l.id", "l.name", "l.color"])
      .where("tl.task_id", "=", id)
      .execute();

    return { ...task, labels };
  },
};
