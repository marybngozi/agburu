<template>
  <AppShell>
  <div class="flex items-center justify-center px-4 py-16">
    <div class="card w-full max-w-sm p-10">
      <h2 class="mb-1 text-2xl font-bold text-gray-900 dark:text-slate-100">Create your account</h2>
      <p class="mb-8 text-sm text-gray-500 dark:text-slate-400">
        Sign up to start and manage your own family lineage
      </p>

      <form @submit.prevent="handleSubmit">
        <div class="mb-5">
          <label for="username" class="field-label mb-2 block">Your Name</label>
          <input
            type="text"
            id="username"
            v-model="username"
            required
            placeholder="e.g. Chimagbanwe Umeh"
            class="field-input"
          />
        </div>

        <div class="mb-5">
          <label for="email" class="field-label mb-2 block">Email Address</label>
          <input
            type="email"
            id="email"
            v-model="email"
            required
            placeholder="you@example.com"
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
            minlength="8"
            placeholder="At least 8 characters"
            class="field-input"
          />
        </div>

        <div v-if="error" class="mb-4 text-sm text-red-600 dark:text-red-400">
          {{ error }}
        </div>

        <button type="submit" :disabled="isPending" class="btn-primary mt-2 w-full">
          {{ isPending ? 'Creating Account...' : 'Create Account' }}
        </button>
      </form>

      <p class="mt-6 text-center text-sm text-gray-500 dark:text-slate-400">
        Already have an account?
        <RouterLink
          :to="{ name: 'login', query: $route.query.redirect ? { redirect: $route.query.redirect } : {} }"
          class="font-semibold text-blue-600 dark:text-blue-400"
          >Sign in</RouterLink
        >
      </p>
    </div>
  </div>
  </AppShell>
</template>

<script setup>
import AppShell from '@/components/ui/AppShell.vue';
import { ref } from 'vue';
import { useAuth } from '@/composables/useAuth';

const username = ref('');
const email = ref('');
const password = ref('');
const { error, isPending, signup } = useAuth();

const handleSubmit = async () => {
  await signup(username.value, email.value, password.value);
};
</script>
