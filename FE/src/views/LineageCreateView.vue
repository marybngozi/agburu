<template>
  <main class="page">
    <RouterLink to="/">← Back to Agburu</RouterLink>
    <section class="card">
      <h1>Create a lineage</h1>
      <p>Your request is reviewed by a platform administrator before publication.</p>
      <form v-if="!submitted" @submit.prevent="submit">
        <label>Lineage name<input v-model.trim="form.name" required /></label>
        <label>Public URL slug<input v-model.trim="form.slug" required placeholder="umehigido" pattern="[a-z0-9-]+" /></label>
        <label>Visibility<select v-model="form.visibility"><option value="public">Public</option><option value="private">Private</option></select></label>
        <label>Description<textarea v-model.trim="form.description" rows="3" /></label>
        <label>Your name<input v-model.trim="form.requesterName" required /></label>
        <label>Your email<input v-model.trim="form.requesterEmail" type="email" required /></label>
        <p v-if="error" class="error">{{ error }}</p>
        <button :disabled="saving">{{ saving ? 'Submitting…' : 'Submit for approval' }}</button>
      </form>
      <p v-else class="success">Request received. A platform administrator will review it before the lineage goes live.</p>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { api } from '@/api';

const form = reactive({ name: '', slug: '', description: '', visibility: 'public', requesterName: '', requesterEmail: '' });
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

<style scoped>
.page { min-height: 100vh; background: #f8fafc; padding: 3rem 1rem; font-family: system-ui, sans-serif; color: #0f172a; }
.page > a { display: block; max-width: 560px; margin: 0 auto 1rem; color: #2563eb; }
.card { max-width: 560px; margin: auto; padding: 2rem; border: 1px solid #e2e8f0; border-radius: 12px; background: white; box-shadow: 0 2px 12px #0f172a0d; }
h1 { margin: 0; } p { color: #475569; } form { display: grid; gap: 1rem; margin-top: 1.5rem; }
label { display: grid; gap: .4rem; font-weight: 600; font-size: .9rem; } input, select, textarea { box-sizing: border-box; width: 100%; padding: .65rem; border: 1px solid #cbd5e1; border-radius: 6px; font: inherit; }
button { background: #0f172a; color: white; border: 0; border-radius: 6px; padding: .75rem; font-weight: 600; cursor: pointer; }.error { color: #b91c1c; }.success { color: #047857; }

[data-theme="dark"] .page { background: var(--bg); color: var(--text); }
[data-theme="dark"] .card { background: var(--surface); border-color: var(--border); box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4); }
[data-theme="dark"] p { color: var(--text-muted); }
[data-theme="dark"] label { color: var(--text); }
[data-theme="dark"] input,
[data-theme="dark"] select,
[data-theme="dark"] textarea {
  background: var(--surface-muted);
  border-color: var(--border-strong);
  color: var(--text);
}
[data-theme="dark"] button { background: var(--accent); }
[data-theme="dark"] .error { color: var(--danger); }
[data-theme="dark"] .success { color: var(--success); }
</style>
