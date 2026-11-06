<template>
  <AppShell>
  <main class="px-4 py-10 font-sans text-slate-900 dark:text-slate-100">
    <section class="card mx-auto max-w-xl p-8">
      <h1 class="m-0 text-3xl font-bold">Create a lineage</h1>
      <p class="text-slate-600 dark:text-slate-400">Your request is reviewed by a platform administrator before publication.</p>
      <form v-if="!submitted" @submit.prevent="submit" class="mt-6 grid gap-4">
        <label class="grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-100">Lineage name<input v-model.trim="form.name" required class="field-input" /></label>
        <label class="grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-100">Public URL slug<input v-model.trim="form.slug" required placeholder="umehigido" pattern="[a-z0-9]+(-[a-z0-9]+)*" minlength="3" maxlength="60" title="Lowercase letters, numbers and hyphens only" class="field-input" /></label>
        <label class="grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-100">Visibility<select v-model="form.visibility" class="field-input"><option value="public">Public</option><option value="private">Private</option></select></label>
        <label class="grid gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-100">Description<textarea v-model.trim="form.description" rows="3" class="field-input" /></label>
        <p v-if="error" class="text-red-700 dark:text-red-400">{{ error }}</p>
        <button :disabled="saving" class="btn-primary w-full">{{ saving ? 'Submitting…' : 'Submit for approval' }}</button>
      </form>
      <p v-else class="text-emerald-700 dark:text-emerald-400">Request received. A platform administrator will review it before the lineage goes live. <RouterLink to="/my-lineages" class="font-semibold">Go to My Lineages →</RouterLink></p>
    </section>
  </main>
  </AppShell>
</template>

<script setup>
import AppShell from '@/components/ui/AppShell.vue';
import { reactive, ref, watch } from 'vue';
import { api } from '@/api';

// requesterName/requesterEmail are gone — the backend now identifies the
// requester from the signed-in account itself (see BE requestLineage),
// since this route requires being logged in (router meta.requiresAuth).
const form = reactive({ name: '', slug: '', description: '', visibility: 'public' });
const saving = ref(false);
const submitted = ref(false);
const error = ref('');

watch(() => form.name, (name) => {
  if (!form.slug) form.slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
});

const submit = async () => {
  saving.value = true;
  error.value = '';
  try {
    await api.requestLineage(form);
    submitted.value = true;
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    saving.value = false;
  }
};
</script>
