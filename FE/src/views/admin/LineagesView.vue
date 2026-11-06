<template>
  <AppShell>
  <main class="max-w-275 mx-auto my-8 px-4 font-sans text-slate-900 dark:text-slate-100">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="m-0 text-2xl font-semibold">Lineages</h1>
        <p class="mt-1 text-slate-500 dark:text-slate-400">Approve requests, add members, and set each map's root.</p>
      </div>
      <router-link
        to="/admin"
        class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm no-underline text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
      >
        ← Back to directory
      </router-link>
    </div>

    <p v-if="error" class="mt-4 text-red-700 dark:text-red-400">{{ error }}</p>
    <p v-else-if="loading" class="mt-6 text-slate-500 dark:text-slate-400">Loading lineages…</p>
    <p v-else-if="!lineages.length" class="mt-6 text-slate-500 dark:text-slate-400">No lineages yet.</p>

    <section v-else class="mt-6 grid grid-cols-1 items-start gap-4 md:grid-cols-[320px_1fr]">
      <aside class="card p-4">
        <div class="flex items-center justify-between">
          <h2 class="m-0 text-base font-semibold">All lineages</h2>
          <span class="text-xs text-slate-500 dark:text-slate-400">
            {{ lineages.length }} total<template v-if="pendingCount"> · {{ pendingCount }} pending</template>
          </span>
        </div>
        <input
          v-model="search"
          type="search"
          placeholder="Search by name or slug"
          class="mt-3 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
        <button
          v-for="lineage in filtered"
          :key="lineage._id"
          :class="[
            'w-full grid gap-1 text-left mt-2 rounded-md border p-3 cursor-pointer dark:text-slate-100',
            selected?._id === lineage._id
              ? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-500/10'
              : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-600',
          ]"
          @click="selectLineage(lineage)"
        >
          <span class="flex items-center justify-between gap-2">
            <strong>{{ lineage.name }}</strong>
            <span
              :class="[
                'rounded-full px-2 py-0.5 text-xs font-medium',
                lineage.status === 'approved'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
              ]"
              >{{ lineage.status }}</span
            >
          </span>
          <small class="text-slate-500 dark:text-slate-400"
            >/{{ lineage.slug }} · {{ lineage.visibility }}</small
          >
        </button>
        <p v-if="!filtered.length" class="mt-3 text-sm text-slate-500 dark:text-slate-400">No matches.</p>
      </aside>

      <div v-if="selected" class="card p-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="m-0 text-xl font-semibold">{{ selected.name }}</h2>
            <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
              /{{ selected.slug }} · {{ selected.visibility }} · {{ selected.status }}
            </p>
          </div>
          <div class="flex gap-2">
            <router-link
              v-if="selected.status === 'approved'"
              :to="`/${selected.slug}`"
              class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm no-underline text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              View map
            </router-link>
            <button
              v-if="selected.status === 'pending'"
              @click="approve"
              class="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
            >
              Approve lineage
            </button>
          </div>
        </div>

        <p
          v-if="selected.status === 'pending'"
          class="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200"
        >
          This lineage is waiting for approval. Members can be added once it's approved.
        </p>

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
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { api } from "@/api";
import LineageMembersManager from "@/components/admin/LineageMembersManager.vue";

const route = useRoute();
const lineages = ref([]);
const selected = ref(null);
const error = ref("");
const loading = ref(true);
const search = ref("");

const pendingCount = computed(() => lineages.value.filter((l) => l.status === "pending").length);
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  return lineages.value.filter(
    (l) => !q || l.name.toLowerCase().includes(q) || l.slug.toLowerCase().includes(q),
  );
});

const load = async () => {
  const all = await api.getAdminLineages();
  // Pending requests first so they aren't missed, then A–Z.
  lineages.value = [...all].sort(
    (a, b) =>
      (a.status === "pending" ? 0 : 1) - (b.status === "pending" ? 0 : 1) ||
      a.name.localeCompare(b.name),
  );
};

const selectLineage = (lineage) => {
  selected.value = lineage;
};

const approve = async () => {
  await api.approveLineage(selected.value._id);
  const id = selected.value._id;
  await load();
  selected.value = lineages.value.find((l) => l._id === id) || selected.value;
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
    // Never leave the right-hand pane empty: fall back to the first lineage.
    if (!selected.value && lineages.value.length) selectLineage(lineages.value[0]);
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    loading.value = false;
  }
});
</script>
