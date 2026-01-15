import type { Generated, Insertable, Selectable, Updateable } from "kysely";

// Users table
export interface UsersTable {
  id: Generated<number>;
  email: string;
  password_hash: string;
  name: string;
  role: "admin" | "member";
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

// Projects table
export interface ProjectsTable {
  id: Generated<number>;
  name: string;
  key: string;
  description: string | null;
  owner_id: number;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export type Project = Selectable<ProjectsTable>;
export type NewProject = Insertable<ProjectsTable>;
export type ProjectUpdate = Updateable<ProjectsTable>;

// Project members table
export interface ProjectMembersTable {
  project_id: number;
  user_id: number;
  role: "admin" | "member";
}

export type ProjectMember = Selectable<ProjectMembersTable>;
export type NewProjectMember = Insertable<ProjectMembersTable>;

// Boards table
export interface BoardsTable {
  id: Generated<number>;
  project_id: number;
  name: string;
  created_at: Generated<string>;
}

export type Board = Selectable<BoardsTable>;
export type NewBoard = Insertable<BoardsTable>;
export type BoardUpdate = Updateable<BoardsTable>;

// Board columns table
export interface BoardColumnsTable {
  id: Generated<number>;
  board_id: number;
  name: string;
  color: string;
  position: number;
}

export type BoardColumn = Selectable<BoardColumnsTable>;
export type NewBoardColumn = Insertable<BoardColumnsTable>;
export type BoardColumnUpdate = Updateable<BoardColumnsTable>;

// Tasks table
export interface TasksTable {
  id: Generated<number>;
  board_id: number;
  type: "issue" | "bugfix" | "story" | "subtask";
  title: string;
  description: string | null;
  status: string;
  priority: "high" | "medium" | "low";
  assignee_id: number | null;
  reporter_id: number;
  parent_id: number | null;
  deadline: string | null;
  time_spent: number | null;
  position: number;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export type Task = Selectable<TasksTable>;
export type NewTask = Insertable<TasksTable>;
export type TaskUpdate = Updateable<TasksTable>;

// Labels table
export interface LabelsTable {
  id: Generated<number>;
  project_id: number;
  name: string;
  color: string;
}

export type Label = Selectable<LabelsTable>;
export type NewLabel = Insertable<LabelsTable>;
export type LabelUpdate = Updateable<LabelsTable>;

// Task labels table (many-to-many)
export interface TaskLabelsTable {
  task_id: number;
  label_id: number;
}

export type TaskLabel = Selectable<TaskLabelsTable>;
export type NewTaskLabel = Insertable<TaskLabelsTable>;

// Comments table
export interface CommentsTable {
  id: Generated<number>;
  task_id: number;
  author_id: number;
  content: string;
  created_at: Generated<string>;
  updated_at: Generated<string>;
}

export type Comment = Selectable<CommentsTable>;
export type NewComment = Insertable<CommentsTable>;
export type CommentUpdate = Updateable<CommentsTable>;

// Database schema
export interface Database {
  users: UsersTable;
  projects: ProjectsTable;
  project_members: ProjectMembersTable;
  boards: BoardsTable;
  board_columns: BoardColumnsTable;
  tasks: TasksTable;
  labels: LabelsTable;
  task_labels: TaskLabelsTable;
  comments: CommentsTable;
}
