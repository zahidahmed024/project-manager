import { db } from "../db/client";

export interface Label {
  id: number;
  project_id: number;
  name: string;
  color: string;
}

export type LabelCreate = Pick<Label, "project_id" | "name"> & {
  color?: string;
};

export const labelRepo = {
  create(data: LabelCreate): Label {
    const stmt = db.prepare(`
      INSERT INTO labels (project_id, name, color)
      VALUES ($project_id, $name, $color)
    `);
    stmt.run({
      $project_id: data.project_id,
      $name: data.name,
      $color: data.color || "#6366f1",
    });
    
    const lastId = db.query("SELECT last_insert_rowid() as id").get() as { id: number };
    return this.findById(lastId.id)!;
  },

  findById(id: number): Label | null {
    const stmt = db.prepare("SELECT * FROM labels WHERE id = $id");
    return stmt.get({ $id: id }) as Label | null;
  },

  findByProjectId(projectId: number): Label[] {
    const stmt = db.prepare("SELECT * FROM labels WHERE project_id = $project_id ORDER BY name");
    return stmt.all({ $project_id: projectId }) as Label[];
  },

  addToTask(taskId: number, labelId: number): void {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO task_labels (task_id, label_id)
      VALUES ($task_id, $label_id)
    `);
    stmt.run({ $task_id: taskId, $label_id: labelId });
  },

  removeFromTask(taskId: number, labelId: number): void {
    const stmt = db.prepare(`
      DELETE FROM task_labels WHERE task_id = $task_id AND label_id = $label_id
    `);
    stmt.run({ $task_id: taskId, $label_id: labelId });
  },

  getTaskLabels(taskId: number): Label[] {
    const stmt = db.prepare(`
      SELECT l.* FROM labels l
      INNER JOIN task_labels tl ON l.id = tl.label_id
      WHERE tl.task_id = $task_id
    `);
    return stmt.all({ $task_id: taskId }) as Label[];
  },

  update(id: number, data: Partial<Pick<Label, "name" | "color">>): Label | null {
    const updates: string[] = [];
    const params: Record<string, string | number> = { $id: id };
    
    if (data.name !== undefined) {
      updates.push("name = $name");
      params.$name = data.name;
    }
    if (data.color !== undefined) {
      updates.push("color = $color");
      params.$color = data.color;
    }
    
    if (updates.length === 0) return this.findById(id);
    
    const stmt = db.prepare(`UPDATE labels SET ${updates.join(", ")} WHERE id = $id`);
    stmt.run(params);
    
    return this.findById(id);
  },

  delete(id: number): void {
    const stmt = db.prepare("DELETE FROM labels WHERE id = $id");
    stmt.run({ $id: id });
  },
};
