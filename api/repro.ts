import { Database } from "bun:sqlite";

const db = new Database(":memory:");

// Initialize schema
db.run(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member'))
);

CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    key TEXT UNIQUE NOT NULL,
    description TEXT,
    owner_id INTEGER NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS boards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('issue', 'bugfix', 'story', 'subtask')),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'To Do',
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    assignee_id INTEGER,
    reporter_id INTEGER NOT NULL,
    parent_id INTEGER,
    deadline DATETIME,
    position INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (assignee_id) REFERENCES users(id),
    FOREIGN KEY (reporter_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE
);
`);

// Insert dummy data
db.run("INSERT INTO users (id, email, password_hash, name) VALUES (1, 'test@example.com', 'hash', 'Test User')");
db.run("INSERT INTO projects (id, name, key, owner_id) VALUES (1, 'Test Project', 'TEST', 1)");
db.run("INSERT INTO boards (id, project_id, name) VALUES (3, 1, 'Test Board')"); // ID 3 to match curl

const data = {
    board_id: 3,
    type: "issue",
    title: "test1",
    description: "test1",
    status: "backlog",
    priority: "medium",
    assignee_id: undefined,
    reporter_id: 1,
    parent_id: undefined,
    deadline: undefined
};

console.log("Running create logic...");

try {
    const maxPos = db.query(`
      SELECT COALESCE(MAX(position), -1) as pos FROM tasks WHERE board_id = $board_id
    `).get({ $board_id: data.board_id }) as { pos: number };
    
    console.log("Max pos:", maxPos);

    const stmt = db.prepare(`
      INSERT INTO tasks (board_id, type, title, description, status, priority, assignee_id, reporter_id, parent_id, deadline, position)
      VALUES ($board_id, $type, $title, $description, $status, $priority, $assignee_id, $reporter_id, $parent_id, $deadline, $position)
    `);

    stmt.run({
        $board_id: data.board_id,
        $type: data.type,
        $title: data.title,
        $description: data.description || null,
        $status: data.status || "todo",
        $priority: data.priority || "medium",
        $assignee_id: data.assignee_id || null,
        $reporter_id: data.reporter_id,
        $parent_id: data.parent_id || null,
        $deadline: data.deadline || null,
        $position: maxPos.pos + 1,
    });
    console.log("Success!");
} catch (e) {
    console.error("Error CAUGHT:", e);
}
