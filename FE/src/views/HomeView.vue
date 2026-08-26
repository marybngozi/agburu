<template>
  <main class="landing-page">
    <nav class="site-nav"><RouterLink class="brand" to="/"><img :src="logo" alt="Agburu"/><span><b>agburu</b><small>Lineage archive</small></span></RouterLink><div><RouterLink to="/create-lineage">Create a lineage</RouterLink><RouterLink class="nav-admin" to="/login">Admin sign in</RouterLink><ThemeToggle /></div></nav>
    <section class="hero"><div><p class="eyebrow">A home for family stories</p><h1>Keep every branch<br><em>within reach.</em></h1><p class="lead">Agburu helps families preserve their history, relationships, and the stories that connect generations.</p><RouterLink class="cta" to="/create-lineage">Start a lineage <span>→</span></RouterLink></div><div class="hero-art"><div class="ring ring-one"></div><div class="ring ring-two"></div><div class="family-card card-one">Past</div><div class="family-card card-two">Present</div><div class="family-card card-three">Future</div></div></section>
    <section class="tribute"><img :src="basilImage" alt="Late Prince Basil C. Umeh" /><div><p class="eyebrow">In remembrance</p><h2>Inspired by a life well lived.</h2><p>Agburu was inspired by the passing of <strong>Late Prince Basil C. Umeh (Ezegoudo)</strong>—a husband, father, brother, and grandfather. May the memories we preserve keep the people we love close.</p></div></section>
    <section class="directory"><div class="section-heading"><div><p class="eyebrow">Explore</p><h2>Public lineages</h2></div><RouterLink to="/create-lineage">Request a lineage →</RouterLink></div><div v-if="loading" class="state">Loading lineages…</div><div v-else-if="lineages.length" class="lineage-grid"><RouterLink v-for="lineage in lineages" :key="lineage.id || lineage._id" :to="`/${lineage.slug}`" class="lineage-card"><div class="card-mark">{{ lineage.name.slice(0, 1) }}</div><div><h3>{{ lineage.name }}</h3><p>{{ lineage.description || 'A family history and lineage map.' }}</p><span>Open lineage →</span></div></RouterLink></div><div v-else class="state">No public lineages are published yet.</div></section>
    <footer>Agburu · Preserving family memory with care.</footer>
  </main>
</template>
<script setup>
import { onMounted, ref } from 'vue';
import { api } from '@/api';
import basilImage from '@/assets/late-prince-basil-umeh.jpeg';
import logo from '@/assets/agburu-logo.svg';
import ThemeToggle from '@/components/ui/ThemeToggle.vue';
const lineages = ref([]); const loading = ref(true);
onMounted(async () => { try { lineages.value = await api.getLineages(); } finally { loading.value = false; } });
</script>
<style scoped>
.landing-page{min-height:100vh;background:#f8f6ef;color:#17352d;font-family:Georgia,serif}.site-nav{max-width:1180px;margin:auto;padding:1.5rem 1.5rem;display:flex;justify-content:space-between;align-items:center}.brand{display:flex;align-items:center;gap:.55rem;text-decoration:none;color:#17352d}.brand img{width:48px;height:48px}.brand span{display:grid}.brand b{font:bold 1.6rem system-ui,sans-serif;letter-spacing:-.08em}.brand small{font:500 .62rem system-ui,sans-serif;text-transform:uppercase;letter-spacing:.15em;color:#7a8276;margin-top:.15rem}.site-nav div{display:flex;gap:1rem;align-items:center}.site-nav a{font:600 .86rem system-ui,sans-serif;color:#17352d;text-decoration:none}.nav-admin{padding:.65rem .9rem;border:1px solid #b8c4b7;border-radius:99px}.hero{max-width:1180px;margin:2rem auto 5rem;padding:2rem 1.5rem;display:grid;grid-template-columns:1.05fr .95fr;align-items:center;gap:4rem}.eyebrow{margin:0 0 .7rem;font:700 .7rem system-ui,sans-serif;text-transform:uppercase;letter-spacing:.16em;color:#b25433}.hero h1{font-size:clamp(3.2rem,7vw,6.8rem);line-height:.93;letter-spacing:-.08em;margin:0;color:#17352d}.hero h1 em{font-weight:400;color:#b25433}.lead{max-width:470px;font:1.08rem/1.65 system-ui,sans-serif;color:#52655c;margin:1.8rem 0}.cta{display:inline-flex;gap:2rem;padding:1rem 1.25rem;border-radius:99px;background:#17352d;color:#fff;text-decoration:none;font:600 .9rem system-ui,sans-serif}.hero-art{height:370px;position:relative;background:#dae3d8;border-radius:48% 52% 44% 56% / 48% 39% 61% 52%;overflow:hidden}.ring{position:absolute;border:1px solid #9aac9d;border-radius:50%}.ring-one{width:420px;height:420px;left:50%;top:50%;transform:translate(-50%,-50%)}.ring-two{width:270px;height:270px;left:50%;top:50%;transform:translate(-50%,-50%)}.family-card{position:absolute;padding:1rem 1.2rem;background:#fdfcf7;border-radius:8px;box-shadow:0 10px 30px #17352d20;font:italic 1.1rem Georgia,serif}.card-one{top:55px;left:62px}.card-two{top:150px;right:60px;background:#b25433;color:white}.card-three{bottom:48px;left:135px}.tribute{max-width:1000px;margin:0 auto 5rem;padding:1rem;display:grid;grid-template-columns:240px 1fr;gap:2.5rem;align-items:center;background:#efe6d7;border-radius:20px}.tribute img{width:100%;height:230px;object-fit:cover;object-position:62% center;border-radius:13px;filter:saturate(.82)}.tribute h2,.directory h2{font-size:clamp(2rem,4vw,3rem);letter-spacing:-.05em;margin:0}.tribute div{padding-right:2rem}.tribute div>p:last-child{font:1rem/1.7 system-ui,sans-serif;color:#52655c}.directory{max-width:1180px;margin:auto;padding:0 1.5rem 5rem}.section-heading{display:flex;justify-content:space-between;align-items:end;margin-bottom:1.5rem}.section-heading a{font:600 .85rem system-ui,sans-serif;color:#b25433}.lineage-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:1rem}.lineage-card{display:flex;gap:1rem;padding:1.25rem;text-decoration:none;color:#17352d;background:#fffdf8;border:1px solid #e5dfd2;border-radius:12px;transition:transform .2s}.lineage-card:hover{transform:translateY(-4px)}.card-mark{width:44px;height:44px;display:grid;place-items:center;border-radius:50%;background:#dae3d8;color:#17352d;font-size:1.4rem}.lineage-card h3{margin:0 0 .4rem;font-size:1.15rem}.lineage-card p{margin:0 0 1rem;font:.82rem/1.5 system-ui,sans-serif;color:#66736b}.lineage-card span,.state{font:600 .78rem system-ui,sans-serif;color:#b25433}.state{padding:2rem 0}footer{padding:2rem;text-align:center;background:#17352d;color:#dbe3d8;font:.75rem system-ui,sans-serif}@media(max-width:720px){.hero{grid-template-columns:1fr;gap:2rem;margin-bottom:3rem}.hero-art{height:280px}.tribute{margin:0 1rem 3rem;grid-template-columns:1fr}.tribute img{height:200px}.tribute div{padding:0 1rem 1rem}.site-nav{padding:1rem;flex-wrap:wrap;row-gap:.6rem}.site-nav div{flex-wrap:wrap;row-gap:.5rem}.section-heading{align-items:start;gap:1rem;flex-direction:column}}
@media(max-width:640px){
  /* The absolutely-positioned Past/Present/Future cards were tuned for a
     wide hero-art blob and overlap each other once that blob shrinks on
     phones. Below this width the blob becomes a simple stacked card list
     instead of trying to rescue the same absolute coordinates. */
  .hero{margin:1.5rem auto 2.5rem;padding:1.5rem 1.25rem}
  .hero h1{font-size:clamp(2.5rem,12vw,3.6rem)}
  .lead{font-size:1rem;margin:1.4rem 0}
  .cta{width:100%;justify-content:center;box-sizing:border-box}
  .hero-art{height:auto;min-height:0;border-radius:20px;padding:1.75rem 1.25rem;display:flex;flex-direction:column;justify-content:center;gap:.65rem;background:#e4ebe2}
  .ring{display:none}
  .family-card{position:static;width:100%;box-sizing:border-box;text-align:center;font-size:1rem;padding:.85rem 1rem}
}

[data-theme="dark"] .landing-page { background: var(--agburu-bg); color: var(--agburu-text); }
[data-theme="dark"] .brand { color: var(--agburu-text); }
[data-theme="dark"] .brand small { color: var(--agburu-text-subtle); }
[data-theme="dark"] .site-nav a { color: var(--agburu-text); }
[data-theme="dark"] .nav-admin { border-color: var(--agburu-border); }
[data-theme="dark"] .hero h1 { color: var(--agburu-text); }
[data-theme="dark"] .lead { color: var(--agburu-text-muted); }
[data-theme="dark"] .cta { background: var(--agburu-accent); color: var(--agburu-bg); }
[data-theme="dark"] .hero-art { background: var(--agburu-surface-2); }
[data-theme="dark"] .ring { border-color: var(--agburu-border); }
[data-theme="dark"] .family-card { background: var(--agburu-surface); color: var(--agburu-text); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4); }
[data-theme="dark"] .card-two { background: var(--agburu-accent); color: var(--agburu-bg); }
[data-theme="dark"] .tribute { background: var(--agburu-surface-2); }
[data-theme="dark"] .tribute div > p:last-child { color: var(--agburu-text-muted); }
[data-theme="dark"] .lineage-card { color: var(--agburu-text); background: var(--agburu-surface); border-color: var(--agburu-border); }
[data-theme="dark"] .card-mark { background: var(--agburu-surface-2); color: var(--agburu-text); }
[data-theme="dark"] .lineage-card p { color: var(--agburu-text-muted); }
[data-theme="dark"] footer { background: var(--agburu-surface-2); color: var(--agburu-text-muted); }
</style>
