<template>
  <img
    v-if="src && !failed"
    :src="src"
    :alt="name"
    :style="boxStyle"
    class="shrink-0 rounded-full bg-slate-200 object-cover dark:bg-slate-800"
    @error="failed = true"
  />
  <span
    v-else
    role="img"
    :aria-label="name"
    :style="[boxStyle, { background: colour, fontSize: `${size * 0.38}px` }]"
    class="inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold leading-none text-white"
  >{{ initials }}</span>
</template>

<script setup>
// A person's photo, or — when there isn't one — a coloured circle with their
// initials. The colour is derived from the name so the same person always
// looks the same wherever they appear.
import { computed, ref, watch } from "vue";

const props = defineProps({
  src: { type: String, default: "" },
  name: { type: String, default: "" },
  size: { type: Number, default: 40 },
});

const failed = ref(false);
watch(() => props.src, () => (failed.value = false));

const boxStyle = computed(() => ({ width: `${props.size}px`, height: `${props.size}px` }));

const initials = computed(() => {
  const words = props.name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
});

const colour = computed(() => {
  let hash = 0;
  for (const char of props.name) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return `hsl(${hash} 42% 40%)`;
});
</script>
