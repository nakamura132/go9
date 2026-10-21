import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import packageJson from "./package.json";
const { version } = packageJson;
export default defineConfig({ plugins: [react()], base: "/go9/", define: { __APP_VERSION__: JSON.stringify(version) } });
