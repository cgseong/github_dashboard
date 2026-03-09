import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import coursesFilePlugin from './src/plugins/coursesFilePlugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), coursesFilePlugin()],
})
