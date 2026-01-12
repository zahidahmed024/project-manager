import { db } from "./src/db/client";

console.log("🔄 Starting migration...");

// 1. Rename existing tasks table
console.log("1. Renaming tasks table...");
db.run("ALTER TABLE tasks RENAME TO tasks_old");

// 2. Create new tasks table without constraint
console.log("2. Creating new tasks table...");
db.run(`
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('issue', 'bugfix', 'story', 'subtask')),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo',
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
)
`);

// 3. Copy data
console.log("3. Copying data...");
// We need to handle potential data mismatches. 
// If old status was 'To Do', map it to 'todo'.
// If old status was 'In Progress', map it to 'in_progress'. 
// If old status was 'Done', map it to 'done'.
// However, the error message showed constraint "('todo', 'in_progress', 'done')", so the data likely already matches these values or violates it.
// The constraint was: status IN ('todo', 'in_progress', 'done')
// So we can just copy directly, but let's be safe.

db.run(`
    INSERT INTO tasks (
        id, board_id, type, title, description, status, priority, 
        assignee_id, reporter_id, parent_id, deadline, position, 
        created_at, updated_at
    )
    SELECT 
        id, board_id, type, title, description, status, priority, 
        assignee_id, reporter_id, parent_id, deadline, position, 
        created_at, updated_at
    FROM tasks_old
`);

// 4. Drop old table
console.log("4. Dropping old table...");
db.run("DROP TABLE tasks_old");

// Re-create indexes
console.log("5. Re-creating indexes...");
db.run("CREATE INDEX IF NOT EXISTS idx_tasks_board_id ON tasks(board_id)");
db.run("CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id)");
db.run("CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id)");

console.log("✅ Migration completed successfully!");
