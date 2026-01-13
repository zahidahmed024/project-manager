import { db, currentTimestamp } from "../db/client";
import type { Project, NewProject, ProjectMember, NewProjectMember } from "../db/types";

export type { Project, ProjectMember };

export type ProjectCreate = {
  name: string;
  key: string;
  description?: string;
  owner_id: number;
};

export const projectRepo = {
  async create(data: ProjectCreate): Promise<Project> {
    const result = await db
      .insertInto("projects")
      .values({
        name: data.name,
        key: data.key,
        description: data.description ?? null,
        owner_id: data.owner_id,
      })
      .returningAll()
      .executeTakeFirst();

    let project: Project;
    if (!result) {
      const lastId = await db
        .selectFrom("projects")
        .select(db.fn.max("id").as("id"))
        .executeTakeFirst();
      project = (await this.findById(lastId?.id ?? 0))!;
    } else {
      project = result;
    }

    // Add owner as admin member
    await this.addMember(project.id, data.owner_id, "admin");

    return project;
  },

  async findById(id: number): Promise<Project | null> {
    const result = await db
      .selectFrom("projects")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    return result ?? null;
  },

  async findByUserId(userId: number): Promise<Project[]> {
    return await db
      .selectFrom("projects as p")
      .innerJoin("project_members as pm", "p.id", "pm.project_id")
      .selectAll("p")
      .where("pm.user_id", "=", userId)
      .execute();
  },

  async findByKey(key: string): Promise<Project | null> {
    const result = await db
      .selectFrom("projects")
      .selectAll()
      .where("key", "=", key)
      .executeTakeFirst();

    return result ?? null;
  },

  async addMember(projectId: number, userId: number, role: "admin" | "member" = "member"): Promise<void> {
    // Use onConflict for SQLite/PostgreSQL, or ignore for MySQL
    await db
      .insertInto("project_members")
      .values({
        project_id: projectId,
        user_id: userId,
        role: role,
      })
      .onConflict((oc) => oc.doNothing())
      .execute();
  },

  async removeMember(projectId: number, userId: number): Promise<void> {
    await db
      .deleteFrom("project_members")
      .where("project_id", "=", projectId)
      .where("user_id", "=", userId)
      .execute();
  },

  async getMembers(projectId: number): Promise<(ProjectMember & { name: string; email: string })[]> {
    const members = await db
      .selectFrom("project_members as pm")
      .innerJoin("users as u", "pm.user_id", "u.id")
      .select([
        "pm.project_id",
        "pm.user_id",
        "pm.role",
        "u.name",
        "u.email",
      ])
      .where("pm.project_id", "=", projectId)
      .execute();

    return members;
  },

  async getMemberRole(projectId: number, userId: number): Promise<"admin" | "member" | null> {
    const result = await db
      .selectFrom("project_members")
      .select("role")
      .where("project_id", "=", projectId)
      .where("user_id", "=", userId)
      .executeTakeFirst();

    return (result?.role as "admin" | "member" | null) ?? null;
  },

  async update(id: number, data: Partial<Pick<Project, "name" | "description">>): Promise<Project | null> {
    if (Object.keys(data).length === 0) {
      return this.findById(id);
    }

    await db
      .updateTable("projects")
      .set({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .where("id", "=", id)
      .execute();

    return this.findById(id);
  },
};
