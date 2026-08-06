<template>
  <div class="form-container">
    <div class="header-actions">
      <h2>{{ isEditMode ? 'Edit Lineage Member' : 'Add New Lineage Member' }}</h2>
      <button @click="$router.push({ name: 'admin-dashboard' })" class="back-btn">← Back to Dashboard</button>
    </div>

    <form @submit.prevent="handleSubmit" class="main-form">
      <!-- SECTION A: Identity & Demographics -->
      <div class="form-section">
        <h3>Section A: Demographic Identity</h3>
        
        <div class="form-grid">
          <div class="form-group">
            <label>Academic/Civil Title</label>
            <select v-model="form.title">
              <option value="">None</option>
              <option value="Mr.">Mr.</option>
              <option value="Mrs.">Mrs.</option>
              <option value="Ms.">Ms.</option>
              <option value="Dr.">Dr.</option>
              <option value="Prof.">Prof.</option>
              <option value="Chief">Chief</option>
            </select>
          </div>

          <div class="form-group">
            <label>Native/Traditional Titled Name</label>
            <input type="text" v-model="form.titledName" placeholder="e.g., Nze, Amina, Ichie" />
          </div>

          <div class="form-group col-span-2">
            <label>Full Name *</label>
            <input type="text" v-model="form.name" required placeholder="Given Name and Surname" />
          </div>

          <div class="form-group">
            <label>Gender *</label>
            <div class="radio-group">
              <label><input type="radio" v-model="form.gender" value="male" required /> Male</label>
              <label><input type="radio" v-model="form.gender" value="female" required /> Female</label>
            </div>
          </div>

          <div class="form-group">
            <label>Mode of Joining *</label>
            <div class="radio-group">
              <label><input type="radio" v-model="form.modeOfJoining" value="birthed" required /> Birthed</label>
              <label><input type="radio" v-model="form.modeOfJoining" value="married" required /> Married</label>
              <label><input type="radio" v-model="form.modeOfJoining" value="adopted" required /> Adopted</label>
            </div>
          </div>

          <div class="form-group">
            <label>Birth Date</label>
            <input type="date" v-model="form.birthDate" />
          </div>

          <div class="form-group">
            <label>Death Date (Leave blank if alive)</label>
            <input type="date" v-model="form.deathDate" />
          </div>
        </div>

        <div class="form-group mt-4">
          <label>Biography Summary (Teaser description)</label>
          <textarea v-model="form.biographySummary" rows="2" placeholder="Brief summary for popups..."></textarea>
        </div>

        <div class="form-group">
          <label>Detailed Biography (Full historical records)</label>
          <textarea v-model="form.detailedBiography" rows="5" placeholder="Deep historical context details..."></textarea>
        </div>

        <div class="form-group pic-upload-group">
          <label>Profile Picture</label>
          <input type="file" @change="handleFileChange" accept="image/*" />
          <div v-if="imagePreview" class="preview-box">
            <img :src="imagePreview" alt="Preview" />
          </div>
        </div>
      </div>

      <!-- SECTION B: Relational Linkage -->
      <div class="form-section">
        <h3>Section B: Relational Linkage</h3>
        <p class="section-desc">Search for existing database profiles to build relations.</p>

        <div class="form-group">
          <label>Parent Connection (Search by name)</label>
          <input 
            type="text" 
            v-model="parentSearch" 
            @input="searchPeople('parent')" 
            placeholder="Type to search structural parent..."
          />
          <div v-if="parentResults.length" class="search-dropdown">
            <div 
              v-for="p in parentResults" 
              :key="p.id" 
              @click="selectParent(p)" 
              class="search-item"
            >
              {{ p.title }} {{ p.name }} ({{ p.gender }})
            </div>
          </div>
          <div v-if="selectedParentName" class="selected-badge">
            Linked Parent: <strong>{{ selectedParentName }}</strong> 
            <span @click="clearParent" class="clear-x">✕</span>
          </div>
        </div>

        <div class="form-group">
          <label>Partners/Wives (Search to append)</label>
          <input 
            type="text" 
            v-model="partnerSearch" 
            @input="searchPeople('partner')" 
            placeholder="Type to add a partner..."
          />
          <div v-if="partnerResults.length" class="search-dropdown">
            <div v-for="p in partnerResults" :key="p.id" @click="addPartner(p)" class="search-item">
              {{ p.name }}
            </div>
          </div>
          <div class="badges-container">
            <div v-for="(name, id) in selectedPartnersMap" :key="id" class="selected-badge">
              {{ name }} <span @click="removePartner(id)" class="clear-x">✕</span>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>Direct Children (Search to append)</label>
          <input 
            type="text" 
            v-model="childSearch" 
            @input="searchPeople('child')" 
            placeholder="Type to add a child..."
          />
          <div v-if="childResults.length" class="search-dropdown">
            <div v-for="c in childResults" :key="c.id" @click="addChild(c)" class="search-item">
              {{ c.name }}
            </div>
          </div>
          <div class="badges-container">
            <div v-for="(name, id) in selectedChildrenMap" :key="id" class="selected-badge">
              {{ name }} <span @click="removeChild(id)" class="clear-x">✕</span>
            </div>
          </div>
        </div>
      </div>

      <MilestoneInput v-model="form.milestones" />

      <div class="actions-row">
        <div v-if="uiError" class="error-banner">{{ uiError }}</div>
        <button type="submit" class="submit-btn" :disabled="isSaving">
          {{ isSaving ? 'Processing Records...' : isEditMode ? 'Update Record' : 'Save Member Document' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { api } from '@/api';
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import MilestoneInput from '@/components/admin/MilestoneInput.vue';

const route = useRoute();
const router = useRouter();

const isEditMode = ref(false);
const isSaving = ref(false);
const uiError = ref(null);

// Form Core State
const form = reactive({
  title: '',
  titledName: '',
  name: '',
  gender: 'male',
  modeOfJoining: 'birthed',
  birthDate: '',
  deathDate: '',
  biographySummary: '',
  detailedBiography: '',
  profilePicture: '',
  parentId: '',
  partnerIds: [],
  childrenIds: [],
  milestones: [],
  isDeleted: false
});

// File Management
const rawFile = ref(null);
const imagePreview = ref(null);

// Search Layer UI States
const parentSearch = ref('');
const parentResults = ref([]);
const selectedParentName = ref('');

const partnerSearch = ref('');
const partnerResults = ref([]);
const selectedPartnersMap = reactive({});

const childSearch = ref('');
const childResults = ref([]);
const selectedChildrenMap = reactive({});

let searchTimeout = null;

onMounted(async () => {
  if (route.params.id) {
    isEditMode.value = true;
    await loadMemberData(route.params.id);
  }
});

// Load existing profile context using Node API
const loadMemberData = async (id) => {
  try {
    const data = await api.getPersonById(id);
    if (data) {
      Object.assign(form, data);
      imagePreview.value = form.profilePicture;
      
      // Resolve names for linked parent badge
      if (form.parentId) {
        const parentData = await api.getPersonById(form.parentId);
        if (parentData) selectedParentName.value = parentData.name;
      }
      
      // Resolve names for partners
      if (form.partnerIds && form.partnerIds.length) {
        const partners = await api.getPeopleByIds(form.partnerIds);
        partners.forEach(p => { selectedPartnersMap[p.id] = p.name; });
      }

      // Resolve names for children
      if (form.childrenIds && form.childrenIds.length) {
        const children = await api.getPeopleByIds(form.childrenIds);
        children.forEach(c => { selectedChildrenMap[c.id] = c.name; });
      }
    }
  } catch (err) {
    uiError.value = "Failed to pull profile configurations: " + err.message;
  }
};

// Search people using Node REST Endpoint
const searchPeople = (type) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    const queryText = type === 'parent' ? parentSearch.value : type === 'partner' ? partnerSearch.value : childSearch.value;
    if (!queryText || queryText.trim().length < 2) return;

    try {
      const res = await api.getPeople(`search=${encodeURIComponent(queryText.trim())}&limit=5`);
      const list = res.people || [];

      if (type === 'parent') parentResults.value = list;
      else if (type === 'partner') partnerResults.value = list;
      else if (type === 'child') childResults.value = list;
    } catch (err) {
      console.error("Lookup query failed", err);
    }
  }, 300);
};

// Relation Pick and Clear Bindings
const selectParent = (person) => {
  form.parentId = person.id;
  selectedParentName.value = person.name;
  parentResults.value = [];
  parentSearch.value = '';
};

const clearParent = () => {
  form.parentId = '';
  selectedParentName.value = '';
};

const addPartner = (person) => {
  if (!form.partnerIds.includes(person.id)) {
    form.partnerIds.push(person.id);
    selectedPartnersMap[person.id] = person.name;
  }
  partnerResults.value = [];
  partnerSearch.value = '';
};

const removePartner = (id) => {
  form.partnerIds = form.partnerIds.filter(pId => pId !== id);
  delete selectedPartnersMap[id];
};

const addChild = (person) => {
  if (!form.childrenIds.includes(person.id)) {
    form.childrenIds.push(person.id);
    selectedChildrenMap[person.id] = person.name;
  }
  childResults.value = [];
  childSearch.value = '';
};

const removeChild = (id) => {
  form.childrenIds = form.childrenIds.filter(cId => cId !== id);
  delete selectedChildrenMap[id];
};

// Handle Image Picker & Show Preview
const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  rawFile.value = file;
  imagePreview.value = URL.createObjectURL(file);
};

// Form Submit to Node.js Backend
const handleSubmit = async () => {
  isSaving.value = true;
  uiError.value = null;

  try {
    const formData = new FormData();
    if (rawFile.value) {
      formData.append('profilePicture', rawFile.value);
    }
    formData.append('data', JSON.stringify(form));

    if (isEditMode.value) {
      await api.updatePerson(route.params.id, formData);
    } else {
      await api.createPerson(formData);
    }

    router.push({ name: 'admin-dashboard' });
  } catch (err) {
    uiError.value = "Failed to commit record: " + err.message;
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.form-container {
  max-width: 850px;
  margin: 2rem auto;
  padding: 0 1rem;
  font-family: system-ui, sans-serif;
}
.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}
.back-btn {
  background: none;
  border: 1px solid #d1d5db;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}
.main-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
.form-section {
  background: white;
  border: 1px solid #e5e7eb;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
h3 {
  margin-top: 0;
  margin-bottom: 0.25rem;
  color: #111827;
}
.section-desc {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}
.col-span-2 {
  grid-column: span 2;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
}
label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}
input[type="text"], input[type="date"], select, textarea {
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  width: 100%;
  box-sizing: border-box;
}
.radio-group {
  display: flex;
  gap: 1.5rem;
  padding: 0.5rem 0;
}
.radio-group label {
  font-weight: normal;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
}
.pic-upload-group img {
  width: 90px;
  height: 90px;
  object-fit: cover;
  border-radius: 50%;
  border: 2px solid #e5e7eb;
  margin-top: 0.5rem;
}
.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-top: none;
  border-radius: 0 0 4px 4px;
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}
.search-item {
  padding: 0.625rem;
  cursor: pointer;
}
.search-item:hover {
  background-color: #f3f4f6;
}
.badges-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.selected-badge {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  width: fit-content;
}
.clear-x {
  cursor: pointer;
  color: #cd2626;
  font-weight: bold;
}
.actions-row {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1rem;
}
.submit-btn {
  background-color: #2563eb;
  color: white;
  border: none;
  padding: 0.875rem 2rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  font-size: 1rem;
}
.submit-btn:disabled {
  background-color: #93c5fd;
}
.error-banner {
  color: #dc2626;
  font-size: 0.9rem;
}
.mt-4 { margin-top: 1rem; }
</style>