import { useState } from "react";
import { bundle } from "../data/gameData";
import { cachedPatchVersion, checkDataNow } from "../data/dataSource";
import { isTauri, autoUpdateEnabled, setAutoUpdate, checkAppUpdate } from "../ui/runtime";
import { CollapsibleCard } from "./CollapsibleCard";

export function UpdatePanel() {
  const [auto, setAuto] = useState(autoUpdateEnabled());
  const [appMsg, setAppMsg] = useState("");
  const [dataMsg, setDataMsg] = useState("");
  const [dataUpdated, setDataUpdated] = useState(false);
  const activePatch = cachedPatchVersion() ?? bundle.patchVersion;

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
    <CollapsibleCard title="Updates" persistKey="updates" defaultOpen={false}>
      <div className="flex flex-col gap-3 text-sm">
        {/* Game data (all platforms) */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-ink">Game data</span>
            <span className="font-mono text-xs text-faint">patch {activePatch}</span>
          </div>
          <button onClick={checkData} className="mt-1 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-raise">
            Check for data update
          </button>
          {dataMsg && <p className="mt-1 text-xs text-muted">{dataMsg}</p>}
          {dataUpdated && (
            <button onClick={() => location.reload()} className="mt-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-strong">
              Reload to apply
            </button>
          )}
        </div>

        {/* Desktop app updates (Tauri only) */}
        {isTauri ? (
          <div className="border-t border-line-soft pt-3">
            <label className="flex items-center justify-between gap-2">
              <span className="font-medium text-ink">Auto-update the app</span>
              <input type="checkbox" checked={auto} onChange={toggleAuto} className="h-4 w-4 accent-[var(--color-accent)]" />
            </label>
            <button onClick={checkApp} className="mt-2 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-raise">
              Check for app updates
            </button>
            {appMsg && <p className="mt-1 text-xs text-muted">{appMsg}</p>}
          </div>
        ) : (
          <p className="border-t border-line-soft pt-3 text-xs text-faint">
            Running in the browser — the app auto-updates on reload. Install the desktop app for offline use + auto-updates.
          </p>
        )}
      </div>
    </CollapsibleCard>
  );
}
