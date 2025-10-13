import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mix from "vite-plugin-mix";

export default defineConfig({
  plugins: [
    react(),
    // @ts-expect-error vite-plugin-mix: bad esm interop
    mix.default({ handler: "mock/api.ts" }),
  ],
});
