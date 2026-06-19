import { CollapsibleCard } from "../../CollapsibleCard";
import { STAT_LABELS } from "../shared";

export interface StatTargetsCardProps {
  targetValues: Record<string, string>;
  setTargetValues: (
    values: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>),
  ) => void;
  targetActive: Record<string, boolean>;
  setTargetActive: (
    active: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>),
  ) => void;
}

export function StatTargetsCard({
  targetValues,
  setTargetValues,
  targetActive,
  setTargetActive,
}: StatTargetsCardProps) {
  return (
    <CollapsibleCard title="Stat Targets" persistKey="optimizer-targets">
      <div className="flex flex-col gap-2">
        <p className="text-xs text-faint">
          Enable stats and enter target flat totals from emblems.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Object.entries(STAT_LABELS).map(([stat, label]) => (
            <div key={stat} className="flex items-center gap-2 text-xs">
              <label className="flex cursor-pointer items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={!!targetActive[stat]}
                  onChange={(e) =>
                    setTargetActive((prev) => ({ ...prev, [stat]: e.target.checked }))
                  }
                  className="accent-accent"
                />
                <span className="w-20 text-muted">{label}</span>
              </label>
              <input
                type="number"
                step="any"
                value={targetValues[stat] ?? ""}
                disabled={!targetActive[stat]}
                onChange={(e) => setTargetValues((prev) => ({ ...prev, [stat]: e.target.value }))}
                className="w-24 rounded bg-surface px-2 py-1 font-mono text-ink ring-1 ring-line focus:outline-none focus:ring-accent disabled:opacity-40"
                placeholder="0"
              />
            </div>
          ))}
        </div>
      </div>
    </CollapsibleCard>
  );
}
