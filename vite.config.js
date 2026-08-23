import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // OCULTA LOS SOURCEMAPS EN PRODUCCIÓN (evita que se vea tu código fuente)
    sourcemap: false,
    rollupOptions: {
      output: {
        // DIVIDE EL BUNDLE: React y ReactDOM van en un archivo aparte para cargar más rápido
        manualChunks: {
          vendor: ['react', 'react-dom'],
        }
      }
    }
  }
})