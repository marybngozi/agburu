<template>
  <div class="relative flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-950">
    <div class="absolute top-5 right-5"><ThemeToggle /></div>
    <div class="card w-full max-w-sm p-10">
      <h2 class="mb-1 text-2xl font-bold text-gray-900 dark:text-slate-100">Agburu Admin Access</h2>
      <p class="mb-8 text-sm text-gray-500 dark:text-slate-400">Sign in to manage lineage records</p>

      <form @submit.prevent="handleSubmit">
        <div class="mb-5">
          <label for="email" class="field-label mb-2 block">Email Address</label>
          <input
            type="email"
            id="email"
            v-model="email"
            required
            placeholder="admin@agburu.com"
            class="field-input"
          />
        </div>

        <div class="mb-5">
          <label for="password" class="field-label mb-2 block">Password</label>
          <input
            type="password"
            id="password"
            v-model="password"
            required
            class="field-input"
          />
        </div>

        <div v-if="error" class="mb-4 text-sm text-red-600 dark:text-red-400">
          {{ error }}
        </div>

        <button type="submit" :disabled="isPending" class="btn-primary mt-2 w-full">
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
