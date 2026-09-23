import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  imports: false,
  vite: () => ({ plugins: [tailwindcss()] }),
  manifest: {
    name: "Open Diff in Linear",
    description:
      "Open GitHub and Graphite pull requests in Linear's review view.",
    permissions: ["storage"],
  },
});
