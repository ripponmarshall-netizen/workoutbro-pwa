import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/workoutbro-pwa/',

  plugins: [
    react(),
    VitePWA({
      // We own the SW file — Workbox will inject the precache manifest into it
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.ts',

      // Don't auto-register — we control registration in registerServiceWorker.ts
      registerType: 'prompt',
      injectRegister: false,

      // We manage our own manifest.webmanifest in /public
      manifest: false,
      useCredentials: false,

      devOptions: {
        // Enable SW in dev so you can test offline behaviour with vite dev server
        enabled: true,
        type: 'module',
      },

      injectManifest: {
        // Glob patterns for assets Workbox will precache
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff2}',
        ],
        // Don't precache large media — handled by runtime caching in the SW
        globIgnores: [
          '**/exercise-media/**',
          '**/progress-photos/**',
        ],
      },
    }),
  ],

  server: { port: 4173 },
});
