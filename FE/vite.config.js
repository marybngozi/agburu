import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // @tailwindcss/vite handles the whole Tailwind build (scanning templates,
  // generating utilities, vendor-prefixing via Lightning CSS) — no
  // tailwind.config.js or postcss.config.js needed. Its only job is
  // reading the @import "tailwindcss" in src/assets/main.css.
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})