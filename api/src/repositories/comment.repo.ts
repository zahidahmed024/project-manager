import { db } from "../db/client";
import type { Comment } from "../db/types";

export type { Comment };

export type CommentCreate = {
  task_id: number;
  author_id: number;
  content: string;
};

export const commentRepo = {
  async create(data: CommentCreate): Promise<Comment> {
    const result = await db
      .insertInto("comments")
      .values({
        task_id: data.task_id,
        author_id: data.author_id,
        content: data.content,
      })
      .returningAll()
      .executeTakeFirst();

    if (!result) {
      const lastId = await db
        .selectFrom("comments")
        .select(db.fn.max("id").as("id"))
        .executeTakeFirst();
      return (await this.findById(lastId?.id ?? 0))!;
    }

    return result;
  },

  async findById(id: number): Promise<Comment | null> {
    const result = await db
      .selectFrom("comments")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    return result ?? null;
  },

  async findByTaskId(taskId: number): Promise<Comment[]> {
    return await db
      .selectFrom("comments")
      .selectAll()
      .where("task_id", "=", taskId)
      .orderBy("created_at")
      .execute();
  },

  async update(id: number, content: string): Promise<Comment | null> {
    await db
      .updateTable("comments")
      .set({
        content,
        updated_at: new Date().toISOString(),
      })
      .where("id", "=", id)
      .execute();

    return this.findById(id);
  },

  async delete(id: number): Promise<void> {
    await db.deleteFrom("comments").where("id", "=", id).execute();
  },
};
