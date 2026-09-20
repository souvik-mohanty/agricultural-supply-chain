import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Forward API calls to the Spring Boot backend so the browser sees a single origin.
    proxy: {
      '/api': 'http://localhost:8080',
      '/actuator': 'http://localhost:8080', // health check used by the "waking up the server" page
    },
  },
})
