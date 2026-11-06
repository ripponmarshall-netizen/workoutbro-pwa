import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves this repo at /workoutbro-pwa/
export default defineConfig({
  base: '/workoutbro-pwa/',
  plugins: [react()],
  server: { port: 4173 },
});
