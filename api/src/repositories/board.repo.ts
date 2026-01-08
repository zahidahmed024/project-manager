import { db } from "../db/client";

export interface Board {
  id: number;
  project_id: number;
  name: string;
  created_at: string;
}

export type BoardCreate = Pick<Board, "project_id" | "name">;

export const boardRepo = {
  create(data: BoardCreate): Board {
    const stmt = db.prepare(`
      INSERT INTO boards (project_id, name)
      VALUES ($project_id, $name)
    `);
    stmt.run({
      $project_id: data.project_id,
      $name: data.name,
    });
    
    const lastId = db.query("SELECT last_insert_rowid() as id").get() as { id: number };
    return this.findById(lastId.id)!;
  },

  findById(id: number): Board | null {
    const stmt = db.prepare("SELECT * FROM boards WHERE id = $id");
    return stmt.get({ $id: id }) as Board | null;
  },

  findByProjectId(projectId: number): Board[] {
    const stmt = db.prepare("SELECT * FROM boards WHERE project_id = $project_id ORDER BY created_at");
    return stmt.all({ $project_id: projectId }) as Board[];
  },

  update(id: number, name: string): Board | null {
    const stmt = db.prepare("UPDATE boards SET name = $name WHERE id = $id");
    stmt.run({ $id: id, $name: name });
    return this.findById(id);
  },

  delete(id: number): void {
    const stmt = db.prepare("DELETE FROM boards WHERE id = $id");
    stmt.run({ $id: id });
  },
};
