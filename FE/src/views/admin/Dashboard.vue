<template>
  <div class="dashboard-container">
    <!-- Top Action Bar -->
    <div class="dashboard-header">
      <div class="title-block">
        <h2>Agburu Lineage Directory</h2>
        <p>Manage family tree records, connections, and historical timelines.</p>
      </div>
      <div class="header-buttons">
        <button @click="goToAddMember" class="add-member-btn">+ Add New Member</button>
        <button @click="handleLogout" class="logout-btn">Sign Out</button>
      </div>
    </div>

    <!-- Filters & Search Panel -->
    <div class="filter-panel">
      <div class="search-box">
        <input 
          type="text" 
          v-model="searchQuery" 
          @input="debounceSearch" 
          placeholder="Search members by name (e.g., Chidi)..."
        />
      </div>
      <div class="toggle-box">
        <label>
          <input type="checkbox" v-model="showDeleted" @change="fetchMembers(1)" />
          Show Archived/Deleted Records
        </label>
      </div>
    </div>

    <!-- Core Grid Directory Table -->
    <div class="table-wrapper">
      <table class="directory-table">
        <thead>
          <tr>
            <th>Photo</th>
            <th>Title Info</th>
            <th>Full Name</th>
            <th>Gender</th>
            <th>Mode of Joining</th>
            <th>Status</th>
            <th class="actions-head">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="7" class="state-cell">Loading records from directory...</td>
          </tr>
          <tr v-else-if="members.length === 0">
            <td colspan="7" class="state-cell">No family tree records found.</td>
          </tr>
          
          <tr v-else v-for="member in members" :key="member.id" :class="{ 'archived-row': member.isDeleted }">
            <td>
              <img 
                :src="member.profilePicture || 'https://placehold.co/100x100?text=No+Photo'" 
                alt="Avatar" 
                class="table-avatar"
              />
            </td>
            <td>
              <div class="title-tags">
                <span v-if="member.title" class="badge-civil">{{ member.title }}</span>
                <span v-if="member.titledName" class="badge-native">{{ member.titledName }}</span>
                <span v-if="!member.title && !member.titledName">—</span>
              </div>
            </td>
            <td class="font-medium">{{ member.name }}</td>
            <td class="capitalize-text">{{ member.gender }}</td>
            <td class="capitalize-text">{{ member.modeOfJoining }}</td>
            <td>
              <span :class="member.isDeleted ? 'status-deleted' : 'status-active'">
                {{ member.isDeleted ? 'Archived' : 'Active' }}
              </span>
            </td>
            <td class="actions-cell">
              <button @click="editMember(member.id)" class="edit-btn">Edit</button>
              
              <button 
                v-if="!member.isDeleted" 
                @click="toggleDeleteStatus(member.id, true)" 
                class="delete-btn"
              >
                Delete
              </button>
              <button 
                v-else 
                @click="toggleDeleteStatus(member.id, false)" 
                class="restore-btn"
              >
                Restore
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Standard Numeric Pagination Controls -->
    <div class="pagination-row">
      <button 
        @click="navigatePage(currentPage - 1)" 
        :disabled="currentPage <= 1 || isLoading"
        class="nav-btn"
      >
        ← Previous Page
      </button>
      <span class="page-indicator">Page {{ currentPage }} of {{ totalPages || 1 }}</span>
      <button 
        @click="navigatePage(currentPage + 1)" 
        :disabled="currentPage >= totalPages || isLoading"
        class="nav-btn"
      >
        Next Page →
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/api';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const { logout } = useAuth();

// Core UI States
const members = ref([]);
const isLoading = ref(false);
const searchQuery = ref('');
const showDeleted = ref(false);

// Pagination States
const PAGE_LIMIT = 8;
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
      showDeleted: showDeleted.value ? 'true' : 'false'
    });

    const res = await api.getPeople(queryParams.toString());
    
    members.value = res.people || [];
    totalPages.value = res.pages || 1;
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
  }, 400);
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
const goToAddMember = () => router.push({ name: 'add-member' });
const editMember = (id) => router.push({ path: `/admin/edit-member/${id}` });
const handleLogout = async () => await logout();
</script>

<style scoped>
.dashboard-container {
  max-width: 1100px;
  margin: 2rem auto;
  padding: 0 1rem;
  font-family: system-ui, sans-serif;
}
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}
.title-block h2 { margin: 0 0 0.25rem 0; color: #111827; font-size: 1.75rem; }
.title-block p { margin: 0; color: #6b7280; font-size: 0.95rem; }
.header-buttons { display: flex; gap: 0.75rem; }
.add-member-btn { background-color: #2563eb; color: white; border: none; padding: 0.625rem 1.25rem; border-radius: 6px; font-weight: 500; cursor: pointer; }
.logout-btn { background-color: white; border: 1px solid #d1d5db; color: #374151; padding: 0.625rem 1.25rem; border-radius: 6px; cursor: pointer; }

.filter-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  margin-bottom: 1.5rem;
}
.search-box input { width: 320px; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 4px; }
.toggle-box label { font-size: 0.875rem; color: #4b5563; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }

.table-wrapper { background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
.directory-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
.directory-table th { background: #f3f4f6; color: #374151; padding: 0.875rem 1rem; font-weight: 600; border-bottom: 1px solid #e5e7eb; }
.directory-table td { padding: 0.875rem 1rem; border-bottom: 1px solid #f3f4f6; color: #4b5563; }
.archived-row { background-color: #fef2f2; }

.table-avatar { width: 40px; height: 40px; object-fit: cover; border-radius: 50%; border: 1px solid #e5e7eb; }
.title-tags { display: flex; gap: 0.25rem; }
.badge-civil { background: #e0f2fe; color: #0369a1; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500; }
.badge-native { background: #fef3c7; color: #b45309; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500; }

.status-active { background: #dcfce7; color: #15803d; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }
.status-deleted { background: #fee2e2; color: #b91c1c; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }

.actions-head { text-align: right; }
.actions-cell { display: flex; gap: 0.5rem; justify-content: flex-end; }
.actions-cell button { border: none; padding: 0.35rem 0.75rem; border-radius: 4px; cursor: pointer; font-size: 0.825rem; font-weight: 500; }
.edit-btn { background: #eff6ff; color: #1d4ed8; }
.delete-btn { background: #fee2e2; color: #b91c1c; }
.restore-btn { background: #ecfdf5; color: #047857; }

.pagination-row { display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; }
.nav-btn { background: white; border: 1px solid #d1d5db; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-size: 0.85rem; }
.nav-btn:disabled { color: #9ca3af; cursor: not-allowed; background: #f9fafb; }
.page-indicator { font-size: 0.85rem; color: #6b7280; }
.font-medium { font-weight: 500; color: #111827 !important; }
.capitalize-text { text-transform: capitalize; }
.state-cell { text-align: center; padding: 3rem !important; color: #9ca3af; font-style: italic; }
</style>