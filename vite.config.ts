// vite.config.ts
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';

// Завантаження змінних середовища
dotenv.config();


export default defineConfig({
  envPrefix: ['VITE_', 'NOTION_'],
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api/notion': {
        target: 'https://api.notion.com/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/notion/, ''),
        headers: {
          'Notion-Version': '2022-06-28',
        },
      },
    },
  },
});