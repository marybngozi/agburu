<template>
  <div class="fixed inset-0 z-1000 flex items-center justify-center bg-slate-900/60 p-4 font-sans backdrop-blur-sm" @click.self="$emit('close')">
    <div class="animate-[modal-pop_0.25s_cubic-bezier(0.16,1,0.3,1)] flex w-full max-w-130 flex-col overflow-hidden rounded-xl bg-white shadow-[0_20px_25px_-5px_rgba(0,0,0,0.15),0_10px_10px_-5px_rgba(0,0,0,0.04)] dark:bg-slate-900">
      <div class="flex items-start justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800">
        <div>
          <span v-if="activePerson.title || activePerson.titledName" class="flex gap-1.4">
            <span v-if="activePerson.title" class="rounded bg-sky-100 px-1.6 py-0.6 text-[0.7rem] font-semibold text-sky-700">{{ activePerson.title }}</span>
            <span v-if="activePerson.titledName" class="rounded bg-amber-100 px-1.6 py-0.6 text-[0.7rem] font-semibold text-amber-700">{{ activePerson.titledName }}</span>
          </span>
          <h3 class="mt-1 text-[1.35rem] font-bold text-slate-900 dark:text-slate-100">{{ activePerson.name }}</h3>
        </div>
        <button type="button" class="cursor-pointer border-none bg-transparent p-1 text-[1.15rem] text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-100" @click="$emit('close')">✕</button>
      </div>

      <div class="max-h-[60vh] overflow-y-auto p-6">
        <div class="flex items-center gap-6">
          <img
            :src="activePerson.profilePicture || 'https://placehold.co/150x150?text=No+Photo'"
            alt="Profile Avatar"
            class="h-25 w-25 rounded-full border-[3px] border-slate-100 bg-slate-50 object-cover dark:border-slate-800 dark:bg-slate-800"
          />

          <div class="flex flex-1 flex-col gap-2">
            <div class="flex gap-2 text-sm">
              <span class="min-w-27.5 font-medium text-slate-500 dark:text-slate-400">Gender:</span>
              <span class="capitalize font-semibold text-slate-700 dark:text-slate-100">{{ activePerson.gender }}</span>
            </div>
            <div class="flex gap-2 text-sm">
              <span class="min-w-27.5 font-medium text-slate-500 dark:text-slate-400">Lineage Join:</span>
              <span class="capitalize font-semibold text-slate-700 dark:text-slate-100">{{ activePerson.modeOfJoining }}</span>
            </div>
            <div class="flex gap-2 text-sm">
              <span class="min-w-27.5 font-medium text-slate-500 dark:text-slate-400">Lifespan Period:</span>
              <span class="font-semibold text-slate-700 dark:text-slate-100">
                {{ formatDate(activePerson.birthDate) }} —
                {{ activePerson.deathDate ? formatDate(activePerson.deathDate) : 'Present (Alive)' }}
              </span>
            </div>
          </div>
        </div>

        <hr class="my-6 h-px border-0 bg-slate-100 dark:bg-slate-800" />

        <div>
          <h4 class="mb-2 text-[0.95rem] text-slate-800 dark:text-slate-100">Profile Summary</h4>
          <p v-if="activePerson.biographySummary" class="m-0 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {{ activePerson.biographySummary }}
          </p>
          <p v-else class="m-0 text-sm italic leading-relaxed text-slate-400 dark:text-slate-500">
            No short profile teaser summary provided for this lineage member record.
          </p>
        </div>
      </div>

      <div class="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-800">
        <button type="button" class="btn-secondary" @click="$emit('close')">Close</button>
        <button type="button" class="inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700" @click="navigateToFullProfile">
          Read More & View Tree →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const props = defineProps({
  activePerson: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close']);
const router = useRouter();

const navigateToFullProfile = () => {
  emit('close');
  // Routes user straight to the dedicated workspace page using the person unique id
  router.push({ name: 'profile', params: { id: props.activePerson.id } });
};

// Date String Formatter utility helper
const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};
</script>

<style scoped>
/* Entry pop animation cannot be expressed as a utility class alone */
@keyframes modal-pop {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
