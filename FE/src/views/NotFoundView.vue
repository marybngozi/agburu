<template>
  <AppShell>
    <main class="mx-auto max-w-xl px-4 py-24 text-center">
      <p class="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-clay-600">404</p>
      <h1 class="m-0 font-serif text-4xl tracking-tight">We couldn't find that page</h1>
      <p class="mt-4 text-stone-600 dark:text-slate-400">
        The link may be mistyped or the page may have moved.
      </p>
      <RouterLink to="/" class="btn-primary mt-8 inline-block no-underline">Back to Agburu</RouterLink>
    </main>
  </AppShell>
</template>

<script setup>
import AppShell from "@/components/ui/AppShell.vue";
</script>
