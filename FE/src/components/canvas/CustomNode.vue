<template>
  <div
    class="relative box-border w-65 rounded-lg border-t-2 border-r-2 border-b-2 border-t-gray-300 border-r-gray-300 border-b-gray-300 bg-white p-3 font-sans dark:border-t-slate-700 dark:border-r-slate-700 dark:border-b-slate-700 dark:bg-slate-900"
    :class="[genderBorderClass, nodeShadowClass]"
  >
    <!-- Node Content Area -->
    <div class="mb-3 flex items-center gap-3">
      <img
        :src="
          data.profilePicture || 'https://placehold.co/100x100?text=No+Photo'
        "
        alt="Avatar"
        class="h-12.5 w-12.5 rounded-full border-2 border-gray-100 bg-gray-100 object-cover dark:border-slate-800 dark:bg-slate-800"
      />

      <div class="flex flex-1 flex-col gap-0.6 overflow-hidden">
        <div class="flex flex-wrap gap-1">
          <span
            v-if="data.title"
            class="rounded-[3px] bg-sky-100 px-1.2 py-0.4 text-[0.65rem] font-semibold text-sky-700"
            >{{ data.title }}</span
          >
          <span
            v-if="data.titledName"
            class="rounded-[3px] bg-amber-100 px-1.2 py-0.4 text-[0.65rem] font-semibold text-amber-700"
            >{{ data.titledName }}</span
          >
        </div>
        <div
          class="truncate text-[0.9rem] font-semibold text-gray-900 dark:text-slate-100"
        >
          {{ data.name }}
        </div>
      </div>
    </div>

    <!-- Interactive Action Footer Inside Node Box -->
    <div
      class="flex justify-between gap-1.4 border-t border-gray-100 pt-2 dark:border-slate-700"
    >
      <!-- Info Button: Opens Quick Bio Popup Summary Modal -->
      <button
        type="button"
        class="cursor-pointer rounded px-1.6 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 dark:text-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700"
        @click="$emit('show-info', data)"
        title="View Summary Biography"
      >
        ℹ️ Info
      </button>

      <button
        v-if="data.partnerIds && data.partnerIds.length"
        type="button"
        class="cursor-pointer rounded px-2 py-1 text-xs font-medium text-pink-800 bg-pink-100 hover:bg-pink-200"
        @click="toggleSpouseDrawer"
      >
        ♡ Spouse{{ data.partnerIds.length > 1 ? "s" : "" }} ({{
          data.partnerIds.length
        }})
      </button>
    </div>

    <div
      v-if="showSpouseDrawer"
      class="before:content-[''] before:absolute before:top-12 before:right-full before:w-8.75 before:border-t-[3px] before:border-t-pink-600 absolute top-2.5 left-[calc(100%+35px)] z-50 w-55 rounded-[9px] border-2 border-pink-600 bg-[#fffdfb] p-2 shadow-[0_12px_24px_rgba(131,24,67,0.15)] dark:bg-slate-900"
    >
      <div
        class="flex items-center justify-between border-b border-pink-100 pb-1.8 text-xs font-bold text-pink-800 dark:border-slate-700"
      >
        <span>Spouse{{ data.partnerIds.length > 1 ? "s" : "" }}</span
        ><button
          class="cursor-pointer border-0 bg-transparent text-xl leading-none text-pink-800"
          @click="showSpouseDrawer = false"
        >
          ×
        </button>
      </div>
      <div class="max-h-45 overflow-y-auto pt-2">
        <SpouseOverlay
          :partner-ids="data.partnerIds"
          @show-info="$emit('show-info', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import SpouseOverlay from "@/components/canvas/SpouseOverlay.vue";
// props passed automatically by Vue Flow mapping layout core engines
const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
});

defineEmits(["show-info"]);
const showSpouseDrawer = ref(false);
const toggleSpouseDrawer = () => {
  showSpouseDrawer.value = !showSpouseDrawer.value;
};

// Subtle gender coloring highlight on the node's left edge. Kept as a
// computed returning a complete, literal Tailwind class string (rather than
// building the class name from `data.gender` at runtime) so Tailwind's
// static scanner can see and generate it.
const genderBorderClass = computed(() => {
  const map = {
    male: "border-l-[6px] border-l-blue-600",
    female: "border-l-[6px] border-l-pink-500",
  };
  return map[props.data.gender] || "border-l-[6px] border-l-gray-400";
});

// Expanded state fully replaces the resting box-shadow (rather than adding
// to it), so this picks exactly one of the two literal shadow classes
// instead of combining them.
const nodeShadowClass = computed(() =>
  props.data.isExpanded
    ? "shadow-[0_10px_15px_-3px_rgba(37,99,235,0.1),0_4px_6px_-2px_rgba(37,99,235,0.05)]"
    : "shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05),0_2px_4px_-1px_rgba(0,0,0,0.03)]",
);
</script>
