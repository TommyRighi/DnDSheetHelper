import { defineConfig, loadEnv } from "vite";
import { pwaPlugin } from "./scripts/pwa.js";
import { cloudConfig } from "./src/cloud-config.js";

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const config = cloudConfig(env);
  return { base: "./", plugins: [pwaPlugin({ supabaseUrl: config?.url })] };
});
