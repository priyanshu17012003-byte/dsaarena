// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite';

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react(), tailwindcss()],
   
// })

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  optimizeDeps: {
    include: ['@monaco-editor/react']
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          monaco: ['@monaco-editor/react']
        }
      }
    }
  }
})