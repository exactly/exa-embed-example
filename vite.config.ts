import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/exa-embed-example/",
  plugins: [react()],
});
