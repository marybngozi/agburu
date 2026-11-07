<template>
  <div
    class="fixed inset-0 z-1000 flex items-center justify-center bg-slate-900/60 p-4 font-sans backdrop-blur-sm"
    @click.self="$emit('close')"
  >
    <form
      class="w-full max-w-110 rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900"
      @submit.prevent="submit"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="m-0 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {{ anchor ? `Add to ${anchor.name}` : "Add the first person" }}
          </h3>
          <p class="mt-1 mb-0 text-sm text-slate-500 dark:text-slate-400">
            {{ anchor ? "They're created and connected in one step." : "They become the root of this map." }}
          </p>
        </div>
        <button type="button" class="border-0 bg-transparent text-lg text-slate-400" @click="$emit('close')" aria-label="Close">✕</button>
      </div>

      <div v-if="anchor" class="mt-4 flex overflow-hidden rounded-md border border-slate-300 dark:border-slate-600">
        <button
          v-for="option in OPTIONS"
          :key="option.value"
          type="button"
          :class="[
            'flex-1 px-3 py-2 text-sm font-medium',
            relation === option.value
              ? 'bg-slate-900 text-white dark:bg-slate-600'
              : 'bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-100',
          ]"
          @click="relation = option.value"
        >
          {{ option.label }}
        </button>
      </div>

      <label
        v-if="relation === 'child' && spouses.length"
        class="mt-4 grid gap-1 text-[0.72rem] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400"
      >
        Other parent
        <select v-model="otherParentId" required class="field-input normal-case">
          <option v-if="spouses.length > 1" value="" disabled>Choose a spouse…</option>
          <option v-for="spouse in spouses" :key="spouse.id" :value="spouse.id">{{ spouse.name }}</option>
        </select>
      </label>

      <div class="mt-4 grid gap-3">
        <input ref="nameInput" v-model="name" required maxlength="200" placeholder="Full name" class="field-input" />
        <div class="flex items-center gap-5 text-sm text-slate-700 dark:text-slate-200">
          <label class="flex cursor-pointer items-center gap-1"><input type="radio" v-model="gender" value="male" /> Male</label>
          <label class="flex cursor-pointer items-center gap-1"><input type="radio" v-model="gender" value="female" /> Female</label>
          <input v-model="birthDate" type="date" title="Birth date (optional)" class="field-input ml-auto w-auto" />
        </div>
      </div>

      <p v-if="error" class="mt-3 mb-0 text-sm text-red-700 dark:text-red-400">{{ error }}</p>
      <div class="mt-5 flex justify-end gap-2">
        <button type="button" class="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" @click="$emit('close')">Cancel</button>
        <button
          type="submit"
          :disabled="saving"
          class="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-700"
        >
          {{ saving ? "Adding…" : anchor ? `Add ${relation}` : "Add as root" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { api } from "@/api";

const props = defineProps({
  lineageId: { type: String, required: true },
  // The person being added to; null means the lineage is empty (add root).
  anchor: { type: Object, default: null },
  initialRelation: { type: String, default: "child" },
  // The anchor's spouses — the child's other parent is chosen from these.
  spouses: { type: Array, default: () => [] },
});
const emit = defineEmits(["close", "added"]);

const OPTIONS = [
  { value: "child", label: "Child" },
  { value: "spouse", label: "Spouse" },
  { value: "parent", label: "Parent" },
];
const relation = ref(props.initialRelation);
// One spouse is the obvious other parent; with several, the user must choose.
const otherParentId = ref(props.spouses.length === 1 ? props.spouses[0].id : "");
const name = ref("");
const gender = ref("male");
const birthDate = ref("");
const saving = ref(false);
const error = ref("");
const nameInput = ref(null);

onMounted(() => nameInput.value?.focus());

const submit = async () => {
  saving.value = true;
  error.value = "";
  try {
    await api.quickAddPerson(props.lineageId, {
      relation: props.anchor ? relation.value : "root",
      anchorPersonId: props.anchor?.id,
      otherParentId: relation.value === "child" && props.spouses.length ? otherParentId.value : undefined,
      person: { name: name.value, gender: gender.value, birthDate: birthDate.value },
    });
    emit("added");
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    saving.value = false;
  }
};
</script>
