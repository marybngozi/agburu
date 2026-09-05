<template>
  <div class="max-w-212.5 mx-auto my-8 px-4 font-sans">
    <div class="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between mb-8">
      <h2>{{ isEditMode ? 'Edit Person Profile' : 'Add New Person' }}</h2>
      <button
        @click="$router.push({ name: 'admin-dashboard' })"
        class="bg-transparent border border-slate-300 text-slate-700 px-4 py-2 rounded cursor-pointer dark:border-slate-600 dark:text-slate-100"
      >
        ← Back to Dashboard
      </button>
    </div>

    <form @submit.prevent="handleSubmit" class="flex flex-col gap-8">
      <!-- SECTION A: Identity & Demographics -->
      <div class="bg-white border border-slate-200 p-5 sm:p-8 rounded-lg shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <h3 class="mt-0 mb-1 text-slate-900 dark:text-slate-100">Section A: Demographic Identity</h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div class="flex flex-col gap-2 relative">
            <label class="field-label">Academic/Civil Title</label>
            <select v-model="form.title" class="field-input">
              <option value="">None</option>
              <option value="Mr.">Mr.</option>
              <option value="Mrs.">Mrs.</option>
              <option value="Ms.">Ms.</option>
              <option value="Dr.">Dr.</option>
              <option value="Prof.">Prof.</option>
              <option value="Chief">Chief</option>
            </select>
          </div>

          <div class="flex flex-col gap-2 relative">
            <label class="field-label">Native/Traditional Titled Name</label>
            <input type="text" v-model="form.titledName" placeholder="e.g., Nze, Amina, Ichie" class="field-input" />
          </div>

          <div class="flex flex-col gap-2 relative sm:col-span-2">
            <label class="field-label">Full Name *</label>
            <input type="text" v-model="form.name" required placeholder="Given Name and Surname" class="field-input" />
          </div>

          <div class="flex flex-col gap-2 relative">
            <label class="field-label">Gender *</label>
            <div class="flex gap-6 py-2">
              <label class="text-sm font-normal text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer"><input type="radio" v-model="form.gender" value="male" required /> Male</label>
              <label class="text-sm font-normal text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer"><input type="radio" v-model="form.gender" value="female" required /> Female</label>
            </div>
          </div>

          <div class="flex flex-col gap-2 relative">
            <label class="field-label">Birth Date</label>
            <input type="date" v-model="form.birthDate" class="field-input" />
          </div>

          <div class="flex flex-col gap-2 relative">
            <label class="field-label">Death Date (Leave blank if alive)</label>
            <input type="date" v-model="form.deathDate" class="field-input" />
          </div>
        </div>

        <div class="flex flex-col gap-2 relative mt-4">
          <label class="field-label">Biography Summary (Teaser description)</label>
          <textarea v-model="form.biographySummary" rows="2" placeholder="Brief summary for popups..." class="field-input"></textarea>
        </div>

        <div class="flex flex-col gap-2 relative mt-4">
          <label class="field-label">Detailed Biography (Full historical records)</label>
          <RichTextEditor
            v-model="form.detailedBiography"
            placeholder="Deep historical context details..."
          />
        </div>

        <div class="flex flex-col gap-2 relative">
          <label class="field-label">Profile Picture</label>
          <input type="file" @change="handleFileChange" accept="image/*" />
          <div v-if="imagePreview">
            <img :src="imagePreview" alt="Preview" class="w-22.5 h-22.5 object-cover rounded-full border-2 border-slate-200 mt-2 dark:border-slate-700" />
          </div>
        </div>
      </div>

      <MilestoneInput v-model="form.milestones" />

      <div class="flex flex-col items-stretch gap-4 sm:items-end">
        <div v-if="uiError" class="text-red-600 text-sm">{{ uiError }}</div>
        <button
          type="submit"
          :disabled="isSaving"
          class="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white border-none rounded-md font-medium cursor-pointer text-base px-8 py-3.5 disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {{ isSaving ? 'Processing Records...' : isEditMode ? 'Update Person Profile' : 'Create Person and Choose Lineage' }}
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
import RichTextEditor from '@/components/ui/RichTextEditor.vue';
import { setPageTitle } from '@/composables/useDocumentMeta';

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
  birthDate: '',
  deathDate: '',
  biographySummary: '',
  detailedBiography: '',
  profilePicture: '',
  milestones: [],
  isDeleted: false
});

// File Management
const rawFile = ref(null);
const imagePreview = ref(null);

onMounted(async () => {
  if (route.params.id) {
    isEditMode.value = true;
    await loadMemberData(route.params.id);
  } else {
    setPageTitle('Add New Person · Agburu Admin');
  }
});

// Load existing profile context using Node API
const loadMemberData = async (id) => {
  try {
    const data = await api.getPersonById(id);
    if (data) {
      Object.assign(form, data);
      imagePreview.value = form.profilePicture;
      setPageTitle(`Edit ${data.name} · Agburu Admin`);
    }
  } catch (err) {
    uiError.value = "Failed to pull profile configurations: " + err.message;
  }
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
      const person = await api.createPerson(formData);
      router.push({ name: 'admin-lineages', query: { personId: person.id, personName: person.name } });
      return;
    }

    router.push({ name: 'admin-dashboard' });
  } catch (err) {
    uiError.value = "Failed to commit record: " + err.message;
  } finally {
    isSaving.value = false;
  }
};
</script>

