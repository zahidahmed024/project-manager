import { db } from "../db/client";

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: "admin" | "member";
  created_at: string;
  updated_at: string;
}

export type UserCreate = Pick<User, "email" | "password_hash" | "name"> & {
  role?: User["role"];
};

export const userRepo = {
  create(data: UserCreate): User {
    const stmt = db.prepare(`
      INSERT INTO users (email, password_hash, name, role)
      VALUES ($email, $password_hash, $name, $role)
    `);
    stmt.run({
      $email: data.email,
      $password_hash: data.password_hash,
      $name: data.name,
      $role: data.role || "member",
    });
    
    const lastId = db.query("SELECT last_insert_rowid() as id").get() as { id: number };
    return this.findById(lastId.id)!;
  },

  findByEmail(email: string): User | null {
    const stmt = db.prepare("SELECT * FROM users WHERE email = $email");
    return stmt.get({ $email: email }) as User | null;
  },

  findById(id: number): User | null {
    const stmt = db.prepare("SELECT * FROM users WHERE id = $id");
    return stmt.get({ $id: id }) as User | null;
  },

  findAll(): User[] {
    return db.query("SELECT * FROM users").all() as User[];
  },
};
