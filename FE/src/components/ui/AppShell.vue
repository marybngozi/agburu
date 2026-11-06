<template>
  <div class="min-h-screen bg-sand-50 font-sans text-forest-900 dark:bg-slate-950 dark:text-slate-100">
    <header class="border-b border-sand-200 bg-sand-50/90 dark:border-slate-800 dark:bg-slate-950/90">
      <nav class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <RouterLink to="/" class="flex items-center gap-2 text-forest-900 no-underline dark:text-slate-100">
          <img :src="logo" alt="" class="h-9 w-9" />
          <b class="text-xl font-bold tracking-[-0.08em]">agburu</b>
        </RouterLink>
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.86rem] font-semibold">
          <RouterLink to="/" class="text-forest-900 no-underline dark:text-slate-100">Lineages</RouterLink>
          <template v-if="isLoggedIn">
            <RouterLink :to="home.to" class="text-forest-900 no-underline dark:text-slate-100">{{ home.label }}</RouterLink>
            <button type="button" class="cursor-pointer border-none bg-transparent p-0 font-semibold text-forest-900 dark:text-slate-100" @click="logout">Sign out</button>
          </template>
          <template v-else>
            <RouterLink to="/login" class="text-forest-900 no-underline dark:text-slate-100">Log in</RouterLink>
            <RouterLink to="/signup" class="rounded-full border border-[#b8c4b7] px-3.5 py-1.5 text-forest-900 no-underline dark:border-slate-700 dark:text-slate-100">Sign up</RouterLink>
          </template>
          <ThemeToggle />
        </div>
      </nav>
    </header>
    <slot />
  </div>
</template>

<script setup>
import { computed } from "vue";
import logo from "@/assets/agburu-logo.svg";
import ThemeToggle from "@/components/ui/ThemeToggle.vue";
import { useAuth } from "@/composables/useAuth";

// Shared top bar for every page outside the public map/profile/home views
// (sign in, sign up, create a lineage, my lineages, and the admin screens),
// so they all read as one product instead of separate bare pages.
const { user, logout } = useAuth();
const isLoggedIn = computed(() => Boolean(user.value?.token));
const home = computed(() =>
  user.value?.role === "platform_admin"
    ? { to: "/admin", label: "Admin dashboard" }
    : { to: "/my-lineages", label: "My lineages" },
);
</script>
