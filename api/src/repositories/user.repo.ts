import { db, currentTimestamp } from "../db/client";
import type { User, NewUser, UserUpdate } from "../db/types";

export type { User };

export type UserCreate = Omit<NewUser, "id" | "created_at" | "updated_at" | "role"> & { role?: "admin" | "member" };

export const userRepo = {
  async create(data: UserCreate): Promise<User> {
    const result = await db
      .insertInto("users")
      .values({
        email: data.email,
        password_hash: data.password_hash,
        name: data.name,
        role: data.role || "member",
      })
      .returningAll()
      .executeTakeFirst();

    // For databases that don't support RETURNING (like MySQL)
    if (!result) {
      const lastId = await db
        .selectFrom("users")
        .select(db.fn.max("id").as("id"))
        .executeTakeFirst();
      return (await this.findById(lastId?.id ?? 0))!;
    }

    return result;
  },

  async findByEmail(email: string): Promise<User | null> {
    const result = await db
      .selectFrom("users")
      .selectAll()
      .where("email", "=", email)
      .executeTakeFirst();

    return result ?? null;
  },

  async findById(id: number): Promise<User | null> {
    const result = await db
      .selectFrom("users")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    return result ?? null;
  },

  async findAll(): Promise<User[]> {
    return await db.selectFrom("users").selectAll().execute();
  },
};
