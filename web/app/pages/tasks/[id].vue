<script setup lang="ts">
import type { TaskDetail, Comment } from "~/composables/useTasks";
import type { Task } from "~/composables/useBoards";

const route = useRoute();
const taskId = parseInt(route.params.id as string);

const { getTask, updateTask, addComment, createSubtask } = useTasks();
const { initAuth, user } = useAuth();

const taskData = ref<TaskDetail | null>(null);
const loading = ref(true);
const error = ref("");

// Edit mode
const isEditing = ref(false);
const editForm = reactive({
  title: "",
  description: "",
  status: "todo" as "todo" | "in_progress" | "done",
  priority: "medium" as "high" | "medium" | "low",
});

// Comment
const newComment = ref("");
const addingComment = ref(false);

// Subtask
const showSubtaskForm = ref(false);
const newSubtaskTitle = ref("");
const addingSubtask = ref(false);

const priorityColors = {
  high: "badge-priority-high",
  medium: "badge-priority-medium",
  low: "badge-priority-low",
};

const statusColors = {
  todo: "badge-status-todo",
  in_progress: "badge-status-in-progress",
  done: "badge-status-done",
};

const typeLabels = {
  issue: "📋 Issue",
  bugfix: "🐛 Bug",
  story: "📖 Story",
  subtask: "📌 Subtask",
};

const loadTask = async () => {
  loading.value = true;
  error.value = "";
  try {
    await initAuth();
    taskData.value = await getTask(taskId);
  } catch (e: any) {
    error.value = e.message || "Failed to load task";
  } finally {
    loading.value = false;
  }
};

const startEditing = () => {
  if (taskData.value) {
    editForm.title = taskData.value.task.title;
    editForm.description = taskData.value.task.description || "";
    editForm.status = taskData.value.task.status;
    editForm.priority = taskData.value.task.priority;
    isEditing.value = true;
  }
};

const saveChanges = async () => {
  if (!taskData.value) return;

  try {
    const updated = await updateTask(taskId, {
      title: editForm.title,
      description: editForm.description,
      status: editForm.status,
      priority: editForm.priority,
    });
    taskData.value.task = { ...taskData.value.task, ...updated };
    isEditing.value = false;
  } catch (e: any) {
    console.error(e);
  }
};

const handleAddComment = async () => {
  if (!newComment.value.trim()) return;

  addingComment.value = true;
  try {
    const comment = await addComment(taskId, newComment.value);
    taskData.value?.comments.push(comment);
    newComment.value = "";
  } catch (e: any) {
    console.error(e);
  } finally {
    addingComment.value = false;
  }
};

const handleAddSubtask = async () => {
  if (!newSubtaskTitle.value.trim()) return;

  addingSubtask.value = true;
  try {
    const subtask = await createSubtask(taskId, {
      title: newSubtaskTitle.value,
      status: "todo",
      priority: "medium",
    });
    taskData.value?.subtasks.push(subtask);
    newSubtaskTitle.value = "";
    showSubtaskForm.value = false;
  } catch (e: any) {
    console.error(e);
  } finally {
    addingSubtask.value = false;
  }
};

const toggleSubtask = async (subtask: Task) => {
  const newStatus = subtask.status === "done" ? "todo" : "done";
  subtask.status = newStatus;
  try {
    await updateTask(subtask.id, { status: newStatus });
  } catch (e) {
    subtask.status = subtask.status === "done" ? "todo" : "done";
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

onMounted(loadTask);
</script>

<template>
  <div class="task-page">
    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading task...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn btn-secondary" @click="$router.back()">Go Back</button>
    </div>

    <!-- Task content -->
    <div v-else-if="taskData" class="task-content">
      <!-- Task header -->
      <div class="task-header">
        <button class="btn btn-ghost" @click="$router.back()">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back
        </button>
        <div class="task-actions">
          <button
            v-if="!isEditing"
            class="btn btn-secondary"
            @click="startEditing"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
              />
              <path
                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
              />
            </svg>
            Edit
          </button>
        </div>
      </div>

      <div class="task-layout">
        <!-- Main content -->
        <div class="task-main">
          <!-- Type badge -->
          <span class="task-type-badge">{{
            typeLabels[taskData.task.type]
          }}</span>

          <!-- Title -->
          <div v-if="isEditing" class="form-group">
            <input v-model="editForm.title" type="text" class="title-input" />
          </div>
          <h1 v-else class="task-title">{{ taskData.task.title }}</h1>

          <!-- Description -->
          <div class="task-section">
            <h3 class="section-label">Description</h3>
            <div v-if="isEditing" class="form-group">
              <textarea
                v-model="editForm.description"
                rows="4"
                placeholder="Add a description..."
              />
            </div>
            <p v-else-if="taskData.task.description" class="task-description">
              {{ taskData.task.description }}
            </p>
            <p v-else class="text-muted">No description provided</p>
          </div>

          <!-- Subtasks -->
          <div class="task-section">
            <div class="section-header">
              <h3 class="section-label">Subtasks</h3>
              <button
                class="btn btn-ghost btn-sm"
                @click="showSubtaskForm = !showSubtaskForm"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add
              </button>
            </div>

            <div v-if="showSubtaskForm" class="subtask-form">
              <input
                v-model="newSubtaskTitle"
                type="text"
                placeholder="Subtask title..."
                @keyup.enter="handleAddSubtask"
              />
              <button
                class="btn btn-primary btn-sm"
                @click="handleAddSubtask"
                :disabled="addingSubtask"
              >
                {{ addingSubtask ? "..." : "Add" }}
              </button>
            </div>

            <div v-if="taskData.subtasks.length === 0" class="empty-section">
              No subtasks yet
            </div>
            <div v-else class="subtasks-list">
              <div
                v-for="subtask in taskData.subtasks"
                :key="subtask.id"
                class="subtask-item"
                :class="{ completed: subtask.status === 'done' }"
              >
                <button
                  class="subtask-checkbox"
                  @click.stop="toggleSubtask(subtask)"
                >
                  <svg
                    v-if="subtask.status === 'done'"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
                    />
                  </svg>
                </button>
                <NuxtLink 
                  :to="`/tasks/${subtask.id}`" 
                  class="subtask-link"
                >
                  <span class="subtask-title">{{ subtask.title }}</span>
                  <span 
                    class="badge subtask-badge" 
                    :class="priorityColors[subtask.priority]"
                  >
                    {{ subtask.priority }}
                  </span>
                </NuxtLink>
              </div>
            </div>
          </div>

          <!-- Comments -->
          <div class="task-section">
            <h3 class="section-label">Comments</h3>

            <div class="comment-form">
              <div class="comment-avatar">
                {{ user?.name?.charAt(0).toUpperCase() }}
              </div>
              <div class="comment-input-wrapper">
                <textarea
                  v-model="newComment"
                  placeholder="Add a comment..."
                  rows="2"
                />
                <button
                  class="btn btn-primary btn-sm"
                  @click="handleAddComment"
                  :disabled="addingComment || !newComment.trim()"
                >
                  {{ addingComment ? "..." : "Send" }}
                </button>
              </div>
            </div>

            <div v-if="taskData.comments.length === 0" class="empty-section">
              No comments yet
            </div>
            <div v-else class="comments-list">
              <div
                v-for="comment in taskData.comments"
                :key="comment.id"
                class="comment-item"
              >
                <div class="comment-avatar">
                  {{ comment.author_name?.charAt(0).toUpperCase() || "?" }}
                </div>
                <div class="comment-content">
                  <div class="comment-header">
                    <span class="comment-author">{{
                      comment.author_name || "Unknown"
                    }}</span>
                    <span class="comment-date">{{
                      formatDate(comment.created_at)
                    }}</span>
                  </div>
                  <p class="comment-text">{{ comment.content }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <aside class="task-sidebar">
          <div class="sidebar-section">
            <h4 class="sidebar-label">Status</h4>
            <select v-if="isEditing" v-model="editForm.status">
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <span
              v-else
              class="badge"
              :class="statusColors[taskData.task.status]"
            >
              {{ taskData.task.status.replace("_", " ") }}
            </span>
          </div>

          <div class="sidebar-section">
            <h4 class="sidebar-label">Priority</h4>
            <select v-if="isEditing" v-model="editForm.priority">
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <span
              v-else
              class="badge"
              :class="priorityColors[taskData.task.priority]"
            >
              {{ taskData.task.priority }}
            </span>
          </div>

          <div class="sidebar-section">
            <h4 class="sidebar-label">Created</h4>
            <span class="text-secondary text-sm">{{
              formatDate(taskData.task.created_at)
            }}</span>
          </div>

          <div v-if="isEditing" class="sidebar-actions">
            <button class="btn btn-primary w-full" @click="saveChanges">
              Save Changes
            </button>
            <button class="btn btn-secondary w-full" @click="isEditing = false">
              Cancel
            </button>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-page {
  max-width: 1000px;
  margin: 0 auto;
}

.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
}

.task-layout {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: var(--space-6);
}

.task-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.task-type-badge {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.task-title {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.3;
}

.title-input {
  font-size: 1.5rem;
  font-weight: 600;
}

.task-description {
  color: var(--color-text-secondary);
  line-height: 1.6;
  white-space: pre-wrap;
}

.task-section {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.section-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-3);
}

.section-header .section-label {
  margin-bottom: 0;
}

.empty-section {
  color: var(--color-text-muted);
  font-size: 0.875rem;
  padding: var(--space-4);
  text-align: center;
}

/* Subtasks */
.subtask-form {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.subtasks-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.subtask-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
}

.subtask-item.completed .subtask-title {
  text-decoration: line-through;
  color: var(--color-text-muted);
}

.subtask-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-success);
}

.subtask-item.completed .subtask-checkbox {
  background-color: var(--color-success);
  border-color: var(--color-success);
  color: white;
}

.subtask-link {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  color: inherit;
  text-decoration: none;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  transition: background-color var(--transition-fast);
}

.subtask-link:hover {
  background-color: var(--color-bg-tertiary);
  color: var(--color-accent);
}

.subtask-badge {
  font-size: 0.65rem;
  padding: 2px 6px;
}

.subtask-item:hover {
  background-color: var(--color-bg-secondary);
}

/* Comments */
.comment-form {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.comment-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(
    135deg,
    var(--color-accent) 0%,
    var(--color-accent-emphasis) 100%
  );
  color: white;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.comment-input-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: flex-end;
}

.comment-input-wrapper textarea {
  width: 100%;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.comment-item {
  display: flex;
  gap: var(--space-3);
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-1);
}

.comment-author {
  font-weight: 500;
  font-size: 0.875rem;
}

.comment-date {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.comment-text {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  line-height: 1.5;
}

/* Sidebar */
.task-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.sidebar-section {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}

.sidebar-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted);
  text-transform: uppercase;
  margin-bottom: var(--space-2);
}

.sidebar-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
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

.form-group {
  display: flex;
  flex-direction: column;
}
</style>
