<template><main class="page"><div class="header"><div><h1>Profile editors</h1><p>Create accounts for people and review their proposed profile updates.</p></div><button @click="$router.push('/admin')">Back</button></div><section class="card"><h2>Create editor account</h2><div class="form"><input v-model="form.username" placeholder="Username"><input v-model="form.email" type="email" placeholder="Email"><input v-model="search" @input="findPeople" placeholder="Search assigned person"><select v-model="form.personId"><option value="">Select person</option><option v-for="person in people" :key="person.id" :value="person.id">{{ person.name }}</option></select><button @click="create">Create account</button></div><p v-if="password" class="password">Temporary password: <code>{{ password }}</code> — copy it now; it is shown once.</p></section><section class="card"><h2>Pending profile changes</h2><p v-if="!changes.length">No pending profile changes.</p><article v-for="change in changes" :key="change._id"><strong>{{ change.personId?.name }}</strong> <span>by {{ change.submittedBy?.username || change.submittedBy?.email }}</span><pre>{{ change.proposedData }}</pre><button @click="review(change._id, true)">Approve</button><button @click="review(change._id, false)">Reject</button></article></section></main></template>
<script setup>
import { onMounted, reactive, ref } from 'vue'; import { api } from '@/api';
const form=reactive({username:'',email:'',personId:''}); const search=ref(''); const people=ref([]); const changes=ref([]); const password=ref(''); let timer;
const load=async()=>{changes.value=await api.getPendingChanges()}; const findPeople=()=>{clearTimeout(timer);timer=setTimeout(async()=>{if(search.value.trim().length<2)return people.value=[];people.value=(await api.getPeople(`search=${encodeURIComponent(search.value)}&limit=8`)).people||[]},250)}; const create=async()=>{const result=await api.createProfileEditor(form);if(result.password)password.value=result.password}; const review=async(id,approved)=>{await api.reviewChange(id,approved);await load()};onMounted(load);
</script><style scoped>.page{max-width:900px;margin:2rem auto;padding:0 1rem;font-family:system-ui,sans-serif}.header{display:flex;justify-content:space-between}.card{border:1px solid #e2e8f0;border-radius:10px;padding:1rem;margin:1rem 0}.form{display:grid;grid-template-columns:1fr 1fr;gap:.6rem}input,select,button{padding:.55rem;border:1px solid #cbd5e1;border-radius:5px;background:white}.password{color:#047857}article{border-top:1px solid #e2e8f0;padding:1rem 0}pre{background:#f8fafc;padding:.75rem;white-space:pre-wrap}@media(max-width:600px){.form{grid-template-columns:1fr}}

[data-theme="dark"] .page { color: var(--text); }
[data-theme="dark"] .header p { color: var(--text-muted); }
[data-theme="dark"] .card { background: var(--surface); border-color: var(--border); }
[data-theme="dark"] input,
[data-theme="dark"] select,
[data-theme="dark"] button {
  border-color: var(--border-strong);
  background: var(--surface-muted);
  color: var(--text);
}
[data-theme="dark"] .password { color: var(--success); }
[data-theme="dark"] article { border-top-color: var(--border); }
[data-theme="dark"] pre { background: var(--surface-muted); color: var(--text-muted); }
</style>
