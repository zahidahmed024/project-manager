<script setup lang="ts">
import type { ProjectDetail, ProjectMember } from "~/composables/useProjects";

interface UserOption {
  id: number;
  email: string;
  name: string;
}

const route = useRoute();
const projectId = parseInt(route.params.id as string);

const { getProject, addMember, removeMember } = useProjects();
const { createBoard } = useBoards();
const { initAuth } = useAuth();
const api = useApi();

const project = ref<ProjectDetail | null>(null);
const loading = ref(true);
const error = ref("");

// Create board modal
const showCreateBoard = ref(false);
const newBoardName = ref("");
const createLoading = ref(false);

// Add member modal
const showAddMember = ref(false);
const allUsers = ref<UserOption[]>([]);
const selectedUserId = ref<number | null>(null);
const selectedRole = ref<"admin" | "member">("member");
const addMemberLoading = ref(false);

// Available users (not already members)
const availableUsers = computed(() => {
  const memberIds = project.value?.members.map(m => m.user_id) || [];
  return allUsers.value.filter(u => !memberIds.includes(u.id));
});

const loadProject = async () => {
  loading.value = true;
  error.value = "";
  try {
    await initAuth();
    project.value = await getProject(projectId);
  } catch (e: any) {
    error.value = e.message || "Failed to load project";
  } finally {
    loading.value = false;
  }
};

const loadUsers = async () => {
  try {
    const response = await api.get<{ users: UserOption[] }>("/auth/users");
    allUsers.value = response.users;
  } catch (e) {
    console.error("Failed to load users:", e);
  }
};

const handleCreateBoard = async () => {
  if (!newBoardName.value.trim()) return;

  createLoading.value = true;
  try {
    const board = await createBoard(projectId, newBoardName.value);
    project.value?.boards.push(board);
    showCreateBoard.value = false;
    newBoardName.value = "";
  } catch (e: any) {
    console.error(e);
  } finally {
    createLoading.value = false;
  }
};

const openAddMemberModal = async () => {
  showAddMember.value = true;
  selectedUserId.value = null;
  selectedRole.value = "member";
  if (allUsers.value.length === 0) {
    await loadUsers();
  }
};

const handleAddMember = async () => {
  if (!selectedUserId.value) return;

  addMemberLoading.value = true;
  try {
    await addMember(projectId, selectedUserId.value, selectedRole.value);
    // Add the new member to the local list
    const addedUser = allUsers.value.find(u => u.id === selectedUserId.value);
    if (addedUser && project.value) {
      project.value.members.push({
        user_id: addedUser.id,
        name: addedUser.name,
        email: addedUser.email,
        role: selectedRole.value,
      });
    }
    showAddMember.value = false;
    selectedUserId.value = null;
  } catch (e: any) {
    console.error(e);
  } finally {
    addMemberLoading.value = false;
  }
};

const handleRemoveMember = async (member: ProjectMember) => {
  if (!confirm(`Remove ${member.name} from this project?`)) return;
  
  try {
    await removeMember(projectId, member.user_id);
    if (project.value) {
      project.value.members = project.value.members.filter(
        m => m.user_id !== member.user_id
      );
    }
  } catch (e: any) {
    console.error(e);
    alert(e.message || "Failed to remove member");
  }
};

onMounted(loadProject);
</script>

<template>
  <div>
    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading project...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <NuxtLink to="/projects" class="btn btn-secondary"
        >Back to Projects</NuxtLink
      >
    </div>

    <!-- Project content -->
    <div v-else-if="project" class="project-content">
      <!-- Project header -->
      <div class="project-header">
        <div class="project-icon">
          {{ project.key.charAt(0) }}
        </div>
        <div class="project-meta">
          <h1 class="project-title">{{ project.name }}</h1>
          <span class="project-key badge">{{ project.key }}</span>
        </div>
      </div>

      <p v-if="project.description" class="project-description">
        {{ project.description }}
      </p>

      <!-- Boards section -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Boards</h2>
          <button
            class="btn btn-secondary btn-sm"
            @click="showCreateBoard = true"
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
            Add Board
          </button>
        </div>

        <div v-if="project.boards.length === 0" class="empty-section">
          <p>No boards yet. Create one to start organizing tasks.</p>
        </div>

        <div v-else class="boards-grid">
          <NuxtLink
            v-for="board in project.boards"
            :key="board.id"
            :to="`/boards/${board.id}`"
            class="board-card card card-clickable"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
            <span class="board-name">{{ board.name }}</span>
          </NuxtLink>
        </div>
      </section>

      <!-- Members section -->
      <section class="section">
        <div class="section-header">
          <h2 class="section-title">Team Members</h2>
          <button
            class="btn btn-secondary btn-sm"
            @click="openAddMemberModal"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            Add Member
          </button>
        </div>

        <div class="members-list">
          <div
            v-for="member in project.members"
            :key="member.user_id"
            class="member-item"
          >
            <div class="member-avatar">
              {{ member.name.charAt(0).toUpperCase() }}
            </div>
            <div class="member-info">
              <span class="member-name">{{ member.name }}</span>
              <span class="member-email">{{ member.email }}</span>
            </div>
            <span
              class="badge"
              :class="member.role === 'admin' ? 'badge-priority-high' : ''"
            >
              {{ member.role }}
            </span>
            <button
              v-if="member.user_id !== project.owner_id"
              class="btn btn-ghost btn-sm member-remove"
              @click="handleRemoveMember(member)"
              title="Remove member"
            >
              <svg
                width="16"
                height="16"
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
        </div>
      </section>

      <!-- Labels section -->
      <section v-if="project.labels.length > 0" class="section">
        <div class="section-header">
          <h2 class="section-title">Labels</h2>
        </div>

        <div class="labels-list">
          <span
            v-for="label in project.labels"
            :key="label.id"
            class="label-badge"
            :style="{ backgroundColor: label.color + '26', color: label.color }"
          >
            {{ label.name }}
          </span>
        </div>
      </section>
    </div>

    <!-- Create Board Modal -->
    <Teleport to="body">
      <div
        v-if="showCreateBoard"
        class="modal-overlay"
        @click.self="showCreateBoard = false"
      >
        <div class="modal">
          <div class="modal-header">
            <h2>Create New Board</h2>
            <button class="btn btn-ghost" @click="showCreateBoard = false">
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

          <form @submit.prevent="handleCreateBoard" class="modal-body">
            <div class="form-group">
              <label for="boardName">Board Name</label>
              <input
                id="boardName"
                v-model="newBoardName"
                type="text"
                placeholder="Sprint 1"
                required
              />
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                @click="showCreateBoard = false"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="createLoading"
              >
                <span v-if="createLoading" class="spinner"></span>
                <span v-else>Create Board</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Add Member Modal -->
    <Teleport to="body">
      <div
        v-if="showAddMember"
        class="modal-overlay"
        @click.self="showAddMember = false"
      >
        <div class="modal">
          <div class="modal-header">
            <h2>Add Team Member</h2>
            <button class="btn btn-ghost" @click="showAddMember = false">
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

          <form @submit.prevent="handleAddMember" class="modal-body">
            <div class="form-group">
              <label for="memberSelect">Select User</label>
              <select id="memberSelect" v-model="selectedUserId" required>
                <option :value="null" disabled>Choose a user...</option>
                <option
                  v-for="user in availableUsers"
                  :key="user.id"
                  :value="user.id"
                >
                  {{ user.name }} ({{ user.email }})
                </option>
              </select>
              <p v-if="availableUsers.length === 0" class="text-muted text-sm">
                All users are already members of this project.
              </p>
            </div>

            <div class="form-group">
              <label for="memberRole">Role</label>
              <select id="memberRole" v-model="selectedRole">
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                @click="showAddMember = false"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="addMemberLoading || !selectedUserId"
              >
                <span v-if="addMemberLoading" class="spinner"></span>
                <span v-else>Add Member</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
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

.project-content {
  max-width: 800px;
}

.project-header {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.project-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(
    135deg,
    var(--color-accent) 0%,
    var(--color-accent-emphasis) 100%
  );
  color: white;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.5rem;
}

.project-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.project-title {
  font-size: 1.5rem;
  font-weight: 700;
}

.project-description {
  color: var(--color-text-secondary);
  margin-bottom: var(--space-6);
}

/* Sections */
.section {
  margin-top: var(--space-8);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
}

.empty-section {
  color: var(--color-text-muted);
  padding: var(--space-8);
  text-align: center;
  background-color: var(--color-bg-secondary);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
}

/* Boards */
.boards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);
}

.board-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: inherit;
  text-decoration: none;
}

.board-card:hover {
  color: inherit;
}

.board-name {
  font-weight: 500;
}

/* Members */
.members-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.member-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.member-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(
    135deg,
    var(--color-success) 0%,
    var(--color-success-emphasis) 100%
  );
  color: white;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.member-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.member-name {
  font-weight: 500;
}

.member-email {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.member-remove {
  opacity: 0;
  transition: opacity var(--transition-fast);
  color: var(--color-danger);
}

.member-item:hover .member-remove {
  opacity: 1;
}

.member-remove:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

/* Labels */
.labels-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.label-badge {
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: 500;
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
  max-width: 400px;
  box-shadow: var(--shadow-xl);
  animation: slideUp var(--transition-base) ease-out;
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
</style>
