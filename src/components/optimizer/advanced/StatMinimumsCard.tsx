import type { ResolvedEmblemPreset } from "../../../engine/emblemSearch/optimizerPresets";
import { CollapsibleCard } from "../../CollapsibleCard";
import { presetAutofillIntro, PROTECT_STATS, type OptimizerPokemon } from "../shared";

export interface StatMinimumsCardProps {
  floorValues: Record<string, string>;
  setFloorValues: (
    values: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>),
  ) => void;
  floorActive: Record<string, boolean>;
  setFloorActive: (
    active: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>),
  ) => void;
  pokemon: OptimizerPokemon;
  emblemPresetResolution: ResolvedEmblemPreset | null;
}

export function StatMinimumsCard({
  floorValues,
  setFloorValues,
  floorActive,
  setFloorActive,
  pokemon,
  emblemPresetResolution,
}: StatMinimumsCardProps) {
  return (
    <CollapsibleCard title="Stat Minimums" persistKey="optimizer-protect" defaultOpen={false}>
      <div className="flex flex-col gap-2">
        <p className="text-xs text-faint">
          {pokemon && Object.keys(floorActive).some((k) => floorActive[k])
            ? `${presetAutofillIntro(pokemon.displayName, emblemPresetResolution)}. Tries to avoid builds where stats fall below these values. 0 means emblems shouldn't reduce that stat overall; -5 allows up to 5 points of loss.`
            : "Tries to avoid builds where stats fall below these values. 0 means emblems shouldn't reduce that stat overall; -5 allows up to 5 points of loss."}
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PROTECT_STATS.map(([stat, label]) => (
            <div key={stat} className="flex items-center gap-2 text-xs">
              <label className="flex cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={!!floorActive[stat]}
                  onChange={(e) =>
                    setFloorActive((prev) => ({ ...prev, [stat]: e.target.checked }))
                  }
                  className="accent-accent"
                />
                <span className="w-20 text-muted">{label}</span>
              </label>
              <input
                type="number"
                step="any"
                value={floorValues[stat] ?? "0"}
                disabled={!floorActive[stat]}
                onChange={(e) => setFloorValues((prev) => ({ ...prev, [stat]: e.target.value }))}
                className="w-20 rounded bg-surface px-2 py-1 font-mono text-xs text-ink ring-1 ring-line focus:outline-none focus:ring-accent disabled:opacity-40"
                placeholder="0"
              />
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            setFloorActive({});
            setFloorValues({});
          }}
          className="self-start text-xs text-muted underline hover:text-ink"
        >
          Clear all
        </button>
      </div>
    </CollapsibleCard>
  );
}
