<template>
  <div
    class="fixed inset-0 z-1000 flex items-center justify-center bg-slate-900/60 p-4 font-sans backdrop-blur-sm"
    @click.self="$emit('close')"
  >
    <form
      class="max-h-[92vh] w-full max-w-120 overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900"
      @submit.prevent="submit"
    >
      <div class="flex items-start justify-between gap-3">
        <h3 class="m-0 text-lg font-semibold text-slate-900 dark:text-slate-100">Edit {{ person.name }}</h3>
        <button type="button" class="border-0 bg-transparent text-lg text-slate-400" @click="$emit('close')" aria-label="Close">✕</button>
      </div>

      <div class="mt-4 flex items-center gap-4">
        <Avatar :src="photoPreview || person.profilePicture" :name="form.name || person.name" :size="64" />
        <label class="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
          {{ photoFile ? "Change photo" : person.profilePicture ? "Replace photo" : "Add a photo" }}
          <input type="file" accept="image/*" class="hidden" @change="pickPhoto" />
        </label>
      </div>

      <div class="mt-4 grid gap-3">
        <label class="grid gap-1 text-[0.72rem] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
          Full name
          <input v-model="form.name" required maxlength="200" class="field-input normal-case" />
        </label>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="grid gap-1 text-[0.72rem] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            Title
            <select v-model="form.title" class="field-input normal-case">
              <option v-for="title in TITLES" :key="title" :value="title">{{ title || "None" }}</option>
            </select>
          </label>
          <label class="grid gap-1 text-[0.72rem] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            Titled name
            <input v-model="form.titledName" maxlength="200" placeholder="e.g. Nze" class="field-input normal-case" />
          </label>
        </div>
        <div class="flex items-center gap-5 text-sm text-slate-700 dark:text-slate-200">
          <label class="flex cursor-pointer items-center gap-1"><input type="radio" v-model="form.gender" value="male" /> Male</label>
          <label class="flex cursor-pointer items-center gap-1"><input type="radio" v-model="form.gender" value="female" /> Female</label>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="grid gap-1 text-[0.72rem] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            Born
            <input v-model="form.birthDate" type="date" class="field-input normal-case" />
          </label>
          <label class="grid gap-1 text-[0.72rem] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            Died (blank if alive)
            <input v-model="form.deathDate" type="date" class="field-input normal-case" />
          </label>
        </div>

        <label
          v-if="canChangeOtherParent"
          class="grid gap-1 text-[0.72rem] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400"
        >
          Other parent
          <select v-model="otherParentId" class="field-input normal-case">
            <option value="">Not recorded</option>
            <option v-for="spouse in spouses" :key="spouse.id" :value="spouse.id">{{ spouse.name }}</option>
          </select>
        </label>
      </div>

      <p v-if="error" class="mt-3 mb-0 text-sm text-red-700 dark:text-red-400">{{ error }}</p>
      <div class="mt-5 flex flex-wrap items-center justify-between gap-2">
        <router-link
          v-if="person.canEdit"
          :to="`/admin/edit-member/${person.id}`"
          class="text-sm text-slate-500 underline dark:text-slate-400"
        >
          Full editor (biography, milestones) →
        </router-link>
        <span v-else></span>
        <div class="flex gap-2">
          <button type="button" class="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" @click="$emit('close')">Cancel</button>
          <button type="submit" :disabled="saving" class="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-700">
            {{ saving ? "Saving…" : "Save" }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { api } from "@/api";
import Avatar from "@/components/ui/Avatar.vue";
import { resolvePeople } from "@/composables/resolvePeople";

const props = defineProps({
  person: { type: Object, required: true },
  lineageId: { type: String, default: "" },
  // Set when this person hangs under a parent on the map: that parent's
  // spouses are the choices for the "other parent" field.
  treeParentId: { type: String, default: "" },
  spouseIds: { type: Array, default: () => [] },
  knownPeople: { type: Array, default: () => [] },
});
const emit = defineEmits(["close", "saved"]);

const TITLES = ["", "Mr.", "Mrs.", "Ms.", "Dr.", "Prof.", "Chief"];
const day = (value) => (value ? String(value).slice(0, 10) : "");
const form = reactive({
  name: props.person.name || "",
  title: props.person.title || "",
  titledName: props.person.titledName || "",
  gender: props.person.gender || "male",
  birthDate: day(props.person.birthDate),
  deathDate: day(props.person.deathDate),
});
const original = JSON.stringify(form);

const photoFile = ref(null);
const photoPreview = ref("");
const pickPhoto = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  photoFile.value = file;
  photoPreview.value = URL.createObjectURL(file);
};

const spouses = ref([]);
const originalOtherParentId = props.person.otherParent?.id || "";
const otherParentId = ref(originalOtherParentId);
const canChangeOtherParent = computed(() => !!props.lineageId && !!props.treeParentId);
if (props.lineageId && props.treeParentId) {
  resolvePeople(props.spouseIds, props.knownPeople).then((found) => {
    // Keep the current other parent selectable even if the lists differ.
    const current = props.person.otherParent;
    spouses.value = current && !found.some((p) => p.id === current.id) ? [...found, current] : found;
  });
}

const saving = ref(false);
const error = ref("");

const submit = async () => {
  saving.value = true;
  error.value = "";
  try {
    if (JSON.stringify(form) !== original || photoFile.value) {
      const body = new FormData();
      if (photoFile.value) body.append("profilePicture", photoFile.value);
      body.append("data", JSON.stringify({ ...form, deathDate: form.deathDate || null }));
      await api.updatePerson(props.person.id, body);
    }
    if (canChangeOtherParent.value && otherParentId.value !== originalOtherParentId) {
      await api.setOtherParent(props.lineageId, props.person.id, otherParentId.value);
    }
    emit("saved");
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    saving.value = false;
  }
};
</script>
