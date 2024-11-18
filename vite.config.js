import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  envPrefix: ['VITE_', 'NOTION_'],
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/notion': {
        target: process.env.API_URL || 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
});