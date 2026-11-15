import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative asset paths: the same build works at a domain root (https://example.com/)
  // and under a sub-path (https://user.github.io/repo-name/) without any configuration.
  base: './',
  server: { port: 5173 },
  build: {
    // Monaco Editor alone is ~3 MB before compression; that is expected for an IDE.
    chunkSizeWarningLimit: 4500,
  },
});
