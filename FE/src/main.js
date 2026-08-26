import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./assets/main.css";
import { useTheme } from "./composables/useTheme";

// Applies the saved/system theme to <html data-theme="..."> before mount.
useTheme();

const app = createApp(App);

app.use(router);
app.mount("#app");
