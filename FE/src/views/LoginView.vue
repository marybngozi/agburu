<template>
  <div class="login-container">
    <div class="theme-toggle-corner"><ThemeToggle /></div>
    <div class="login-card">
      <h2>Agburu Admin Access</h2>
      <p class="subtitle">Sign in to manage lineage records</p>

      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="email">Email Address</label>
          <input
            type="email"
            id="email"
            v-model="email"
            required
            placeholder="admin@agburu.com"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            type="password"
            id="password"
            v-model="password"
            required
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" :disabled="isPending">
          {{ isPending ? 'Signing In...' : 'Login' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuth } from '@/composables/useAuth';
import ThemeToggle from '@/components/ui/ThemeToggle.vue';

const email = ref('');
const password = ref('');
const { error, isPending, login } = useAuth();

const handleSubmit = async () => {
  await login(email.value, password.value);
};
</script>

<style scoped>
.login-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f9fafb;
}
.theme-toggle-corner {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
}
.login-card {
  width: 100%;
  max-width: 400px;
  padding: 2.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
h2 {
  margin-bottom: 0.25rem;
  color: #111827;
  font-size: 1.5rem;
}
.subtitle {
  color: #6b7280;
  margin-bottom: 2rem;
  font-size: 0.875rem;
}
.form-group {
  margin-bottom: 1.25rem;
}
label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}
input {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  box-sizing: border-box;
}
input:focus {
  outline: none;
  border-color: #2563eb;
}
button {
  width: 100%;
  padding: 0.75rem;
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 0.5rem;
}
button:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}
.error-message {
  color: #dc2626;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

[data-theme="dark"] .login-container {
  background-color: var(--bg);
}
[data-theme="dark"] .login-card {
  background: var(--surface);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
}
[data-theme="dark"] h2 {
  color: var(--text);
}
[data-theme="dark"] .subtitle {
  color: var(--text-muted);
}
[data-theme="dark"] label {
  color: var(--text-muted);
}
[data-theme="dark"] input {
  background: var(--surface-muted);
  border-color: var(--border-strong);
  color: var(--text);
}
[data-theme="dark"] input:focus {
  border-color: var(--accent);
}
</style>
