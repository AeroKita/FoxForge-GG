/**
 * Stale-result detection for the optimizer.
 *
 * A displayed search result is "stale" when the live search settings no longer
 * match the settings that produced it. The result stays visible (and applyable)
 * but the UI flags that a re-run would refresh it. Pure + framework-agnostic so
 * it can be unit-tested without rendering the component.
 *
 * @param resultSettingsKey Fingerprint frozen when the shown result was produced
 *                          (null = no result / no captured baseline yet).
 * @param liveSettingsKey   Fingerprint of the current settings.
 */
export function isSearchResultStale(
  resultSettingsKey: string | null,
  liveSettingsKey: string,
): boolean {
  if (resultSettingsKey === null) return false;
  return resultSettingsKey !== liveSettingsKey;
}
