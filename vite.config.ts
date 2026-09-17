import { defineConfig } from 'vite';

// GitHub Pages serves a project site from /<repo>/, so the base must match the
// repository name. Override with SKILLS_LAB_BASE when hosting elsewhere.
const base = process.env.SKILLS_LAB_BASE ?? '/skills-lab/';

export default defineConfig({
  base,
  build: { target: 'esnext', chunkSizeWarningLimit: 2400 },
  server: { port: 5183 },
});
