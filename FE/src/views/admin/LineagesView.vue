<template>
  <AppShell>
  <main class="max-w-275 mx-auto my-8 px-4 font-sans text-slate-900 dark:text-slate-100">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="m-0">Lineages</h1>
        <p class="text-slate-500 dark:text-slate-400">Approve requests, add members, and set each map's root.</p>
      </div>
      <button
        @click="$router.push('/admin')"
        class="rounded-[5px] border border-slate-300 bg-white px-2.8 py-1.8 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      >
        Back to directory
      </button>
    </div>
    <p v-if="error" class="text-red-700 dark:text-red-400">{{ error }}</p>
    <section class="grid grid-cols-1 sm:grid-cols-[320px_1fr] gap-4">
      <div class="card p-4">
        <h2>All lineages</h2>
        <button
          v-for="lineage in lineages"
          :key="lineage._id"
          :class="[
            'w-full grid gap-1 text-left my-2 rounded-md border p-2.8 cursor-pointer dark:text-slate-100',
            selected?._id === lineage._id
              ? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-500/10'
              : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
          ]"
          @click="selectLineage(lineage)"
        >
          <strong>{{ lineage.name }}</strong>
          <small class="text-slate-500 dark:text-slate-400"
            >/{{ lineage.slug }} · {{ lineage.status }} ·
            {{ lineage.visibility }}</small
          >
        </button>
      </div>

      <div v-if="selected" class="card p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="m-0">{{ selected.name }}</h2>
            <p class="text-slate-500 dark:text-slate-400">/{{ selected.slug }}</p>
          </div>
          <button
            v-if="selected.status === 'pending'"
            @click="approve"
            class="rounded-[5px] border border-slate-300 bg-slate-900 px-2.8 py-1.8 text-sm text-white hover:bg-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            Approve lineage
          </button>
        </div>

        <LineageMembersManager
          v-if="selected.status === 'approved'"
          :key="selected._id"
          :lineage="selected"
          return-to="admin-lineages"
        />
      </div>
    </section>
  </main>
  </AppShell>
</template>
<script setup>
import AppShell from '@/components/ui/AppShell.vue';
// The "add a person / reorder children / members" UI that used to live
// directly in this file now lives in LineageMembersManager.vue, shared with
// MyLineagesView.vue (a lineage_owner's scoped equivalent of this page).
// This view keeps only what's specific to the full admin picture: the
// sidebar listing EVERY lineage (not just one owner's), and the
// platform_admin-only approve action.
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { api } from "@/api";
import LineageMembersManager from "@/components/admin/LineageMembersManager.vue";

const route = useRoute();
const lineages = ref([]);
const selected = ref(null);
const error = ref("");

const load = async () => {
  lineages.value = await api.getAdminLineages();
};

const selectLineage = (lineage) => {
  selected.value = lineage;
};

const approve = async () => {
  await api.approveLineage(selected.value._id);
  await load();
  selected.value.status = "approved";
};

onMounted(async () => {
  try {
    await load();
    // Deep-link from the public lineage map's "Connect" action, or from
    // MemberForm.vue's post-create redirect: preselect the lineage named in
    // the query string. The person-side of that deep link (personId /
    // connectPersonId) is read by LineageMembersManager itself once it
    // mounts for this selection.
    if (route.query.lineageId) {
      const targetLineage = lineages.value.find(
        (lineageItem) => lineageItem._id === route.query.lineageId,
      );
      if (targetLineage) selectLineage(targetLineage);
    }
  } catch (requestError) {
    error.value = requestError.message;
  }
});
</script>
