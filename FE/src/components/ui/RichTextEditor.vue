<template>
  <div class="relative">
    <div
      ref="editorHost"
      class="richtext-host rounded bg-white dark:bg-slate-900"
      :class="!isReady && 'min-h-40 rounded border border-slate-300 dark:border-slate-700'"
    ></div>
    <p v-if="!isReady" class="mt-1.5 text-[0.8rem] italic text-slate-400 dark:text-slate-500">
      Loading editor…
    </p>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

// Quill is loaded from a CDN at runtime instead of being an npm dependency.
// This project's Cloudflare build uses `npm clean-install`, which requires
// package.json and package-lock.json to match exactly — adding a new
// dependency here isn't safe without being able to run `npm install`
// locally first to regenerate the lockfile. Loading the (small, stable)
// UMD build from a CDN sidesteps that entirely: no package.json change, no
// lockfile risk, and it only loads once no matter how many editors mount.
const QUILL_JS = "https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js";
const QUILL_CSS = "https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css";

let quillLoadPromise = null;
function loadQuill() {
  if (window.Quill) return Promise.resolve(window.Quill);
  if (quillLoadPromise) return quillLoadPromise;

  quillLoadPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${QUILL_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = QUILL_CSS;
      document.head.appendChild(link);
    }
    const existingScript = document.querySelector(`script[src="${QUILL_JS}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.Quill));
      existingScript.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.src = QUILL_JS;
    script.async = true;
    script.onload = () => resolve(window.Quill);
    script.onerror = () => reject(new Error("Failed to load the rich text editor."));
    document.head.appendChild(script);
  });
  return quillLoadPromise;
}

const props = defineProps({
  modelValue: { type: String, default: "" },
  placeholder: { type: String, default: "" },
});
const emit = defineEmits(["update:modelValue"]);

const editorHost = ref(null);
const isReady = ref(false);
let quill = null;
// Empty Quill content still serializes to this placeholder markup — treat
// it as "" so a never-touched editor doesn't write a stray empty paragraph
// into the field.
const EMPTY_HTML = "<p><br></p>";

onMounted(async () => {
  try {
    const Quill = await loadQuill();
    quill = new Quill(editorHost.value, {
      theme: "snow",
      placeholder: props.placeholder,
      modules: {
        toolbar: [
          [{ header: [2, 3, false] }],
          ["bold", "italic", "underline"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["blockquote", "link"],
          ["clean"],
        ],
      },
    });
    if (props.modelValue) quill.root.innerHTML = props.modelValue;
    quill.on("text-change", () => {
      const html = quill.root.innerHTML;
      emit("update:modelValue", html === EMPTY_HTML ? "" : html);
    });
    isReady.value = true;
  } catch (err) {
    // The editor host stays mounted as a plain empty box; the field simply
    // keeps whatever value it already had rather than losing content.
    console.error("Rich text editor failed to load:", err);
  }
});

// Keeps the editor in sync if the field is reset from outside (e.g.
// loading a different person's record into the same mounted form) without
// fighting the user's own typing — only applied while the editor itself
// isn't focused.
watch(
  () => props.modelValue,
  (value) => {
    if (!quill || document.activeElement === editorHost.value) return;
    if (quill.root.innerHTML === EMPTY_HTML && value === "") return;
    if (value !== quill.root.innerHTML) quill.root.innerHTML = value || "";
  },
);

onBeforeUnmount(() => {
  quill = null;
});
</script>

<!-- Only Quill's own internally-rendered markup (.ql-toolbar/.ql-container/
     .ql-editor and friends) needs plain CSS here — those elements aren't in
     our template, so they can't take Tailwind classes directly. Everything
     else about this component's own layout is Tailwind utilities above.
     Colors reference the same CSS variables Tailwind's utilities compile
     to (var(--color-...)), so this still tracks src/assets/main.css. -->
<style scoped>
.richtext-host :deep(.ql-toolbar.ql-snow) {
  border-color: var(--color-slate-300);
  border-radius: 0.25rem 0.25rem 0 0;
  font-family: var(--font-sans);
}
.richtext-host :deep(.ql-container.ql-snow) {
  border-color: var(--color-slate-300);
  border-radius: 0 0 0.25rem 0.25rem;
  font-family: var(--font-sans);
  font-size: 0.95rem;
  min-height: 10rem;
}
.richtext-host :deep(.ql-editor) {
  min-height: 10rem;
}

[data-theme="dark"] .richtext-host :deep(.ql-toolbar.ql-snow) {
  border-color: var(--color-slate-700);
  background: var(--color-slate-900);
}
[data-theme="dark"] .richtext-host :deep(.ql-container.ql-snow) {
  border-color: var(--color-slate-700);
}
[data-theme="dark"] .richtext-host :deep(.ql-editor) {
  color: var(--color-slate-100);
}
[data-theme="dark"] .richtext-host :deep(.ql-editor.ql-blank::before) {
  color: var(--color-slate-500);
}
[data-theme="dark"] .richtext-host :deep(.ql-snow .ql-stroke) {
  stroke: var(--color-slate-400);
}
[data-theme="dark"] .richtext-host :deep(.ql-snow .ql-fill) {
  fill: var(--color-slate-400);
}
[data-theme="dark"] .richtext-host :deep(.ql-snow .ql-picker) {
  color: var(--color-slate-400);
}
</style>
