import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        public: resolve(__dirname, "index.html"),
        admin: resolve(__dirname, "admin/index.html"),
        adminResetPassword: resolve(__dirname, "admin/reset-password/index.html"),
      },
    },
  },
});
