<script setup lang="ts">
import type { Project } from "~/composables/useProjects";

const { getProjects, createProject } = useProjects();
const { initAuth } = useAuth();

const projects = ref<Project[]>([]);
const loading = ref(true);
const error = ref("");

// Modal state
const showCreateModal = ref(false);
const createForm = reactive({
  name: "",
  key: "",
  description: "",
});
const createLoading = ref(false);
const createError = ref("");

const loadProjects = async () => {
  loading.value = true;
  error.value = "";
  try {
    await initAuth();
    projects.value = await getProjects();
  } catch (e: any) {
    error.value = e.message || "Failed to load projects";
  } finally {
    loading.value = false;
  }
};

const handleCreateProject = async () => {
  createError.value = "";
  createLoading.value = true;

  try {
    const project = await createProject({
      name: createForm.name,
      key: createForm.key.toUpperCase(),
      description: createForm.description || undefined,
    });
    projects.value.push(project);
    showCreateModal.value = false;
    createForm.name = "";
    createForm.key = "";
    createForm.description = "";
  } catch (e: any) {
    createError.value = e.message || "Failed to create project";
  } finally {
    createLoading.value = false;
  }
};

onMounted(loadProjects);
</script>

<template>
  <div>
    <div class="projects-header">
      <h2 class="section-title">Your Projects</h2>
      <button class="btn btn-primary" @click="showCreateModal = true">
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
        New Project
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading projects...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="btn btn-secondary" @click="loadProjects">Try again</button>
    </div>

    <!-- Empty state -->
    <div v-else-if="projects.length === 0" class="empty-state">
      <svg
        width="64"
        height="64"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1"
      >
        <path
          d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
        />
      </svg>
      <h3>No projects yet</h3>
      <p>Create your first project to get started</p>
      <button class="btn btn-primary" @click="showCreateModal = true">
        Create Project
      </button>
    </div>

    <!-- Projects grid -->
    <div v-else class="projects-grid">
      <NuxtLink
        v-for="project in projects"
        :key="project.id"
        :to="`/projects/${project.id}`"
        class="project-card card card-clickable"
      >
        <div class="project-icon">
          {{ project.key.charAt(0) }}
        </div>
        <div class="project-info">
          <h3 class="project-name">{{ project.name }}</h3>
          <span class="project-key">{{ project.key }}</span>
        </div>
        <p v-if="project.description" class="project-description">
          {{ project.description }}
        </p>
      </NuxtLink>
    </div>

    <!-- Create Project Modal -->
    <Teleport to="body">
      <div
        v-if="showCreateModal"
        class="modal-overlay"
        @click.self="showCreateModal = false"
      >
        <div class="modal">
          <div class="modal-header">
            <h2>Create New Project</h2>
            <button class="btn btn-ghost" @click="showCreateModal = false">
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

          <form @submit.prevent="handleCreateProject" class="modal-body">
            <div v-if="createError" class="error-message">
              {{ createError }}
            </div>

            <div class="form-group">
              <label for="projectName">Project Name</label>
              <input
                id="projectName"
                v-model="createForm.name"
                type="text"
                placeholder="My Awesome Project"
                required
              />
            </div>

            <div class="form-group">
              <label for="projectKey">Project Key</label>
              <input
                id="projectKey"
                v-model="createForm.key"
                type="text"
                placeholder="MAP"
                maxlength="10"
                required
                class="uppercase"
              />
              <span class="form-hint"
                >2-10 characters, will be used in task IDs</span
              >
            </div>

            <div class="form-group">
              <label for="projectDescription">Description (optional)</label>
              <textarea
                id="projectDescription"
                v-model="createForm.description"
                placeholder="Describe your project..."
                rows="3"
              />
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                @click="showCreateModal = false"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="createLoading"
              >
                <span v-if="createLoading" class="spinner"></span>
                <span v-else>Create Project</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.projects-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}

.project-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  text-decoration: none;
  color: inherit;
}

.project-card:hover {
  color: inherit;
}

.project-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(
    135deg,
    var(--color-accent) 0%,
    var(--color-accent-emphasis) 100%
  );
  color: white;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.25rem;
}

.project-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.project-name {
  font-size: 1rem;
  font-weight: 600;
}

.project-key {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  background-color: var(--color-bg-tertiary);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
}

.project-description {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  line-height: 1.5;
}

/* States */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  padding: var(--space-12);
  color: var(--color-text-muted);
  text-align: center;
}

.empty-state h3 {
  font-size: 1.25rem;
  color: var(--color-text-primary);
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

.form-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: var(--space-1);
}

.uppercase {
  text-transform: uppercase;
}

.error-message {
  background-color: rgba(248, 81, 73, 0.15);
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
}
</style>
