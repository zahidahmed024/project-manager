<script setup lang="ts">
definePageMeta({
  layout: "auth",
});

const { register } = useAuth();

const form = reactive({
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
});

const error = ref("");
const loading = ref(false);

const handleSubmit = async () => {
  error.value = "";

  if (form.password !== form.confirmPassword) {
    error.value = "Passwords do not match";
    return;
  }

  if (form.password.length < 6) {
    error.value = "Password must be at least 6 characters";
    return;
  }

  loading.value = true;

  try {
    await register(form.email, form.password, form.name);
    navigateTo("/projects");
  } catch (e: any) {
    error.value = e.message || "Registration failed";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="auth-form">
    <h2 class="form-title">Create an account</h2>
    <p class="form-description">Get started with Mini Jira today</p>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div class="form-group">
      <label for="name">Full name</label>
      <input
        id="name"
        v-model="form.name"
        type="text"
        placeholder="John Doe"
        required
        autocomplete="name"
      />
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
        autocomplete="new-password"
      />
    </div>

    <div class="form-group">
      <label for="confirmPassword">Confirm password</label>
      <input
        id="confirmPassword"
        v-model="form.confirmPassword"
        type="password"
        placeholder="••••••••"
        required
        autocomplete="new-password"
      />
    </div>

    <button
      type="submit"
      class="btn btn-primary btn-lg w-full"
      :disabled="loading"
    >
      <span v-if="loading" class="spinner"></span>
      <span v-else>Create account</span>
    </button>

    <p class="form-footer">
      Already have an account?
      <NuxtLink to="/login">Sign in</NuxtLink>
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
