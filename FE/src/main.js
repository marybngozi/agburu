import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./assets/main.css";
import { useTheme } from "./composables/useTheme";
import { ApiError, setUnauthorizedHandler } from "./api";
import { clearSession } from "./composables/useAuth";
import { pushToast } from "./composables/useNotifications";

// Applies the saved/system theme to <html data-theme="..."> before mount.
useTheme();

// An expired or revoked session: drop it and send the user to sign in again,
// remembering where they were so they land back there afterwards.
setUnauthorizedHandler(() => {
  clearSession();
  const current = router.currentRoute.value;
  if (current.meta.requiresAuth) {
    router.push({ name: "login", query: { redirect: current.fullPath } });
  }
});

// Any API failure a screen didn't handle itself still reaches the user.
window.addEventListener("unhandledrejection", (event) => {
  if (event.reason instanceof ApiError) {
    event.preventDefault();
    pushToast(event.reason.message);
  }
});

const app = createApp(App);

app.use(router);
app.mount("#app");
