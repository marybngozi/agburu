<template>
  <div class="relative" ref="wrapperEl">
    <input
      type="text"
      class="field-input"
      :value="displayValue"
      :placeholder="disabled ? placeholder : selectedOption ? selectedOption.label : placeholder"
      :disabled="disabled"
      autocomplete="off"
      @focus="openForEditing"
      @input="onInput"
      @keydown="onKeydown"
    />
    <ul
      v-if="isOpen && filteredOptions.length"
      class="absolute top-[calc(100%+0.25rem)] left-0 right-0 z-20 m-0 max-h-56 list-none overflow-y-auto
        rounded-md border border-slate-300 bg-white p-1 shadow-lg
        dark:border-slate-700 dark:bg-slate-900"
      role="listbox"
    >
      <li
        v-for="(option, index) in filteredOptions"
        :key="option.value"
        role="option"
        class="cursor-pointer rounded px-2.5 py-2 text-sm text-slate-900 dark:text-slate-100"
        :class="index === activeIndex && 'bg-clay-50 dark:bg-clay-900/40'"
        @mousedown.prevent="selectOption(option)"
        @mouseenter="activeIndex = index"
      >
        {{ option.label }}
      </li>
    </ul>
    <p
      v-else-if="isOpen && query"
      class="absolute top-[calc(100%+0.25rem)] left-0 right-0 z-20 m-0 rounded-md border border-slate-300
        bg-white px-2.5 py-2 text-sm text-slate-400 shadow-lg
        dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500"
    >
      No matches
    </p>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

// Options as [{ value, label }]. modelValue is the plain value (matches how
// a native <select v-model> behaves), so this drops in as a replacement
// without changing how the parent reads/writes the selection.
const props = defineProps({
  modelValue: { type: String, default: "" },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: "Search…" },
  disabled: { type: Boolean, default: false },
});
const emit = defineEmits(["update:modelValue"]);

const wrapperEl = ref(null);
const query = ref("");
const isOpen = ref(false);
const isEditing = ref(false);
const activeIndex = ref(-1);

const selectedOption = computed(
  () => props.options.find((option) => option.value === props.modelValue) || null,
);

// While the user is actively typing a search query, show what they typed;
// otherwise show the selected option's label (or nothing, handled by the
// placeholder) — same behavior a native <select> gives for free.
const displayValue = computed(() => (isEditing.value ? query.value : selectedOption.value?.label ?? ""));

const filteredOptions = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return props.options;
  return props.options.filter((option) => option.label.toLowerCase().includes(q));
});

function openForEditing() {
  if (props.disabled) return;
  isEditing.value = true;
  query.value = "";
  isOpen.value = true;
  activeIndex.value = -1;
}

function onInput(event) {
  query.value = event.target.value;
  isOpen.value = true;
  activeIndex.value = -1;
}

function selectOption(option) {
  emit("update:modelValue", option.value);
  closeAndReset();
}

function closeAndReset() {
  isEditing.value = false;
  isOpen.value = false;
  query.value = "";
  activeIndex.value = -1;
}

function onKeydown(event) {
  if (event.key === "Escape") {
    closeAndReset();
    event.target.blur();
    return;
  }
  if (event.key === "ArrowDown") {
    event.preventDefault();
    if (!isOpen.value) {
      isOpen.value = true;
      return;
    }
    activeIndex.value = Math.min(activeIndex.value + 1, filteredOptions.value.length - 1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    activeIndex.value = Math.max(activeIndex.value - 1, 0);
  } else if (event.key === "Enter") {
    event.preventDefault();
    const option = filteredOptions.value[activeIndex.value];
    if (option) selectOption(option);
  }
}

function handleClickOutside(event) {
  if (wrapperEl.value && !wrapperEl.value.contains(event.target)) closeAndReset();
}

onMounted(() => document.addEventListener("mousedown", handleClickOutside));
onBeforeUnmount(() => document.removeEventListener("mousedown", handleClickOutside));

watch(
  () => props.disabled,
  (isDisabled) => {
    if (isDisabled) closeAndReset();
  },
);
</script>

<!-- No custom CSS needed — every element here is in our own template, so
     Tailwind utility classes (including the shared .field-input from
     src/assets/main.css) cover the whole component. -->
