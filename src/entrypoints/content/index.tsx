import "./style.css";
import { createRoot } from "react-dom/client";
import { createShadowRootUi, defineContentScript } from "#imports";
import { App } from "./App";
import { startAutomaticMode } from "./automatic";
import { startPageController } from "./controller";
import { startGithubTab } from "./github-tab";
import { createPageStore } from "./store";

export default defineContentScript({
  matches: [
    "https://github.com/*",
    "https://app.graphite.dev/*",
    "https://app.graphite.com/*",
  ],
  cssInjectionMode: "ui",
  async main(ctx) {
    const store = createPageStore();
    startPageController(ctx, store);
    const automatic = startAutomaticMode(ctx, store);
    startGithubTab(ctx, store, { beforeHandoff: automatic.cancel });

    const ui = await createShadowRootUi(ctx, {
      name: "open-diff-in-linear",
      position: "inline",
      anchor: "html",
      append: "last",
      onMount(container) {
        const host = document.createElement("div");
        container.append(host);
        const root = createRoot(host);
        root.render(<App store={store} onStay={automatic.cancel} />);
        return root;
      },
      onRemove(root) {
        root?.unmount();
      },
    });
    ui.mount();
  },
});
