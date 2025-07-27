import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          tsparticles: ["@tsparticles/react", "@tsparticles/engine", "@tsparticles/slim"],
          motion: ["framer-motion", "motion"],
          socket: ["socket.io-client"],
          radix: ["@radix-ui/react-slot", "@radix-ui/react-label"],
          heroui: ["@heroui/system", "@heroui/theme", "@heroui/toast", "@heroui/avatar"]
        }
      }
    }
  }
})
