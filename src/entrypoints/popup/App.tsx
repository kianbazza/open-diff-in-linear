import { useCallback, useEffect, useRef, useState } from "react";
import {
  COUNTDOWN_OPTIONS,
  type CountdownSeconds,
  isOpenTarget,
  OPEN_TARGETS,
  parseAllowlist,
  readSettings,
  type Settings,
  sanitizeSettings,
  settingsItem,
} from "@/lib/settings";

export function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [allowlistText, setAllowlistText] = useState("");
  const allowlistFocused = useRef(false);
  const allowlistDirty = useRef(false);
  const pendingWrites = useRef(0);
  const writeGeneration = useRef(0);
  const mounted = useRef(false);

  const apply = useCallback((next: Settings) => {
    setSettings(next);
    if (!allowlistFocused.current) {
      setAllowlistText(next.allowlist.join("\n"));
    }
  }, []);

  useEffect(() => {
    let active = true;
    let watched = false;
    mounted.current = true;
    void readSettings().then((next) => {
      if (active && !watched) {
        apply(next);
      }
    });
    const unwatch = settingsItem.watch((next) => {
      watched = true;
      if (pendingWrites.current > 0) {
        return;
      }
      apply(sanitizeSettings(next));
    });
    return () => {
      active = false;
      mounted.current = false;
      unwatch();
    };
  }, [apply]);

  async function save(next: Settings) {
    setSettings(next);
    pendingWrites.current += 1;
    writeGeneration.current += 1;
    const generation = writeGeneration.current;
    try {
      await settingsItem.setValue(next);
    } catch (error) {
      console.error("Could not save settings", error);
    } finally {
      pendingWrites.current -= 1;
    }
    if (pendingWrites.current !== 0) return;
    const fresh = await readSettings();
    if (
      pendingWrites.current === 0 &&
      generation === writeGeneration.current &&
      mounted.current
    ) {
      apply(fresh);
    }
  }

  const openTargetLabels: Record<Settings["openTarget"], string> = {
    "linear-decides": "Linear decides",
    desktop: "Desktop app",
    web: "Web app",
  };

  return (
    <main
      style={{
        minWidth: 300,
        padding: 16,
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
      }}
    >
      <h1 style={{ fontSize: 14, margin: 0 }}>Open Diff in Linear</h1>
      {settings && (
        <form
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 16,
          }}
        >
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ fontWeight: 600, marginBottom: 6 }}>Mode</legend>
            <label
              htmlFor="mode-manual"
              style={{ display: "block", padding: "3px 0" }}
            >
              <input
                id="mode-manual"
                name="mode"
                type="radio"
                value="manual"
                checked={settings.mode === "manual"}
                onChange={() => void save({ ...settings, mode: "manual" })}
              />{" "}
              Manual
            </label>
            <label
              htmlFor="mode-automatic"
              style={{ display: "block", padding: "3px 0" }}
            >
              <input
                id="mode-automatic"
                name="mode"
                type="radio"
                value="automatic"
                checked={settings.mode === "automatic"}
                onChange={() => void save({ ...settings, mode: "automatic" })}
              />{" "}
              Automatic
            </label>
            <p style={{ margin: "4px 0 0", color: "#555", lineHeight: 1.4 }}>
              Manual shows a View in Linear pill on PR pages. Automatic also
              hands off PRs from the orgs below after a countdown.
            </p>
          </fieldset>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label htmlFor="open-target" style={{ fontWeight: 600 }}>
              Open in
            </label>
            <select
              id="open-target"
              value={settings.openTarget}
              onChange={(event) => {
                const value = event.target.value;
                if (isOpenTarget(value)) {
                  void save({ ...settings, openTarget: value });
                }
              }}
            >
              {OPEN_TARGETS.map((target) => (
                <option key={target} value={target}>
                  {openTargetLabels[target]}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label htmlFor="countdown" style={{ fontWeight: 600 }}>
              Countdown
            </label>
            <select
              id="countdown"
              value={settings.countdownSeconds}
              disabled={settings.mode === "manual"}
              onChange={(event) =>
                void save({
                  ...settings,
                  countdownSeconds: Number(
                    event.target.value,
                  ) as CountdownSeconds,
                })
              }
            >
              {COUNTDOWN_OPTIONS.map((seconds) => (
                <option key={seconds} value={seconds}>
                  {seconds} s
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label htmlFor="allowlist" style={{ fontWeight: 600 }}>
              Automatically hand off PRs from these orgs
            </label>
            <textarea
              id="allowlist"
              rows={4}
              placeholder="one org per line"
              value={allowlistText}
              onFocus={() => {
                allowlistFocused.current = true;
                allowlistDirty.current = false;
              }}
              onChange={(event) => {
                const text = event.target.value;
                setAllowlistText(text);
                allowlistDirty.current = true;
                void save({ ...settings, allowlist: parseAllowlist(text) });
              }}
              onBlur={() => {
                allowlistFocused.current = false;
                if (allowlistDirty.current) {
                  const allowlist = parseAllowlist(allowlistText);
                  setAllowlistText(allowlist.join("\n"));
                  void save({ ...settings, allowlist });
                } else {
                  setAllowlistText(settings.allowlist.join("\n"));
                }
                allowlistDirty.current = false;
              }}
            />
            {settings.mode === "automatic" &&
              settings.allowlist.length === 0 && (
                <div role="status">Add an org to enable automatic mode.</div>
              )}
          </div>
        </form>
      )}
    </main>
  );
}
