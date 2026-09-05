<template>
  <main class="mx-auto my-8 max-w-225 px-4 font-sans dark:text-slate-100">
    <div class="flex justify-between">
      <div>
        <h1>Profile editors</h1>
        <p class="dark:text-slate-400">
          Create accounts for people and review their proposed profile updates.
        </p>
      </div>
      <button @click="$router.push('/admin')" class="btn-secondary">Back</button>
    </div>
    <section class="my-4 rounded-[10px] border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2>Create editor account</h2>
      <div class="grid grid-cols-1 gap-2.4 sm:grid-cols-2">
        <input v-model="form.username" placeholder="Username" class="field-input" />
        <input v-model="form.email" type="email" placeholder="Email" class="field-input" />
        <input
          v-model="search"
          @input="findPeople"
          placeholder="Search assigned person"
          class="field-input"
        />
        <select v-model="form.personId" class="field-input">
          <option value="">Select person</option>
          <option v-for="person in people" :key="person.id" :value="person.id">
            {{ person.name }}
          </option>
        </select>
        <button @click="create" class="btn-secondary">Create account</button>
      </div>
      <p v-if="password" class="text-emerald-700 dark:text-emerald-400">
        Temporary password: <code>{{ password }}</code> — copy it now; it is shown once.
      </p>
    </section>
    <section class="my-4 rounded-[10px] border border-slate-200 p-4 dark:border-slate-800 dark:bg-slate-900">
      <h2>Pending profile changes</h2>
      <p v-if="!changes.length">No pending profile changes.</p>
      <article
        v-for="change in changes"
        :key="change._id"
        class="border-t border-slate-200 py-4 dark:border-slate-800"
      >
        <strong>{{ change.personId?.name }}</strong>
        <span>by {{ change.submittedBy?.username || change.submittedBy?.email }}</span>
        <pre class="whitespace-pre-wrap bg-slate-50 p-3 dark:bg-slate-800 dark:text-slate-400">{{ change.proposedData }}</pre>
        <button @click="review(change._id, true)" class="btn-secondary">Approve</button>
        <button @click="review(change._id, false)" class="btn-secondary">Reject</button>
      </article>
    </section>
  </main>
</template>
<script setup>
import { onMounted, reactive, ref } from 'vue'; import { api } from '@/api';
const form=reactive({username:'',email:'',personId:''}); const search=ref(''); const people=ref([]); const changes=ref([]); const password=ref(''); let timer;
const load=async()=>{changes.value=await api.getPendingChanges()}; const findPeople=()=>{clearTimeout(timer);timer=setTimeout(async()=>{if(search.value.trim().length<2)return people.value=[];people.value=(await api.getPeople(`search=${encodeURIComponent(search.value)}&limit=8`)).people||[]},250)}; const create=async()=>{const result=await api.createProfileEditor(form);if(result.password)password.value=result.password}; const review=async(id,approved)=>{await api.reviewChange(id,approved);await load()};onMounted(load);
</script>
