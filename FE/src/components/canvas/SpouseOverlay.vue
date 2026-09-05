<template>
  <div class="flex flex-col gap-1.6">
    <div v-if="isLoading" class="py-2 text-center text-[0.7rem] text-gray-400">
      Loading list...
    </div>
    <div
      v-else-if="partners.length === 0"
      class="py-2 text-center text-[0.7rem] text-gray-400"
    >
      No records found.
    </div>

    <article
      v-else
      v-for="partner in partners"
      :key="partner.id"
      class="flex items-center justify-between gap-2 rounded-md border border-pink-200 bg-white p-2.2 dark:border-pink-900 dark:bg-slate-900 p-1.5"
    >
      <div class="flex min-w-0 items-center gap-2">
        <img
          :src="
            partner.profilePicture ||
            'https://placehold.co/100x100?text=No+Photo'
          "
          alt="Spouse avatar"
          class="h-7 w-7 rounded-full bg-gray-200 object-cover"
        />
        <div class="flex flex-col overflow-hidden">
          <span
            v-if="partner.titledName"
            class="text-[0.6rem] font-medium text-amber-700"
            >{{ partner.titledName }}</span
          >
          <span
            class="truncate text-xs font-medium text-gray-700 dark:text-slate-100"
            >{{ partner.name }}</span
          >
        </div>
      </div>
      <button
        type="button"
        class="cursor-pointer rounded border-0 bg-pink-50 px-1.6 py-1.12 text-[0.7rem] font-semibold text-pink-800 hover:bg-pink-100"
        @click="$emit('show-info', partner)"
      >
        ℹ️ Info
      </button>
    </article>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { api } from "@/api";

const props = defineProps({
  partnerIds: {
    type: Array,
    required: true,
    default: () => [],
  },
});

defineEmits(["show-info"]);

const partners = ref([]);
const isLoading = ref(false);

onMounted(async () => {
  if (props.partnerIds && props.partnerIds.length > 0) {
    isLoading.value = true;
    try {
      const res = await api.getPeopleByIds(props.partnerIds);
      // Filter out any archived/deleted records locally if needed
      partners.value = (res || []).filter((p) => !p.isDeleted);
    } catch (err) {
      console.error("Failed to query lateral partners:", err);
    } finally {
      isLoading.value = false;
    }
  }
});
</script>
