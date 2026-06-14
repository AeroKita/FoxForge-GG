// Desktop (Tauri) runtime helpers. The web/PWA build never executes the Tauri
// plugin imports — they're behind `isTauri` guards and dynamic imports, so the
// browser bundle stays clean and the same code runs everywhere.

export const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

const AUTO_KEY = "unite-build-optimizer.autoUpdate.v1";

/** Auto-update on by default; user-toggleable. */
export function autoUpdateEnabled(): boolean {
  try { return localStorage.getItem(AUTO_KEY) !== "off"; } catch { return true; }
}
export function setAutoUpdate(on: boolean): void {
  try { localStorage.setItem(AUTO_KEY, on ? "on" : "off"); } catch { /* ignore */ }
}

export interface AppUpdateResult {
  status: "updated" | "none" | "error" | "unavailable";
  version?: string;
  message?: string;
}

/**
 * Check GitHub Releases for a newer desktop build. When `install` is true,
 * download + install + relaunch. No-op (status "unavailable") on web/PWA.
 */
export async function checkAppUpdate(install: boolean): Promise<AppUpdateResult> {
  if (!isTauri) return { status: "unavailable" };
  try {
    const { check } = await import("@tauri-apps/plugin-updater");
    const update = await check();
    if (!update) return { status: "none" };
    if (install) {
      await update.downloadAndInstall();
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    }
    return { status: "updated", version: update.version };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : String(e) };
  }
}
