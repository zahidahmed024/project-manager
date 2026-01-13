import { db } from "../db/client";
import type { Board } from "../db/types";
import { columnRepo } from "./column.repo";

export type { Board };

export type BoardCreate = {
  project_id: number;
  name: string;
};

export const boardRepo = {
  async create(data: BoardCreate): Promise<Board> {
    const result = await db
      .insertInto("boards")
      .values({
        project_id: data.project_id,
        name: data.name,
      })
      .returningAll()
      .executeTakeFirst();

    let board: Board;
    if (!result) {
      const lastId = await db
        .selectFrom("boards")
        .select(db.fn.max("id").as("id"))
        .executeTakeFirst();
      board = (await this.findById(lastId?.id ?? 0))!;
    } else {
      board = result;
    }

    // Create default columns for the new board
    await columnRepo.createDefaults(board.id);

    return board;
  },

  async findById(id: number): Promise<Board | null> {
    const result = await db
      .selectFrom("boards")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    return result ?? null;
  },

  async findByProjectId(projectId: number): Promise<Board[]> {
    return await db
      .selectFrom("boards")
      .selectAll()
      .where("project_id", "=", projectId)
      .orderBy("created_at")
      .execute();
  },

  async update(id: number, name: string): Promise<Board | null> {
    await db
      .updateTable("boards")
      .set({ name })
      .where("id", "=", id)
      .execute();

    return this.findById(id);
  },

  async delete(id: number): Promise<void> {
    await db.deleteFrom("boards").where("id", "=", id).execute();
  },
};
