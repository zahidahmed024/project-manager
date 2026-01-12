import { db } from "../db/client";

export interface Project {
  id: number;
  name: string;
  key: string;
  description: string | null;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  project_id: number;
  user_id: number;
  role: "admin" | "member";
}

export type ProjectCreate = Pick<Project, "name" | "key" | "owner_id"> & {
  description?: string;
};

export const projectRepo = {
  create(data: ProjectCreate): Project {
    const stmt = db.prepare(`
      INSERT INTO projects (name, key, description, owner_id)
      VALUES ($name, $key, $description, $owner_id)
    `);
    stmt.run({
      $name: data.name,
      $key: data.key,
      $description: data.description || null,
      $owner_id: data.owner_id,
    });
    
    const lastId = db.query("SELECT last_insert_rowid() as id").get() as { id: number };
    const project = this.findById(lastId.id)!;
    
    // Add owner as admin member
    this.addMember(project.id, data.owner_id, "admin");
    
    return project;
  },

  findById(id: number): Project | null {
    const stmt = db.prepare("SELECT * FROM projects WHERE id = $id");
    return stmt.get({ $id: id }) as Project | null;
  },

  findByUserId(userId: number): Project[] {
    const stmt = db.prepare(`
      SELECT p.* FROM projects p
      INNER JOIN project_members pm ON p.id = pm.project_id
      WHERE pm.user_id = $userId
    `);
    return stmt.all({ $userId: userId }) as Project[];
  },

  findByKey(key: string): Project | null {
    const stmt = db.prepare("SELECT * FROM projects WHERE key = $key");
    return stmt.get({ $key: key }) as Project | null;
  },

  addMember(projectId: number, userId: number, role: "admin" | "member" = "member"): void {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO project_members (project_id, user_id, role)
      VALUES ($projectId, $userId, $role)
    `);
    stmt.run({ $projectId: projectId, $userId: userId, $role: role });
  },

  removeMember(projectId: number, userId: number): void {
    const stmt = db.prepare(`
      DELETE FROM project_members WHERE project_id = $projectId AND user_id = $userId
    `);
    stmt.run({ $projectId: projectId, $userId: userId });
  },

  getMembers(projectId: number): (ProjectMember & { name: string; email: string })[] {
    const stmt = db.prepare(`
      SELECT pm.project_id, pm.user_id, pm.role, u.name, u.email
      FROM project_members pm
      INNER JOIN users u ON pm.user_id = u.id
      WHERE pm.project_id = $projectId
    `);
    return stmt.all({ $projectId: projectId }) as (ProjectMember & { name: string; email: string })[];
  },

  getMemberRole(projectId: number, userId: number): "admin" | "member" | null {
    const stmt = db.prepare(`
      SELECT role FROM project_members WHERE project_id = $projectId AND user_id = $userId
    `);
    const result = stmt.get({ $projectId: projectId, $userId: userId }) as { role: string } | null;
    return result?.role as "admin" | "member" | null;
  },

  update(id: number, data: Partial<Pick<Project, "name" | "description">>): Project | null {
    const updates: string[] = [];
    const params: Record<string, unknown> = { $id: id };
    
    if (data.name !== undefined) {
      updates.push("name = $name");
      params.$name = data.name;
    }
    if (data.description !== undefined) {
      updates.push("description = $description");
      params.$description = data.description;
    }
    
    if (updates.length === 0) return this.findById(id);
    
    updates.push("updated_at = CURRENT_TIMESTAMP");
    
    const stmt = db.prepare(`UPDATE projects SET ${updates.join(", ")} WHERE id = $id`);
    stmt.run(params as Parameters<typeof stmt.run>[0]);
    
    return this.findById(id);
  },
};
