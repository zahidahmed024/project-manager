<script setup lang="ts">
const { user, logout, initAuth, isAuthenticated } = useAuth();
const route = useRoute();

// Initialize auth on mount
onMounted(async () => {
  await initAuth();
});

const menuOpen = ref(false);
const sidebarCollapsed = ref(false);
</script>

<template>
  <div class="layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <NuxtLink to="/projects" class="logo">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <span v-if="!sidebarCollapsed">Mini Jira</span>
        </NuxtLink>
      </div>

      <nav class="sidebar-nav">
        <NuxtLink
          to="/projects"
          class="nav-item"
          :class="{ active: route.path === '/projects' }"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span v-if="!sidebarCollapsed">Projects</span>
        </NuxtLink>
      </nav>

      <button
        class="sidebar-toggle"
        @click="sidebarCollapsed = !sidebarCollapsed"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <polyline v-if="sidebarCollapsed" points="9 18 15 12 9 6" />
          <polyline v-else points="15 18 9 12 15 6" />
        </svg>
      </button>
    </aside>

    <!-- Main content -->
    <div class="main">
      <!-- Header -->
      <header class="header">
        <div class="header-left">
          <h1 class="page-title">
            <slot name="title" />
          </h1>
        </div>

        <div class="header-right">
          <div v-if="isAuthenticated" class="user-menu">
            <button class="user-button" @click="menuOpen = !menuOpen">
              <div class="avatar">
                {{ user?.name?.charAt(0).toUpperCase() }}
              </div>
              <span class="user-name">{{ user?.name }}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <div v-if="menuOpen" class="dropdown">
              <div class="dropdown-item user-info">
                <div class="text-sm font-medium">{{ user?.name }}</div>
                <div class="text-xs text-muted">{{ user?.email }}</div>
              </div>
              <hr class="dropdown-divider" />
              <button class="dropdown-item" @click="logout">Sign out</button>
            </div>
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

/* Sidebar */
.sidebar {
  width: 240px;
  background-color: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-base);
  position: relative;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--color-text-primary);
  font-weight: 600;
  font-size: 1.125rem;
}

.logo:hover {
  color: var(--color-text-primary);
}

.sidebar-nav {
  flex: 1;
  padding: var(--space-2);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  margin-bottom: var(--space-1);
}

.nav-item:hover {
  background-color: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.nav-item.active {
  background-color: var(--color-accent-muted);
  color: var(--color-accent);
}

.sidebar-toggle {
  position: absolute;
  bottom: var(--space-4);
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.sidebar-toggle:hover {
  background-color: var(--color-bg-hover);
  color: var(--color-text-primary);
}

/* Main area */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* Header */
.header {
  height: 64px;
  padding: 0 var(--space-6);
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

/* User menu */
.user-menu {
  position: relative;
}

.user-button {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: none;
  border: none;
  color: var(--color-text-primary);
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
}

.user-button:hover {
  background-color: var(--color-bg-hover);
}

.avatar {
  width: 32px;
  height: 32px;
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
}

.user-name {
  font-weight: 500;
}

.dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: var(--space-2);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  min-width: 200px;
  box-shadow: var(--shadow-lg);
  z-index: 100;
  animation: slideUp var(--transition-fast) ease-out;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: var(--space-3);
  text-align: left;
  background: none;
  border: none;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.dropdown-item:hover {
  background-color: var(--color-bg-hover);
}

.dropdown-item.user-info {
  cursor: default;
}

.dropdown-item.user-info:hover {
  background: none;
}

.dropdown-divider {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 0;
}

/* Content */
.content {
  flex: 1;
  padding: var(--space-6);
  overflow-y: auto;
}
</style>
