import { useMemo, useState } from "react";
import { useStore } from "../state/store";
import { pokemonById, pokemonList, ITEM_GRADE_DEFAULT } from "../data/gameData";
import { deriveBuild } from "../engine/derive";
import { type Loadout, type SavedLoadout } from "../state/loadout";
import {
  presetBuilds,
  hasCreative,
  selectionToLoadout,
  type SideSelection,
  type CompareSource,
} from "../state/compareBuilds";
import { STAT_ROWS, formatStat, formatDelta } from "../ui/format";
import { asset } from "../ui/asset";
import { CollapsibleCard } from "./CollapsibleCard";
import { Segmented } from "./Segmented";
import { PokemonPickerSheet } from "./PokemonPicker";

function initialSelection(side: "A" | "B", currentPokemonId: string | null): SideSelection {
  if (side === "A") {
    if (currentPokemonId) {
      return { source: "current", pokemonId: currentPokemonId, variant: 0, savedId: null };
    }
    return {
      source: "recommended",
      pokemonId: pokemonList[0]?.id ?? null,
      variant: 0,
      savedId: null,
    };
  }
  return {
    source: "recommended",
    pokemonId: currentPokemonId ?? pokemonList[0]?.id ?? null,
    variant: 0,
    savedId: null,
  };
}

function changeSource(
  sel: SideSelection,
  next: CompareSource,
  saved: SavedLoadout[],
): SideSelection {
  if (next === "saved")
    return { ...sel, source: next, savedId: sel.savedId ?? saved[0]?.id ?? null };
  return { ...sel, source: next, variant: 0 };
}

function clampSelectionForPokemon(sel: SideSelection): SideSelection {
  if (sel.source === "creative" && !hasCreative(pokemonById.get(sel.pokemonId ?? "") ?? null)) {
    return { ...sel, source: "recommended" };
  }
  return sel;
}

// Compare two builds: pick A and B from presets, current, or saved.
export function CompareView() {
  const { loadout, saved, heldItemGrade } = useStore();
  const [a, setA] = useState<SideSelection>(() => initialSelection("A", loadout.pokemonId));
  const [b, setB] = useState<SideSelection>(() => initialSelection("B", loadout.pokemonId));
  const [pickerSide, setPickerSide] = useState<"A" | "B" | null>(null);

  const la = selectionToLoadout(a, loadout, saved);
  const lb = selectionToLoadout(b, loadout, saved);

  const da = useMemo(
    () =>
      deriveBuild(
        la,
        true,
        [0, 1, 2].map((i) => {
          const id = la.heldItemIds[i];
          return id ? heldItemGrade(id) : ITEM_GRADE_DEFAULT;
        }) as [number, number, number],
      ),
    [la, heldItemGrade],
  );
  const db = useMemo(
    () =>
      deriveBuild(
        lb,
        true,
        [0, 1, 2].map((i) => {
          const id = lb.heldItemIds[i];
          return id ? heldItemGrade(id) : ITEM_GRADE_DEFAULT;
        }) as [number, number, number],
      ),
    [lb, heldItemGrade],
  );

  return (
    <CollapsibleCard title="Compare Builds" persistKey="compare">
      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <SidePicker
          label="A"
          selection={a}
          onChange={setA}
          saved={saved}
          current={loadout}
          onOpenPicker={() => setPickerSide("A")}
        />
        <SidePicker
          label="B"
          selection={b}
          onChange={setB}
          saved={saved}
          current={loadout}
          onOpenPicker={() => setPickerSide("B")}
        />
      </div>
      {da.pokemon && db.pokemon && da.pokemon.id !== db.pokemon.id && (
        <p className="mb-2 rounded-lg bg-as-bg px-3 py-1.5 text-xs text-as-ink">
          Comparing across different Pokémon ({da.pokemon.displayName} vs {db.pokemon.displayName}).
        </p>
      )}
      {!da.effective || !db.effective ? (
        <p className="text-sm text-faint">Both builds need a Pokémon selected.</p>
      ) : (
        <div className="-mx-1 min-w-0 overflow-x-auto px-1">
          <table className="w-full min-w-[20rem] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-faint">
                <th className="py-1">Stat</th>
                <th className="py-1 text-right">A</th>
                <th className="py-1 text-right">B</th>
                <th className="py-1 text-right">Δ (B−A)</th>
              </tr>
            </thead>
            <tbody>
              {STAT_ROWS.map((row) => {
                const av = da.effective![row.key];
                const bv = db.effective![row.key];
                const delta = bv - av;
                const better = delta > 1e-9;
                const worse = delta < -1e-9;
                return (
                  <tr key={row.key} className="border-t border-line-soft">
                    <td className="py-1 text-muted">{row.label}</td>
                    <td className="py-1 text-right font-mono">{formatStat(av, row.kind)}</td>
                    <td className="py-1 text-right font-mono">{formatStat(bv, row.kind)}</td>
                    <td
                      className={`py-1 text-right font-mono ${better ? "text-pos" : worse ? "text-neg" : "text-faint"}`}
                    >
                      {Math.abs(delta) < 1e-9 ? "—" : formatDelta(delta, row.kind)}
                    </td>
                  </tr>
                );
              })}
              {da.attackSpeed && db.attackSpeed && (
                <tr className="border-t border-line font-semibold">
                  <td className="py-1 text-muted">Attacks / sec</td>
                  <td className="py-1 text-right font-mono">
                    {da.attackSpeed.attacksPerSecond.toFixed(2)}
                  </td>
                  <td className="py-1 text-right font-mono">
                    {db.attackSpeed.attacksPerSecond.toFixed(2)}
                  </td>
                  <td className="py-1 text-right font-mono text-muted">
                    {(db.attackSpeed.attacksPerSecond - da.attackSpeed.attacksPerSecond).toFixed(2)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {pickerSide && (
        <PokemonPickerSheet
          title={`Build ${pickerSide} — choose Pokémon`}
          selectedId={(pickerSide === "A" ? a : b).pokemonId}
          onSelect={(id) => {
            const setter = pickerSide === "A" ? setA : setB;
            setter((s) => clampSelectionForPokemon({ ...s, pokemonId: id, variant: 0 }));
          }}
          onClose={() => setPickerSide(null)}
        />
      )}
    </CollapsibleCard>
  );
}

function SidePicker({
  label,
  selection,
  onChange,
  saved,
  current,
  onOpenPicker,
}: {
  label: "A" | "B";
  selection: SideSelection;
  onChange: (s: SideSelection) => void;
  saved: SavedLoadout[];
  current: Loadout;
  onOpenPicker: () => void;
}) {
  const pokemon = selection.pokemonId ? (pokemonById.get(selection.pokemonId) ?? null) : null;

  const sourceOptions: CompareSource[] = ["recommended"];
  if (hasCreative(pokemon)) sourceOptions.push("creative");
  sourceOptions.push("current");
  if (saved.length > 0) sourceOptions.push("saved");

  const sourceLabels: Partial<Record<CompareSource, string>> = {
    recommended: "Recommended",
    creative: "Creative",
    current: "Current",
    saved: "Saved",
  };

  const builds =
    selection.source === "recommended" || selection.source === "creative"
      ? presetBuilds(pokemon, selection.source)
      : [];
  const build = builds[Math.min(Math.max(selection.variant, 0), Math.max(builds.length - 1, 0))];

  const go = (delta: number) => {
    if (builds.length < 2) return;
    const next = (selection.variant + delta + builds.length) % builds.length;
    onChange({ ...selection, variant: next });
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-muted">Build {label}</span>
      <Segmented
        fluid
        value={selection.source}
        options={sourceOptions}
        labels={sourceLabels}
        onChange={(next) => onChange(changeSource(selection, next, saved))}
      />
      {(selection.source === "recommended" || selection.source === "creative") && (
        <>
          <button
            type="button"
            onClick={onOpenPicker}
            className="flex min-h-11 items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink hover:bg-raise"
          >
            {pokemon ? (
              <>
                <img
                  src={asset(pokemon.iconAsset)}
                  alt=""
                  className="h-8 w-8 rounded-full object-contain"
                />
                <span className="truncate font-medium">{pokemon.displayName}</span>
              </>
            ) : (
              <span className="text-muted">Choose Pokémon…</span>
            )}
          </button>
          {builds.length === 0 ? (
            <p className="text-sm text-faint">
              No {selection.source === "recommended" ? "Recommended" : "Creative"} builds yet.
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => go(-1)}
                disabled={builds.length < 2}
                aria-label="Previous build"
                className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-line text-lg text-ink hover:bg-raise disabled:opacity-30"
              >
                ‹
              </button>
              <p className="min-w-0 flex-1 truncate text-center text-xs text-muted">
                {build ? (
                  <>
                    <span className="font-semibold text-ink">{build.emblemName ?? build.name}</span>
                    {build.lane ? ` · ${build.lane}` : ""}
                    {builds.length > 1 ? ` · ${selection.variant + 1}/${builds.length}` : ""}
                  </>
                ) : (
                  "—"
                )}
              </p>
              <button
                type="button"
                onClick={() => go(1)}
                disabled={builds.length < 2}
                aria-label="Next build"
                className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-line text-lg text-ink hover:bg-raise disabled:opacity-30"
              >
                ›
              </button>
            </div>
          )}
        </>
      )}
      {selection.source === "current" && (
        <p className="min-h-11 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink">
          <span className="text-muted">Your current working build — </span>
          {pokemonById.get(current.pokemonId ?? "")?.displayName ?? "No Pokémon selected"}
        </p>
      )}
      {selection.source === "saved" && (
        <select
          value={selection.savedId ?? ""}
          onChange={(e) => onChange({ ...selection, savedId: e.target.value })}
          className="min-h-11 rounded-lg border border-line bg-surface px-2 py-2 text-sm text-ink"
        >
          {saved.map((s) => {
            const p = pokemonById.get(s.pokemonId ?? "");
            return (
              <option key={s.id} value={s.id}>
                {s.name}
                {p ? ` — ${p.displayName}` : ""}
              </option>
            );
          })}
        </select>
      )}
    </div>
  );
}
