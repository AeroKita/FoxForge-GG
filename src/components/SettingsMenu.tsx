import { useState } from "react";
import { bundle } from "../data/gameData";
import { cachedPatchVersion, checkDataNow } from "../data/dataSource";
import { isTauri, autoUpdateEnabled, setAutoUpdate, checkAppUpdate } from "../ui/runtime";
import { useStore, type ThemePref } from "../state/store";
import { APP_NAME, APP_OWNER } from "../ui/brand";
import { APP_VERSION } from "../ui/version";
import { useModalDismiss } from "../ui/useModalDismiss";

const THEME_PREFS: ThemePref[] = ["light", "dark"];

/**
 * App settings, opened from the header gear. Houses appearance (theme) + all
 * update controls (game data on every platform; app auto-update on desktop).
 * Adding a setting = drop another <Section> below — the modal scrolls.
 */
export function SettingsMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, themePref, setThemePref } = useStore();
  const [auto, setAuto] = useState(autoUpdateEnabled());
  const [appMsg, setAppMsg] = useState("");
  const [dataMsg, setDataMsg] = useState("");
  const [dataUpdated, setDataUpdated] = useState(false);
  const activePatch = cachedPatchVersion() ?? bundle.patchVersion;

  useModalDismiss(onClose, open);
  if (!open) return null;

  const toggleAuto = () => { const v = !auto; setAuto(v); setAutoUpdate(v); };

  const checkApp = async () => {
    setAppMsg("Checking…");
    const r = await checkAppUpdate(true);
    setAppMsg(
      r.status === "none" ? "You're on the latest version."
      : r.status === "updated" ? `Updating to ${r.version}…`
      : r.status === "error" ? `Update error: ${r.message}`
      : "Update check unavailable.",
    );
  };

  const checkData = async () => {
    setDataMsg("Checking…");
    const r = await checkDataNow(bundle.lastUpdated);
    if (r.status === "updated") { setDataMsg(`New data (patch ${r.patchVersion}) downloaded.`); setDataUpdated(true); }
    else if (r.status === "current") setDataMsg(`Game data is up to date (patch ${r.patchVersion}).`);
    else setDataMsg("Couldn't reach the data server (using bundled data).");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-2xl bg-surface p-5 text-ink shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Settings</h2>
          <button onClick={onClose} aria-label="Close settings" className="rounded-lg px-2 py-1 text-faint hover:bg-raise">✕</button>
        </div>

        <Section title="Appearance">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Theme</span>
            <div className="inline-flex gap-1 rounded-xl border border-line bg-raise p-1">
              {THEME_PREFS.map((t) => (
                <button
                  key={t}
                  onClick={() => setThemePref(t)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition ${
                    themePref === t || (themePref === "system" && theme === t)
                      ? "bg-surface text-accent-ink shadow"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Updates">
          {/* Game data — all platforms */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Game data</span>
            <span className="font-mono text-xs text-faint">patch {activePatch}</span>
          </div>
          <button onClick={checkData} className="mt-1 rounded-lg border border-line px-3 py-1.5 text-xs font-medium hover:bg-raise">
            Check for data update
          </button>
          {dataMsg && <p className="mt-1 text-xs text-muted">{dataMsg}</p>}
          {dataUpdated && (
            <button onClick={() => location.reload()} className="mt-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-strong">
              Reload to apply
            </button>
          )}

          {/* Desktop app updates — Tauri only */}
          {isTauri ? (
            <div className="mt-3 border-t border-line-soft pt-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">App version</span>
                <span className="font-mono text-xs text-faint">v{APP_VERSION}</span>
              </div>
              <label className="mt-2 flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Auto-update the app</span>
                <input type="checkbox" checked={auto} onChange={toggleAuto} className="h-4 w-4 accent-[var(--color-accent)]" />
              </label>
              <button onClick={checkApp} className="mt-2 rounded-lg border border-line px-3 py-1.5 text-xs font-medium hover:bg-raise">
                Check for app updates
              </button>
              {appMsg && <p className="mt-1 text-xs text-muted">{appMsg}</p>}
            </div>
          ) : (
            <div className="mt-3 border-t border-line-soft pt-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Website version</span>
                <span className="font-mono text-xs text-faint">v{APP_VERSION}</span>
              </div>
              <p className="mt-2 text-xs text-faint">
                Running in the browser — the app auto-updates on reload. Install the desktop app for offline use + auto-updates.
              </p>
            </div>
          )}
        </Section>

        <Section title="About">
          <p className="text-sm font-medium">{APP_NAME}</p>
          <p className="mt-0.5 text-xs text-muted">Created by {APP_OWNER}</p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-bg/40 p-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
      {children}
    </section>
  );
}
