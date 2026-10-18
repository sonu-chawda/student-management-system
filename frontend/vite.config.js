import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The backend allows this origin in CORS (see CORS_ORIGINS in backend/.env)
  server: { port: 5173 },
})
