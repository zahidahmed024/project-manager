<script setup lang="ts">
definePageMeta({
  layout: "auth",
});

const { login } = useAuth();

const form = reactive({
  email: "",
  password: "",
});

const error = ref("");
const loading = ref(false);

const handleSubmit = async () => {
  error.value = "";
  loading.value = true;

  try {
    await login(form.email, form.password);
    navigateTo("/projects");
  } catch (e: any) {
    error.value = e.message || "Login failed";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="auth-form">
    <h2 class="form-title">Welcome back</h2>
    <p class="form-description">Sign in to your account to continue</p>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div class="form-group">
      <label for="email">Email</label>
      <input
        id="email"
        v-model="form.email"
        type="email"
        placeholder="you@example.com"
        required
        autocomplete="email"
      />
    </div>

    <div class="form-group">
      <label for="password">Password</label>
      <input
        id="password"
        v-model="form.password"
        type="password"
        placeholder="••••••••"
        required
        autocomplete="current-password"
      />
    </div>

    <button
      type="submit"
      class="btn btn-primary btn-lg w-full"
      :disabled="loading"
    >
      <span v-if="loading" class="spinner"></span>
      <span v-else>Sign in</span>
    </button>

    <p class="form-footer">
      Don't have an account?
      <NuxtLink to="/register">Create one</NuxtLink>
    </p>
  </form>
</template>

<style scoped>
.auth-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  text-align: center;
}

.form-description {
  color: var(--color-text-muted);
  text-align: center;
  font-size: 0.875rem;
  margin-bottom: var(--space-2);
}

.form-group {
  display: flex;
  flex-direction: column;
}

.error-message {
  background-color: rgba(248, 81, 73, 0.15);
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
}

.form-footer {
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  margin-top: var(--space-2);
}

.form-footer a {
  color: var(--color-accent);
  font-weight: 500;
}

.form-footer a:hover {
  text-decoration: underline;
}
</style>
