import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    allowedHosts: ['localhost', '127.0.0.1', '0.0.0.0', "897a-2402-8100-2674-e258-b431-23d8-3bb9-86d6.ngrok-free.app"],
  },
})
