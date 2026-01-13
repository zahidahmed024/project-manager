import { db } from "../db/client";
import type { Label } from "../db/types";

export type { Label };

export type LabelCreate = {
  project_id: number;
  name: string;
  color?: string;
};

export const labelRepo = {
  async create(data: LabelCreate): Promise<Label> {
    const result = await db
      .insertInto("labels")
      .values({
        project_id: data.project_id,
        name: data.name,
        color: data.color || "#6366f1",
      })
      .returningAll()
      .executeTakeFirst();

    if (!result) {
      const lastId = await db
        .selectFrom("labels")
        .select(db.fn.max("id").as("id"))
        .executeTakeFirst();
      return (await this.findById(lastId?.id ?? 0))!;
    }

    return result;
  },

  async findById(id: number): Promise<Label | null> {
    const result = await db
      .selectFrom("labels")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    return result ?? null;
  },

  async findByProjectId(projectId: number): Promise<Label[]> {
    return await db
      .selectFrom("labels")
      .selectAll()
      .where("project_id", "=", projectId)
      .orderBy("name")
      .execute();
  },

  async addToTask(taskId: number, labelId: number): Promise<void> {
    await db
      .insertInto("task_labels")
      .values({
        task_id: taskId,
        label_id: labelId,
      })
      .onConflict((oc) => oc.doNothing())
      .execute();
  },

  async removeFromTask(taskId: number, labelId: number): Promise<void> {
    await db
      .deleteFrom("task_labels")
      .where("task_id", "=", taskId)
      .where("label_id", "=", labelId)
      .execute();
  },

  async getTaskLabels(taskId: number): Promise<Label[]> {
    return await db
      .selectFrom("labels as l")
      .innerJoin("task_labels as tl", "l.id", "tl.label_id")
      .selectAll("l")
      .where("tl.task_id", "=", taskId)
      .execute();
  },

  async update(id: number, data: Partial<Pick<Label, "name" | "color">>): Promise<Label | null> {
    if (Object.keys(data).length === 0) {
      return this.findById(id);
    }

    await db
      .updateTable("labels")
      .set(data)
      .where("id", "=", id)
      .execute();

    return this.findById(id);
  },

  async delete(id: number): Promise<void> {
    await db.deleteFrom("labels").where("id", "=", id).execute();
  },
};
