<script setup lang="ts">
const { isAuthenticated, initAuth } = useAuth();

onMounted(async () => {
  await initAuth();

  if (isAuthenticated.value) {
    navigateTo("/projects");
  } else {
    navigateTo("/login");
  }
});
</script>

<template>
  <div class="loading">
    <div class="spinner"></div>
  </div>
</template>

<style scoped>
.loading {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 40px;
  height: 40px;
}
</style>
