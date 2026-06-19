import { useEffect, useState } from "react";
import {
  clampResultCount,
  DEFAULT_RESULT_COUNT,
  RESULT_COUNT_MAX,
  RESULT_COUNT_MIN,
} from "../../state/emblemSearch";

/** Heuristic-only: how many independent smart-search runs to generate per click. */
export function VariationsControl({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled: boolean;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const commit = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits === "") {
      setDraft(String(DEFAULT_RESULT_COUNT));
      onChange(DEFAULT_RESULT_COUNT);
      return;
    }
    const n = clampResultCount(Number(digits));
    setDraft(String(n));
    onChange(n);
  };

  const step = (delta: number) => {
    const next = clampResultCount(value + delta);
    setDraft(String(next));
    onChange(next);
  };

  return (
    <div className={`flex flex-col gap-1.5 ${disabled ? "opacity-50" : ""}`}>
      <span className="text-xs font-medium text-muted">Variations</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Fewer variations"
          disabled={disabled || value <= RESULT_COUNT_MIN}
          onClick={() => step(-1)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-raise text-sm font-semibold text-ink ring-1 ring-line hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
        <input
          type="text"
          inputMode="numeric"
          id="search-variations"
          aria-label="Variations to generate"
          disabled={disabled}
          value={draft}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            setDraft(digits);
            if (digits !== "") onChange(clampResultCount(Number(digits)));
          }}
          onBlur={(e) => commit(e.target.value)}
          className="w-14 rounded-lg bg-surface px-1 py-1.5 text-center font-mono text-sm text-ink ring-1 ring-line focus:outline-none focus:ring-accent disabled:cursor-not-allowed"
        />
        <button
          type="button"
          aria-label="More variations"
          disabled={disabled || value >= RESULT_COUNT_MAX}
          onClick={() => step(1)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-raise text-sm font-semibold text-ink ring-1 ring-line hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>
      </div>
      <p className="text-xs text-faint">
        {disabled
          ? "Exact search returns one optimal build."
          : "Run smart search multiple times to compare different builds."}
      </p>
    </div>
  );
}
