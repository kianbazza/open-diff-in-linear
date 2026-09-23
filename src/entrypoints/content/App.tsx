import { useSyncExternalStore } from "react";
import { pillPresentation } from "@/lib/pill";
import { handoff } from "./handoff";
import type { PageStore } from "./store";

export function App({
  store,
  onStay,
}: {
  store: PageStore;
  onStay: () => void;
}) {
  const state = useSyncExternalStore(store.subscribe, store.get, store.get);
  const page = state.page;
  if (page === null) return null;

  if (state.toast?.kind === "countdown")
    return (
      <div
        className="odil-toast"
        role="status"
        aria-live="polite"
        style={{ bottom: state.cornerBottom }}
      >
        <div className="odil-toast-row">
          <span className="odil-toast-title">Opening in Linear…</span>
          <span className="odil-toast-hint">⌥ to stay</span>
          <button type="button" className="odil-toast-stay" onClick={onStay}>
            Stay on {page.host === "github" ? "GitHub" : "Graphite"}
          </button>
        </div>
        <div className="odil-toast-bar">
          <div
            key={state.toast.startedAt}
            className="odil-toast-fill"
            style={{ animationDuration: `${state.toast.durationMs}ms` }}
          />
        </div>
      </div>
    );

  if (state.toast?.kind === "notice")
    return (
      <div
        className="odil-toast"
        role="status"
        aria-live="polite"
        style={{ bottom: state.cornerBottom }}
      >
        <div className="odil-toast-row">
          <span className="odil-toast-title">{state.toast.text}</span>
        </div>
      </div>
    );

  const label = pillPresentation(
    state.settings.openTarget,
    state.flipHeld,
  ).label;
  return (
    <button
      type="button"
      className="odil-pill"
      style={{ bottom: state.cornerBottom }}
      aria-label={label}
      title={label}
      onClick={(event) => {
        onStay();
        event.preventDefault();
        const { target } = pillPresentation(
          state.settings.openTarget,
          event.altKey,
        );
        void handoff(page, target, "click");
      }}
    >
      {label}
    </button>
  );
}
