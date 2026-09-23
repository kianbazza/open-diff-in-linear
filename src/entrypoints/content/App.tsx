import { useSyncExternalStore } from "react";
import { linearUrl } from "@/lib/linear-url";
import { openLinearUrl } from "@/lib/navigate";
import { pillPresentation } from "@/lib/pill";
import type { PageStore } from "./store";

export function App({ store }: { store: PageStore }) {
  const state = useSyncExternalStore(store.subscribe, store.get, store.get);
  const page = state.page;
  if (page === null) return null;

  const label = pillPresentation(
    state.settings.openTarget,
    state.flipHeld,
  ).label;
  return (
    <button
      type="button"
      className="odil-pill"
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.preventDefault();
        const { target } = pillPresentation(
          state.settings.openTarget,
          event.altKey,
        );
        openLinearUrl(linearUrl(page, target), "click");
      }}
    >
      {label}
    </button>
  );
}
