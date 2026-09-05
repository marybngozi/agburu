<template>
  <main
    class="min-h-screen bg-sand-50 font-serif text-forest-900 dark:bg-slate-950 dark:text-slate-100"
  >
    <nav
      class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-y-2.5 p-4 md:flex-nowrap md:gap-y-0 md:p-6"
    >
      <RouterLink
        class="flex items-center gap-2 text-forest-900 no-underline dark:text-slate-100"
        to="/"
      >
        <img :src="logo" alt="Agburu" class="h-12 w-12" />
        <span class="grid">
          <b class="font-sans text-2xl font-bold tracking-[-0.08em]">agburu</b>
          <small
            class="mt-0.5 font-sans text-[0.62rem] font-medium uppercase tracking-[0.15em] text-stone-500 dark:text-slate-500"
            >Lineage archive</small
          >
        </span>
      </RouterLink>
      <div
        class="flex flex-wrap items-center gap-x-4 gap-y-2 md:flex-nowrap md:gap-y-4"
      >
        <RouterLink
          class="font-sans text-[0.86rem] font-semibold text-forest-900 no-underline dark:text-slate-100"
          to="/create-lineage"
          >Create a lineage</RouterLink
        >
        <RouterLink
          class="rounded-full border border-[#b8c4b7] px-3.5 py-2.5 font-sans text-[0.86rem] font-semibold text-forest-900 no-underline dark:border-slate-700 dark:text-slate-100"
          to="/login"
          >Admin sign in</RouterLink
        >
        <ThemeToggle />
      </div>
    </nav>
    <section
      class="mx-auto mt-6 mb-10 grid max-w-6xl grid-cols-1 items-center gap-8 px-5 py-6 sm:mt-8 sm:mb-12 sm:px-6 sm:py-8 md:mb-20 md:grid-cols-[1.05fr_0.95fr] md:gap-16"
    >
      <div>
        <p
          class="mb-3 font-sans text-[0.7rem] font-bold uppercase tracking-[0.16em] text-clay-600"
        >
          A home for family stories
        </p>
        <h1
          class="m-0 text-[clamp(2.5rem,12vw,3.6rem)] leading-[0.93] tracking-[-0.08em] text-forest-900 sm:text-[clamp(3.2rem,7vw,6.8rem)] dark:text-slate-100"
        >
          Keep every branch<br /><em class="font-normal text-clay-600"
            >within reach.</em
          >
        </h1>
        <p
          class="my-6 max-w-117.5 font-sans text-base leading-[1.65] text-stone-600 sm:my-7 sm:text-[1.08rem] dark:text-slate-400"
        >
          Agburu helps families preserve their history, relationships, and the
          stories that connect generations.
        </p>
        <RouterLink
          class="inline-flex w-full justify-center gap-8 rounded-full bg-forest-900 px-5 py-4 font-sans text-[0.9rem] font-semibold text-white no-underline sm:w-auto sm:justify-start dark:bg-clay-600 dark:text-slate-950"
          to="/create-lineage"
          >Start a lineage <span>→</span></RouterLink
        >
      </div>
      <div
        class="relative flex h-auto flex-col justify-center gap-2.5 overflow-hidden rounded-[20px] bg-[#e4ebe2] px-5 py-7 sm:block sm:h-70 sm:gap-0 sm:rounded-[48%_52%_44%_56%/48%_39%_61%_52%] sm:bg-[#dae3d8] sm:px-0 sm:py-0 md:h-92.5 dark:bg-slate-800"
      >
        <div
          class="hidden h-105 w-105 rounded-full border border-[#9aac9d] sm:absolute sm:top-1/2 sm:left-1/2 sm:block sm:-translate-x-1/2 sm:-translate-y-1/2 dark:border-slate-700"
        ></div>
        <div
          class="hidden h-67.5 w-67.5 rounded-full border border-[#9aac9d] sm:absolute sm:top-1/2 sm:left-1/2 sm:block sm:-translate-x-1/2 sm:-translate-y-1/2 dark:border-slate-700"
        ></div>
        <div
          class="static w-full rounded-lg bg-[#fdfcf7] px-4 py-3.4 text-center text-base font-serif italic shadow-[0_10px_30px_rgba(23,53,45,0.125)] sm:absolute sm:top-13.75 sm:left-15.5 sm:w-auto sm:px-4.8 sm:py-4 sm:text-left sm:text-[1.1rem] dark:bg-slate-900 dark:text-slate-100 dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
        >
          Past
        </div>
        <div
          class="static w-full rounded-lg bg-clay-600 px-4 py-3.4 text-center text-base font-serif text-white italic shadow-[0_10px_30px_rgba(23,53,45,0.125)] sm:absolute sm:top-37.5 sm:right-15 sm:w-auto sm:px-4.8 sm:py-4 sm:text-left sm:text-[1.1rem] dark:bg-clay-600 dark:text-slate-950 dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
        >
          Present
        </div>
        <div
          class="static w-full rounded-lg bg-[#fdfcf7] px-4 py-3.4 text-center text-base font-serif italic shadow-[0_10px_30px_rgba(23,53,45,0.125)] sm:absolute sm:bottom-12 sm:left-33.75 sm:w-auto sm:px-4.8 sm:py-4 sm:text-left sm:text-[1.1rem] dark:bg-slate-900 dark:text-slate-100 dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
        >
          Future
        </div>
      </div>
    </section>
    <section
      class="mx-4 mb-12 grid max-w-250 grid-cols-1 items-center gap-10 rounded-[20px] bg-sand-200 p-4 md:mx-auto md:mb-20 md:grid-cols-[240px_1fr] dark:bg-slate-800"
    >
      <img
        :src="basilImage"
        alt="Late Prince Basil C. Umeh"
        class="h-50 w-full rounded-[13px] object-cover object-[62%_center] saturate-82 md:h-57.5"
      />
      <div class="px-4 pb-4 md:px-0 md:pr-8 md:pb-0">
        <p
          class="mb-3 font-sans text-[0.7rem] font-bold uppercase tracking-[0.16em] text-clay-600"
        >
          In remembrance
        </p>
        <h2 class="m-0 text-[clamp(2rem,4vw,3rem)] tracking-tighter">
          Inspired by a life well lived.
        </h2>
        <p
          class="font-sans text-base leading-[1.7] text-stone-600 dark:text-slate-400"
        >
          Agburu was inspired by the passing of
          <!-- do not remove the hardcoded link -->
          <router-link to="profile/6a744d6185502bf16fb90dba">
            Late Prince Basil C. Umeh (Ezegoudo)
          </router-link>
          —a husband, father, brother, and grandfather. May the memories we
          preserve keep the people we love close.
        </p>
      </div>
    </section>
    <section class="mx-auto max-w-6xl px-6 pb-20">
      <div
        class="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end md:gap-0"
      >
        <div>
          <p
            class="mb-3 font-sans text-[0.7rem] font-bold uppercase tracking-[0.16em] text-clay-600"
          >
            Explore
          </p>
          <h2 class="m-0 text-[clamp(2rem,4vw,3rem)] tracking-tighter">
            Public lineages
          </h2>
        </div>
        <RouterLink
          class="font-sans text-[0.85rem] font-semibold text-clay-600"
          to="/create-lineage"
          >Request a lineage →</RouterLink
        >
      </div>
      <div
        v-if="loading"
        class="py-8 font-sans text-[0.78rem] font-semibold text-clay-600"
      >
        Loading lineages…
      </div>
      <div
        v-else-if="lineages.length"
        class="grid grid-cols-[repeat(auto-fit,minmax(270px,1fr))] gap-4"
      >
        <RouterLink
          v-for="lineage in lineages"
          :key="lineage.id || lineage._id"
          :to="`/${lineage.slug}`"
          class="flex gap-4 rounded-xl border border-sand-200 bg-sand-50 p-5 text-forest-900 no-underline transition-transform duration-200 hover:-translate-y-1 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <div
            class="grid h-11 w-11 place-items-center rounded-full bg-[#dae3d8] text-[1.4rem] text-forest-900 dark:bg-slate-800 dark:text-slate-100"
          >
            {{ lineage.name.slice(0, 1) }}
          </div>
          <div>
            <h3 class="m-0 mb-1.5 text-[1.15rem]">{{ lineage.name }}</h3>
            <p
              class="m-0 mb-4 font-sans text-[0.82rem] leading-normal text-stone-500 dark:text-slate-400"
            >
              {{ lineage.description || "A family history and lineage map." }}
            </p>
            <span class="font-sans text-[0.78rem] font-semibold text-clay-600"
              >Open lineage →</span
            >
          </div>
        </RouterLink>
      </div>
      <div
        v-else
        class="py-8 font-sans text-[0.78rem] font-semibold text-clay-600"
      >
        No public lineages are published yet.
      </div>
    </section>
    <footer
      class="bg-forest-900 p-8 text-center font-sans text-xs text-[#dbe3d8] dark:bg-slate-800 dark:text-slate-400"
    >
      Agburu · Preserving family memory with care.
    </footer>
  </main>
</template>
<script setup>
import { onMounted, ref } from "vue";
import { api } from "@/api";
import basilImage from "@/assets/late-prince-basil-umeh.jpeg";
import logo from "@/assets/agburu-logo.svg";
import ThemeToggle from "@/components/ui/ThemeToggle.vue";
const lineages = ref([]);
const loading = ref(true);
onMounted(async () => {
  try {
    lineages.value = await api.getLineages();
  } finally {
    loading.value = false;
  }
});
</script>
