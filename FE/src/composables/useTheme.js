import { ref, watchEffect } from "vue";

const STORAGE_KEY = "agburu-theme";

const getPreferredTheme = () => {
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  }
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "light";
};

// Module-level singleton so every component shares one reactive theme value,
// and the attribute is applied as soon as this module is first imported
// (see main.js), before the app mounts.
const theme = ref(getPreferredTheme());

const applyTheme = (value) => {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", value);
};

applyTheme(theme.value);

watchEffect(() => {
  applyTheme(theme.value);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, theme.value);
  }
});

export function useTheme() {
  const toggleTheme = () => {
    theme.value = theme.value === "dark" ? "light" : "dark";
  };
  const setTheme = (value) => {
    theme.value = value;
  };
  return { theme, toggleTheme, setTheme };
}
