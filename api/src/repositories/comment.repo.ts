import { db } from "../db/client";

export interface Comment {
  id: number;
  task_id: number;
  author_id: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export type CommentCreate = Pick<Comment, "task_id" | "author_id" | "content">;

export const commentRepo = {
  create(data: CommentCreate): Comment {
    const stmt = db.prepare(`
      INSERT INTO comments (task_id, author_id, content)
      VALUES ($task_id, $author_id, $content)
    `);
    stmt.run({
      $task_id: data.task_id,
      $author_id: data.author_id,
      $content: data.content,
    });
    
    const lastId = db.query("SELECT last_insert_rowid() as id").get() as { id: number };
    return this.findById(lastId.id)!;
  },

  findById(id: number): Comment | null {
    const stmt = db.prepare("SELECT * FROM comments WHERE id = $id");
    return stmt.get({ $id: id }) as Comment | null;
  },

  findByTaskId(taskId: number): Comment[] {
    const stmt = db.prepare("SELECT * FROM comments WHERE task_id = $task_id ORDER BY created_at");
    return stmt.all({ $task_id: taskId }) as Comment[];
  },

  update(id: number, content: string): Comment | null {
    const stmt = db.prepare(`
      UPDATE comments SET content = $content, updated_at = CURRENT_TIMESTAMP WHERE id = $id
    `);
    stmt.run({ $id: id, $content: content });
    return this.findById(id);
  },

  delete(id: number): void {
    const stmt = db.prepare("DELETE FROM comments WHERE id = $id");
    stmt.run({ $id: id });
  },
};
