import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

/**
 * The only Vite config in the repo: one dev server, one build, four portals.
 * `appType: 'spa'` (the default, stated for clarity) makes both `vite` and
 * `vite preview` answer any extension-less path with index.html, so deep links
 * such as /doctor/prescribe or /admin/flagged/42 reload correctly.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // One backend origin for every portal. The browser only ever calls /api on
  // the frontend origin; Vite forwards it, so cookies stay same-origin.
  const apiOrigin = env.VITE_API_ORIGIN || 'http://127.0.0.1:8000';
  const proxy = { '/api': { target: apiOrigin, changeOrigin: true } };

  return {
    appType: 'spa',
    plugins: [react()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: { port: 5177, strictPort: true, proxy },
    preview: { port: 5177, strictPort: true, proxy },
    build: { sourcemap: true, target: 'es2022', outDir: 'dist' },
  };
});
