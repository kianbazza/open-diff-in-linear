import { defineContentScript } from "#imports";

export default defineContentScript({
  matches: [
    "https://github.com/*",
    "https://app.graphite.dev/*",
    "https://app.graphite.com/*",
  ],
  main() {
    // PR page handling arrives in later changes.
  },
});
