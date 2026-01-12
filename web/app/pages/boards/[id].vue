<script setup lang="ts">
import type { Task, BoardWithTasks, BoardColumn } from "~/composables/useBoards";
import type { CreateTaskData } from "~/composables/useTasks";

const route = useRoute();
const boardId = parseInt(route.params.id as string);

const { getBoard, createColumn, updateColumn, deleteColumn } = useBoards();
const { createTask, updateTask } = useTasks();
const { initAuth } = useAuth();

const boardData = ref<BoardWithTasks | null>(null);
const loading = ref(true);
const error = ref("");

// Task modal
const showTaskModal = ref(false);
const taskForm = reactive<CreateTaskData>({
  type: "issue",
  title: "",
  description: "",
  status: "To Do",
  priority: "medium",
});
const taskLoading = ref(false);

// Column modal
const showColumnModal = ref(false);
const columnForm = reactive({
  name: "",
  color: "#6b7280",
});
const columnLoading = ref(false);
const editingColumn = ref<BoardColumn | null>(null);

// Priority icon colors
const priorityColors = {
  high: "var(--color-priority-high)",
  medium: "var(--color-priority-medium)",
  low: "var(--color-priority-low)",
};

// Type icons
const typeLabels = {
  issue: "📋",
  bugfix: "🐛",
  story: "📖",
  subtask: "📌",
};

// Get columns from boardData
const columns = computed(() => boardData.value?.columns || []);

// Group tasks by column name (status)
const getTasksForColumn = (columnName: string) => {
  return (boardData.value?.tasks || []).filter(t => t.status === columnName);
};

const loadBoard = async () => {
  loading.value = true;
  error.value = "";
  try {
    await initAuth();
    boardData.value = await getBoard(boardId);
  } catch (e: any) {
    error.value = e.message || "Failed to load board";
  } finally {
    loading.value = false;
  }
};

const handleCreateTask = async () => {
  if (!taskForm.title.trim()) return;

  taskLoading.value = true;
  try {
    const task = await createTask(boardId, {
      type: taskForm.type,
      title: taskForm.title,
      description: taskForm.description,
      status: taskForm.status,
      priority: taskForm.priority,
    });
    boardData.value?.tasks.push(task);
    showTaskModal.value = false;
    resetTaskForm();
  } catch (e: any) {
    console.error(e);
  } finally {
    taskLoading.value = false;
  }
};

const resetTaskForm = () => {
  taskForm.type = "issue";
  taskForm.title = "";
  taskForm.description = "";
  taskForm.status = columns.value[0]?.name || "To Do";
  taskForm.priority = "medium";
};

const moveTask = async (droppedTask: Task | null, newStatus: string) => {
  if (!droppedTask || !boardData.value) return;
  
  const task = boardData.value.tasks.find(t => t.id === droppedTask.id);
  if (!task || task.status === newStatus) return;

  const oldStatus = task.status;
  task.status = newStatus;

  try {
    await updateTask(task.id, { status: newStatus });
  } catch (e) {
    task.status = oldStatus;
  }
};

const openTaskInColumn = (columnName: string) => {
  resetTaskForm();
  taskForm.status = columnName;
  showTaskModal.value = true;
};

// Column management
const openAddColumnModal = () => {
  editingColumn.value = null;
  columnForm.name = "";
  columnForm.color = "#6b7280";
  showColumnModal.value = true;
};

const openEditColumnModal = (column: BoardColumn) => {
  editingColumn.value = column;
  columnForm.name = column.name;
  columnForm.color = column.color;
  showColumnModal.value = true;
};

const handleSaveColumn = async () => {
  if (!columnForm.name.trim()) return;
  
  columnLoading.value = true;
  try {
    if (editingColumn.value) {
      // Update existing column
      const updated = await updateColumn(editingColumn.value.id, {
        name: columnForm.name,
        color: columnForm.color,
      });
      const idx = boardData.value?.columns.findIndex(c => c.id === editingColumn.value!.id);
      if (idx !== undefined && idx >= 0 && boardData.value) {
        boardData.value.columns[idx] = updated;
      }
    } else {
      // Create new column
      const column = await createColumn(boardId, columnForm.name, columnForm.color);
      boardData.value?.columns.push(column);
    }
    showColumnModal.value = false;
  } catch (e: any) {
    console.error(e);
  } finally {
    columnLoading.value = false;
  }
};

const handleDeleteColumn = async (column: BoardColumn) => {
  if (!confirm(`Delete column "${column.name}"? Tasks in this column will remain but may need reassignment.`)) return;
  
  try {
    await deleteColumn(column.id);
    if (boardData.value) {
      boardData.value.columns = boardData.value.columns.filter(c => c.id !== column.id);
    }
  } catch (e: any) {
    alert(e.message || "Failed to delete column");
  }
};

onMounted(loadBoard);
</script>

<template>
  <div class="board-page">
    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading board...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <NuxtLink to="/projects" class="btn btn-secondary"
        >Back to Projects</NuxtLink
      >
    </div>

    <!-- Board content -->
    <div v-else-if="boardData" class="board-content">
      <!-- Board header -->
      <div class="board-header">
        <h1 class="board-title">{{ boardData.board.name }}</h1>
        <button class="btn btn-primary" @click="showTaskModal = true">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Task
        </button>
      </div>

      <!-- Kanban columns -->
      <div class="kanban-board">
        <div
          v-for="column in columns"
          :key="column.id"
          class="kanban-column"
          @dragover.prevent
          @drop="
            moveTask(
              $event.dataTransfer?.getData('task')
                ? JSON.parse($event.dataTransfer.getData('task'))
                : null,
              column.name
            )
          "
        >
          <div class="column-header">
            <div
              class="column-indicator"
              :style="{ backgroundColor: column.color }"
            ></div>
            <h3 class="column-title">{{ column.name }}</h3>
            <span class="column-count">{{ getTasksForColumn(column.name).length }}</span>
            <div class="column-actions">
              <button class="btn btn-ghost btn-xs" @click="openEditColumnModal(column)" title="Edit column">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button class="btn btn-ghost btn-xs" @click="handleDeleteColumn(column)" title="Delete column">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          </div>

          <div class="column-content">
            <div
              v-for="task in getTasksForColumn(column.name)"
              :key="task.id"
              class="task-card"
              draggable="true"
              @dragstart="
                $event.dataTransfer?.setData('task', JSON.stringify(task))
              "
            >
              <div class="task-header">
                <span class="task-type">{{ typeLabels[task.type as keyof typeof typeLabels] }}</span>
                <span class="badge" :class="`badge-priority-${task.priority}`">
                  {{ task.priority }}
                </span>
              </div>
              <NuxtLink :to="`/tasks/${task.id}`" class="task-title">
                {{ task.title }}
              </NuxtLink>
              <div
                v-if="task.subtasks && task.subtasks.length > 0"
                class="task-subtasks"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="9 11 12 14 22 4" />
                  <path
                    d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"
                  />
                </svg>
                {{ task.subtasks.filter((s: Task) => s.status === "Done").length }}/{{
                  task.subtasks.length
                }}
              </div>
            </div>

            <!-- Add task button -->
            <button
              class="add-task-btn"
              @click="openTaskInColumn(column.name)"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add task
            </button>
          </div>
        </div>

        <!-- Add Column button -->
        <div class="add-column-btn" @click="openAddColumnModal">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Column
        </div>
      </div>
    </div>

    <!-- Create Task Modal -->
    <Teleport to="body">
      <div
        v-if="showTaskModal"
        class="modal-overlay"
        @click.self="showTaskModal = false"
      >
        <div class="modal modal-lg">
          <div class="modal-header">
            <h2>Create New Task</h2>
            <button class="btn btn-ghost" @click="showTaskModal = false">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="handleCreateTask" class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label for="taskType">Type</label>
                <select id="taskType" v-model="taskForm.type">
                  <option value="issue">📋 Issue</option>
                  <option value="bugfix">🐛 Bug</option>
                  <option value="story">📖 Story</option>
                </select>
              </div>

              <div class="form-group">
                <label for="taskPriority">Priority</label>
                <select id="taskPriority" v-model="taskForm.priority">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div class="form-group">
                <label for="taskStatus">Status</label>
                <select id="taskStatus" v-model="taskForm.status">
                  <option v-for="col in columns" :key="col.id" :value="col.name">{{ col.name }}</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="taskTitle">Title</label>
              <input
                id="taskTitle"
                v-model="taskForm.title"
                type="text"
                placeholder="What needs to be done?"
                required
              />
            </div>

            <div class="form-group">
              <label for="taskDescription">Description</label>
              <textarea
                id="taskDescription"
                v-model="taskForm.description"
                placeholder="Add more details..."
                rows="4"
              />
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                @click="showTaskModal = false"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="taskLoading"
              >
                <span v-if="taskLoading" class="spinner"></span>
                <span v-else>Create Task</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Column Modal -->
    <Teleport to="body">
      <div
        v-if="showColumnModal"
        class="modal-overlay"
        @click.self="showColumnModal = false"
      >
        <div class="modal">
          <div class="modal-header">
            <h2>{{ editingColumn ? 'Edit Column' : 'Add Column' }}</h2>
            <button class="btn btn-ghost" @click="showColumnModal = false">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <form @submit.prevent="handleSaveColumn" class="modal-body">
            <div class="form-group">
              <label for="columnName">Column Name</label>
              <input
                id="columnName"
                v-model="columnForm.name"
                type="text"
                placeholder="e.g., In Review, Deployed"
                required
              />
            </div>

            <div class="form-group">
              <label for="columnColor">Color</label>
              <input
                id="columnColor"
                v-model="columnForm.color"
                type="color"
                class="color-input"
              />
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="showColumnModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="columnLoading">
                <span v-if="columnLoading" class="spinner"></span>
                <span v-else>{{ editingColumn ? 'Save' : 'Add Column' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.board-page {
  height: calc(100vh - 64px - var(--space-6) * 2);
  display: flex;
  flex-direction: column;
}

.breadcrumb-link {
  color: var(--color-text-secondary);
}

.breadcrumb-link:hover {
  color: var(--color-accent);
}

.breadcrumb-sep {
  color: var(--color-text-muted);
  margin: 0 var(--space-2);
}

.board-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.board-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
}

.board-title {
  font-size: 1.5rem;
  font-weight: 600;
}

/* Kanban Board */
.kanban-board {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-4);
  min-height: 0;
  overflow-x: auto;
}

.kanban-column {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.column-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.column-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.column-title {
  flex: 1;
  font-size: 0.875rem;
  font-weight: 600;
}

.column-count {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  background-color: var(--color-bg-tertiary);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
}

.column-actions {
  display: flex;
  gap: var(--space-1);
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.column-header:hover .column-actions {
  opacity: 1;
}

.add-column-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  min-width: 200px;
  min-height: 200px;
  background-color: var(--color-bg-secondary);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 0.875rem;
}

.add-column-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background-color: var(--color-bg-tertiary);
}

.color-input {
  width: 60px;
  height: 40px;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.column-content {
  flex: 1;
  padding: var(--space-3);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* Task Card */
.task-card {
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  cursor: grab;
  transition: all var(--transition-fast);
}

.task-card:hover {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-md);
}

.task-card:active {
  cursor: grabbing;
}

.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.task-type {
  font-size: 1rem;
}

.task-title {
  display: block;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
  line-height: 1.4;
}

.task-title:hover {
  color: var(--color-accent);
}

.task-subtasks {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.add-task-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2);
  background: none;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: 0.875rem;
}

.add-task-btn:hover {
  background-color: var(--color-bg-hover);
  border-color: var(--color-text-muted);
  color: var(--color-text-primary);
}

/* States */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  padding: var(--space-12);
  color: var(--color-text-muted);
  text-align: center;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn var(--transition-fast) ease-out;
}

.modal {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 480px;
  box-shadow: var(--shadow-xl);
  animation: slideUp var(--transition-base) ease-out;
}

.modal-lg {
  max-width: 560px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  font-size: 1.125rem;
  font-weight: 600;
}

.modal-body {
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding-top: var(--space-4);
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}
</style>
