<template>
  <AppShell>
  <main class="max-w-275 mx-auto my-8 px-4 font-sans text-slate-900 dark:text-slate-100">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="m-0">My Lineages</h1>
        <p class="text-slate-500 dark:text-slate-400">
          The lineage(s) you've created — add members and manage the family
          tree for each once it's approved.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <RouterLink to="/create-lineage" class="btn-secondary">+ New lineage</RouterLink>
      </div>
    </div>
    <p v-if="error" class="text-red-700 dark:text-red-400">{{ error }}</p>

    <section v-if="!lineages.length && !isLoading" class="card mt-6 p-8 text-center">
      <p class="m-0 text-slate-500 dark:text-slate-400">
        You haven't created a lineage yet.
      </p>
      <RouterLink to="/create-lineage" class="btn-primary mt-4 inline-block">
        Start your first lineage
      </RouterLink>
    </section>

    <section v-else class="grid grid-cols-1 gap-4 sm:grid-cols-[320px_1fr]">
      <div class="card p-4">
        <h2>Your lineages</h2>
        <button
          v-for="lineage in lineages"
          :key="lineage._id"
          :class="[
            'w-full grid gap-1 text-left my-2 rounded-md border p-3 cursor-pointer dark:text-slate-100',
            selected?._id === lineage._id
              ? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-500/10'
              : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
          ]"
          @click="selected = lineage"
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
          <RouterLink
            v-if="selected.status === 'approved'"
            :to="`/${selected.slug}`"
            target="_blank"
            rel="noopener"
            class="rounded-[5px] border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            View public page →
          </RouterLink>
        </div>

        <p
          v-if="selected.status === 'pending'"
          class="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900 dark:bg-amber-500/10 dark:text-amber-400"
        >
          This lineage is awaiting approval from a platform administrator.
          You'll be able to add family members here as soon as it's approved.
        </p>
        <p
          v-else-if="selected.status === 'rejected'"
          class="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400"
        >
          This lineage request was not approved.
        </p>

        <LineageMembersManager
          v-if="selected.status === 'approved'"
          :key="selected._id"
          :lineage="selected"
          return-to="my-lineages"
        />
      </div>
    </section>
  </main>
  </AppShell>
</template>

<script setup>
import AppShell from '@/components/ui/AppShell.vue';
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { api } from "@/api";
import { useAuth } from "@/composables/useAuth";
import LineageMembersManager from "@/components/admin/LineageMembersManager.vue";
import ThemeToggle from "@/components/ui/ThemeToggle.vue";

const route = useRoute();
const { logout } = useAuth();

const lineages = ref([]);
const selected = ref(null);
const isLoading = ref(true);
const error = ref("");

const handleLogout = () => logout();

onMounted(async () => {
  try {
    lineages.value = await api.getMyLineages();
    // Deep-link back from "Create Person and Choose Lineage" (MemberForm.vue,
    // returnTo=my-lineages) or the public map's "Connect" action — same
    // ?lineageId= pattern admin-lineages uses. The person-side of the deep
    // link (personId / connectPersonId) is read by LineageMembersManager
    // itself once it mounts for this selection.
    if (route.query.lineageId) {
      const targetLineage = lineages.value.find(
        (lineageItem) => lineageItem._id === route.query.lineageId,
      );
      if (targetLineage) selected.value = targetLineage;
    } else if (lineages.value.length === 1) {
      // The common case — one lineage — shouldn't need an extra click to see it.
      selected.value = lineages.value[0];
    }
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    isLoading.value = false;
  }
});
</script>
