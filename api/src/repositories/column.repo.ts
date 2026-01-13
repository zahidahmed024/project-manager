import { db } from "../db/client";
import type { BoardColumn } from "../db/types";

export type { BoardColumn };

export type BoardColumnCreate = {
  board_id: number;
  name: string;
  color?: string;
  position?: number;
};

export const columnRepo = {
  async create(data: BoardColumnCreate): Promise<BoardColumn> {
    // Get max position for this board
    const maxPosResult = await db
      .selectFrom("board_columns")
      .select(db.fn.max("position").as("max_pos"))
      .where("board_id", "=", data.board_id)
      .executeTakeFirst();

    const position = data.position ?? ((maxPosResult?.max_pos ?? -1) + 1);

    const result = await db
      .insertInto("board_columns")
      .values({
        board_id: data.board_id,
        name: data.name,
        color: data.color || "#6b7280",
        position: position,
      })
      .returningAll()
      .executeTakeFirst();

    if (!result) {
      const lastId = await db
        .selectFrom("board_columns")
        .select(db.fn.max("id").as("id"))
        .executeTakeFirst();
      return (await this.findById(lastId?.id ?? 0))!;
    }

    return result;
  },

  async findById(id: number): Promise<BoardColumn | null> {
    const result = await db
      .selectFrom("board_columns")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    return result ?? null;
  },

  async findByBoardId(boardId: number): Promise<BoardColumn[]> {
    return await db
      .selectFrom("board_columns")
      .selectAll()
      .where("board_id", "=", boardId)
      .orderBy("position", "asc")
      .execute();
  },

  async update(id: number, data: Partial<Pick<BoardColumn, "name" | "color">>): Promise<BoardColumn | null> {
    if (Object.keys(data).length === 0) {
      return this.findById(id);
    }

    await db
      .updateTable("board_columns")
      .set(data)
      .where("id", "=", id)
      .execute();

    return this.findById(id);
  },

  async delete(id: number): Promise<void> {
    await db.deleteFrom("board_columns").where("id", "=", id).execute();
  },

  async reorder(boardId: number, columnIds: number[]): Promise<void> {
    for (let index = 0; index < columnIds.length; index++) {
      const columnId = columnIds[index]!;
      await db
        .updateTable("board_columns")
        .set({ position: index })
        .where("id", "=", columnId)
        .where("board_id", "=", boardId)
        .execute();
    }
  },

  // Create default columns for a new board
  async createDefaults(boardId: number): Promise<BoardColumn[]> {
    const defaults = [
      { name: "To Do", color: "#6b7280" },
      { name: "In Progress", color: "#f59e0b" },
      { name: "Done", color: "#10b981" },
    ];

    const columns: BoardColumn[] = [];
    for (let i = 0; i < defaults.length; i++) {
      const defaultCol = defaults[i]!;
      const col = await this.create({
        board_id: boardId,
        name: defaultCol.name,
        color: defaultCol.color,
        position: i,
      });
      columns.push(col);
    }

    return columns;
  },
};
