import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 1420,
    strictPort: true,
  },
  clearScreen: false,
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules\/(react(-dom)?)\//, priority: 30 },
            { name: 'query', test: /node_modules\/@tanstack\//, priority: 25 },
            { name: 'openai', test: /node_modules\/openai\//, priority: 25 },
            {
              name: 'vendor-ui',
              test: /node_modules\/(radix-ui|sonner|class-variance-authority|clsx|tailwind-merge|tw-animate-css)\//,
              priority: 15,
            },
          ],
        },
      },
    },
  },
})