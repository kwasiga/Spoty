import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
  plugins: [react()],
  envDir: path.resolve(__dirname, ".."),
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
})
