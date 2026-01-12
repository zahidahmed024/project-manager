import { db } from "../db/client";

export interface BoardColumn {
  id: number;
  board_id: number;
  name: string;
  color: string;
  position: number;
}

export type BoardColumnCreate = Pick<BoardColumn, "board_id" | "name"> & {
  color?: string;
  position?: number;
};

export const columnRepo = {
  create(data: BoardColumnCreate): BoardColumn {
    // Get max position for this board
    const maxPos = db.query(
      "SELECT COALESCE(MAX(position), -1) as max_pos FROM board_columns WHERE board_id = $boardId"
    ).get({ $boardId: data.board_id }) as { max_pos: number };
    
    const position = data.position ?? maxPos.max_pos + 1;
    
    const stmt = db.prepare(`
      INSERT INTO board_columns (board_id, name, color, position)
      VALUES ($board_id, $name, $color, $position)
    `);
    stmt.run({
      $board_id: data.board_id,
      $name: data.name,
      $color: data.color || "#6b7280",
      $position: position,
    });
    
    const lastId = db.query("SELECT last_insert_rowid() as id").get() as { id: number };
    return this.findById(lastId.id)!;
  },

  findById(id: number): BoardColumn | null {
    const stmt = db.prepare("SELECT * FROM board_columns WHERE id = $id");
    return stmt.get({ $id: id }) as BoardColumn | null;
  },

  findByBoardId(boardId: number): BoardColumn[] {
    const stmt = db.prepare(
      "SELECT * FROM board_columns WHERE board_id = $boardId ORDER BY position ASC"
    );
    return stmt.all({ $boardId: boardId }) as BoardColumn[];
  },

  update(id: number, data: Partial<Pick<BoardColumn, "name" | "color">>): BoardColumn | null {
    const updates: string[] = [];
    const params: Record<string, unknown> = { $id: id };
    
    if (data.name !== undefined) {
      updates.push("name = $name");
      params.$name = data.name;
    }
    if (data.color !== undefined) {
      updates.push("color = $color");
      params.$color = data.color;
    }
    
    if (updates.length === 0) return this.findById(id);
    
    const stmt = db.prepare(`UPDATE board_columns SET ${updates.join(", ")} WHERE id = $id`);
    stmt.run(params as Parameters<typeof stmt.run>[0]);
    
    return this.findById(id);
  },

  delete(id: number): void {
    const stmt = db.prepare("DELETE FROM board_columns WHERE id = $id");
    stmt.run({ $id: id });
  },

  reorder(boardId: number, columnIds: number[]): void {
    columnIds.forEach((id, index) => {
      const stmt = db.prepare(
        "UPDATE board_columns SET position = $position WHERE id = $id AND board_id = $boardId"
      );
      stmt.run({ $position: index, $id: id, $boardId: boardId });
    });
  },

  // Create default columns for a new board
  createDefaults(boardId: number): BoardColumn[] {
    const defaults = [
      { name: "To Do", color: "#6b7280" },
      { name: "In Progress", color: "#f59e0b" },
      { name: "Done", color: "#10b981" },
    ];
    
    return defaults.map((col, index) => 
      this.create({ 
        board_id: boardId, 
        name: col.name, 
        color: col.color, 
        position: index 
      })
    );
  },
};
