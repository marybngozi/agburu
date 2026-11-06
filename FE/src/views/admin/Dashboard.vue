<template>
  <AppShell>
  <div class="mx-auto my-8 max-w-275 px-4 font-sans">
    <!-- Top Action Bar -->
    <div
      class="mb-8 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between"
    >
      <div>
        <h2 class="m-0 text-[1.75rem] font-semibold text-gray-900 dark:text-slate-100">
          People directory
        </h2>
        <p class="mt-1 text-[0.95rem] text-gray-500 dark:text-slate-400">
          Every person record you can manage. Connect people to a lineage from Manage Lineages.
        </p>
      </div>
      <div class="flex w-full flex-wrap items-center gap-3 md:w-auto md:justify-end">
        <button
          @click="$router.push({ name: 'admin-lineages' })"
          class="btn-secondary flex-1 md:flex-none"
        >
          Manage Lineages
        </button>
        <button
          @click="$router.push({ name: 'admin-editors' })"
          class="btn-secondary flex-1 md:flex-none"
        >
          Profile Editors
        </button>
        <button
          @click="goToAddMember"
          class="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 md:flex-none"
        >
          + Add New Person
        </button>
      </div>
    </div>

    <!-- Filters & Search Panel -->
    <div
      class="mb-6 flex flex-col items-stretch gap-3 rounded-lg border border-gray-200 bg-gray-50 px-6 py-4 md:flex-row md:items-center md:justify-between dark:border-slate-700 dark:bg-slate-800"
    >
      <div>
        <input
          type="text"
          v-model="searchQuery"
          @input="debounceSearch"
          placeholder="Search members by name (e.g., Chidi)..."
          class="field-input md:w-80"
        />
      </div>
      <div>
        <label
          class="flex cursor-pointer items-center gap-2 text-sm text-gray-600 dark:text-slate-400"
        >
          <input
            type="checkbox"
            v-model="showDeleted"
            @change="fetchMembers(1)"
          />
          Show Archived/Deleted Records
        </label>
      </div>
    </div>

    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <PaginationSummary :page="currentPage" :limit="PAGE_LIMIT" :total="total" noun="people" />
      <PaginationControls :page="currentPage" :pages="totalPages" :disabled="isLoading" @update:page="navigatePage" />
    </div>

    <!-- Core Grid Directory Table -->
    <div class="card overflow-x-auto overflow-y-hidden md:overflow-hidden">
      <table class="w-full min-w-180 border-collapse text-left text-[0.9rem] md:min-w-0">
        <thead>
          <tr>
            <th class="border-b border-gray-200 bg-gray-100 px-4 py-3.5 font-semibold text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              Photo
            </th>
            <th class="border-b border-gray-200 bg-gray-100 px-4 py-3.5 font-semibold text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              Title Info
            </th>
            <th class="border-b border-gray-200 bg-gray-100 px-4 py-3.5 font-semibold text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              Full Name
            </th>
            <th class="border-b border-gray-200 bg-gray-100 px-4 py-3.5 font-semibold text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              Gender
            </th>
            <th class="border-b border-gray-200 bg-gray-100 px-4 py-3.5 font-semibold text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              Status
            </th>
            <th class="border-b border-gray-200 bg-gray-100 px-4 py-3.5 text-right font-semibold text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="6" class="p-12 text-center italic text-gray-400 dark:text-slate-500">
              Loading records from directory...
            </td>
          </tr>
          <tr v-else-if="members.length === 0">
            <td colspan="6" class="p-12 text-center italic text-gray-400 dark:text-slate-500">
              No family tree records found.
            </td>
          </tr>

          <tr
            v-else
            v-for="member in members"
            :key="member.id"
            :class="[member.isDeleted ? 'bg-red-50 dark:bg-red-400/[0.08]' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40']"
          >
            <td class="border-b border-gray-100 px-4 py-3.5 text-gray-600 dark:border-slate-800 dark:text-slate-400">
              <img
                :src="
                  member.profilePicture ||
                  'https://placehold.co/100x100?text=No+Photo'
                "
                alt="Avatar"
                class="h-10 w-10 rounded-full border border-gray-200 object-cover dark:border-slate-800"
              />
            </td>
            <td class="border-b border-gray-100 px-4 py-3.5 text-gray-600 dark:border-slate-800 dark:text-slate-400">
              <div class="flex gap-1">
                <span
                  v-if="member.title"
                  class="inline-flex items-center rounded bg-sky-100 px-1.5 py-0.5 text-xs font-medium text-sky-700"
                  >{{ member.title }}</span
                >
                <span
                  v-if="member.titledName"
                  class="inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700"
                  >{{ member.titledName }}</span
                >
                <span v-if="!member.title && !member.titledName">—</span>
              </div>
            </td>
            <td class="border-b border-gray-100 px-4 py-3.5 font-medium text-gray-900 dark:border-slate-800 dark:text-slate-100">{{ member.name }}</td>
            <td class="border-b border-gray-100 px-4 py-3.5 capitalize text-gray-600 dark:border-slate-800 dark:text-slate-400">{{ member.gender }}</td>
            <td class="border-b border-gray-100 px-4 py-3.5 text-gray-600 dark:border-slate-800 dark:text-slate-400">
              <span
                :class="
                  member.isDeleted
                    ? 'inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700'
                    : 'inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700'
                "
              >
                {{ member.isDeleted ? "Archived" : "Active" }}
              </span>
            </td>
            <td class="border-b border-gray-100 px-4 py-3.5 text-gray-600 dark:border-slate-800 dark:text-slate-400"><div class="flex justify-end gap-2">
              <button
                @click="editMember(member.id)"
                class="rounded bg-blue-50 px-3 py-1.5 text-[0.825rem] font-medium text-blue-700"
              >
                Edit
              </button>

              <button
                v-if="!member.isDeleted"
                @click="toggleDeleteStatus(member.id, true)"
                class="rounded bg-red-100 px-3 py-1.5 text-[0.825rem] font-medium text-red-700"
              >
                Delete
              </button>
              <button
                v-else
                @click="toggleDeleteStatus(member.id, false)"
                class="rounded bg-emerald-50 px-3 py-1.5 text-[0.825rem] font-medium text-emerald-700"
              >
                Restore
              </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="mt-4 flex justify-center">
      <PaginationControls :page="currentPage" :pages="totalPages" :disabled="isLoading" @update:page="navigatePage" />
    </div>
  </div>
  </AppShell>
</template>

<script setup>
import AppShell from '@/components/ui/AppShell.vue';
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { api } from "@/api";
import PaginationSummary from "@/components/ui/PaginationSummary.vue";
import PaginationControls from "@/components/ui/PaginationControls.vue";

const router = useRouter();

// Core UI States
const members = ref([]);
const isLoading = ref(false);
const searchQuery = ref("");
const showDeleted = ref(false);

// Pagination States
const PAGE_LIMIT = 10;
const total = ref(0);
const currentPage = ref(1);
const totalPages = ref(1);

let searchTimeout = null;

onMounted(() => {
  fetchMembers(1);
});

// Primary Directory Fetch Configuration calling Express REST API
const fetchMembers = async (page = 1) => {
  isLoading.value = true;
  currentPage.value = page;

  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: PAGE_LIMIT.toString(),
      search: searchQuery.value.trim(),
      showDeleted: showDeleted.value ? "true" : "false",
    });

    const res = await api.getPeople(queryParams.toString());

    members.value = res.people || [];
    totalPages.value = res.pages || 1;
    total.value = res.total ?? members.value.length;
  } catch (err) {
    console.error("Directory query failed:", err);
  } finally {
    isLoading.value = false;
  }
};

// Search Debounce optimization layer
const debounceSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    fetchMembers(1);
  }, 600);
};

// Pagination Handler
const navigatePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    fetchMembers(page);
  }
};

// Soft Delete / Restore Execution via Node Backend API
const toggleDeleteStatus = async (id, statusToggleValue) => {
  const confirmationMessage = statusToggleValue
    ? "Are you sure you want to delete this record? This action soft-deletes the profile but preserves references."
    : "Restore this record back into active tree queries?";

  if (confirm(confirmationMessage)) {
    try {
      await api.softDelete(id, statusToggleValue);
      // Reload current page array state
      await fetchMembers(currentPage.value);
    } catch (err) {
      alert("Failed to adjust record visibility states: " + err.message);
    }
  }
};

// Routing Actions
const goToAddMember = () => router.push({ name: "add-member" });
const editMember = (id) => router.push({ path: `/admin/edit-member/${id}` });
</script>
