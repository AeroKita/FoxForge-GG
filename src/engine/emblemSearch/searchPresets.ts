/**
 * Shared "preset" search-option builder.
 *
 * Both the Beginner one-click flow and the Expert "Reset to auto defaults"
 * action want to translate a Pokémon's meta color targets into a real search
 * configuration. Historically the feasibility logic that decides whether those
 * targets can be enforced as *hard* color constraints (exact enumeration) vs.
 * merely steered toward via the soft color-bonus incentive (weighted/heuristic)
 * lived inline in `EmblemOptimizer.syncAdvancedFromBasic`. Beginner never used
 * it, so Beginner always ran the heuristic search.
 *
 * This module is the single source of truth for that decision so Beginner and
 * Expert behave identically: a Beginner search now runs the Expert-equivalent
 * search (exact whenever feasible on the actual Beginner pool, heuristic
 * otherwise) with the controls hidden.
 */

import type { Emblem, EmblemColor, Pokemon } from "../../types";
import { colorTargetsFor } from "../recommend";
import { colorGroupSizes } from "./exactColor";
import { countConstrainedBuilds } from "./pool";
import { DEFAULT_EXACT_CAP, shouldRunExact } from "./orchestrator";
import { deriveBasicObjective, type BasicObjective } from "./basicObjective";
import type { EmblemCandidate, SearchOptions } from "./types";

/** UNITE emblem loadouts are always 10 slots. */
const SLOTS = 10;

/** Beginner search effort — exact enumeration or a time-budgeted heuristic. */
export type BasicEffort = "exact" | "quick" | "normal" | "thorough";

/** Heuristic effort used when "exact" is selected but infeasible on the current pool. */
export const EXACT_FALLBACK_EFFORT = "normal" as const;

/**
 * Map the user's Beginner effort choice to the effort the search will actually use.
 * "exact" is only honored when exact enumeration is feasible; otherwise fall back
 * so UI state, settings fingerprint, and run() stay aligned.
 */
export function resolveBasicEffort(
  basicEffort: BasicEffort,
  exactFeasible: boolean,
): BasicEffort {
  return basicEffort === "exact" && !exactFeasible ? EXACT_FALLBACK_EFFORT : basicEffort;
}

/** Color control mode the resolver chose for a given pool + targets. */
export type ColorSearchMode = "exact" | "weighted";

export interface ColorSearchResolution {
  /**
   * "exact" → enforce the meta color targets as hard per-color constraints
   * (the orchestrator runs exact enumeration when within the cap).
   * "weighted" → no hard constraints; the soft color-bonus incentive steers
   * the heuristic search instead.
   */
  mode: ColorSearchMode;
  /** Hard color constraints when mode==="exact"; null when mode==="weighted". */
  colorConstraints: Map<EmblemColor, number> | null;
  /**
   * Result of countConstrainedBuilds on the pool for these targets:
   *  • bigint > 0n → that many color-feasible builds exist.
   *  • 0n → infeasible on this pool.
   *  • null → DP overflow (too many to count) OR targets not enforceable.
   */
  constrainedBuildCount: bigint | null;
  /**
   * Whether the orchestrator will actually run exact enumeration for this
   * resolution under DEFAULT_EXACT_CAP. False when weighted, when the count
   * overflowed (null), or when the count exceeds the cap → heuristic fallback.
   */
  willRunExact: boolean;
}

/**
 * Decide whether a Pokémon's meta color targets can be enforced as hard
 * constraints on the given pool (exact search) or should fall back to the
 * soft color-bonus incentive (weighted/heuristic).
 *
 * Mirrors the feasibility logic previously inlined in
 * `syncAdvancedFromBasic`:
 *  1. per-color capacity: each target count ≤ distinct Pokémon carrying that color,
 *  2. sum of target counts ≤ 2×slots (dual-color emblems count toward both),
 *  3. countConstrainedBuilds(...) is feasible (≠ 0n).
 *
 * @param pool    The ACTUAL pool the search will run on (owned or full).
 * @param targets Meta color targets (color → required count).
 * @param slots   Loadout size (default 10).
 */
export function resolveColorSearchMode(
  pool: EmblemCandidate[],
  targets: Map<EmblemColor, number>,
  slots: number = SLOTS,
): ColorSearchResolution {
  const weighted = (constrainedBuildCount: bigint | null): ColorSearchResolution => ({
    mode: "weighted",
    colorConstraints: null,
    constrainedBuildCount,
    willRunExact: false,
  });

  if (targets.size === 0) return weighted(null);

  const caps = colorGroupSizes(pool);
  const sum = [...targets.values()].reduce((a, b) => a + b, 0);
  const capacityOk = [...targets.entries()].every(([c, n]) => n <= (caps.get(c) ?? 0));

  // Capacity / sum infeasible → can't enforce as hard constraints. Don't even
  // run the DP (countConstrainedBuilds would return 0n anyway for sum>2*slots).
  if (sum > 2 * slots || !capacityOk) return weighted(null);

  const constrainedBuildCount = countConstrainedBuilds(pool, targets, slots);

  // 0n → no build can satisfy the exact counts → soft steering only.
  if (constrainedBuildCount === 0n) return weighted(0n);

  // Feasible (count > 0n) OR DP overflow (null). Both set the constraints as
  // hard targets — exactly as Expert did. The orchestrator then decides exact
  // vs heuristic via shouldRunExact: a null count (overflow) or a count above
  // the cap falls back to the heuristic automatically.
  return {
    mode: "exact",
    colorConstraints: new Map(targets),
    constrainedBuildCount,
    willRunExact: shouldRunExact(constrainedBuildCount, DEFAULT_EXACT_CAP),
  };
}

/** Advanced Exact-color UI defaults derived from a Pokémon + pool. */
export interface AdvancedColorUiDefaults {
  colorMode: "off" | ColorSearchMode;
  activeColors: EmblemColor[];
  colorCounts: Map<EmblemColor, number>;
}

/**
 * Derive the Advanced-mode color UI state (mode, checked colors, counts) from a
 * Pokémon's meta targets and the pool the search will actually run on.
 *
 * Powers `syncAdvancedFromBasic` / Pokémon-change sync in EmblemOptimizer.
 */
export function deriveAdvancedColorUiDefaults(
  pokemon: Pokemon | null,
  pool: EmblemCandidate[],
  emblems: Emblem[],
): AdvancedColorUiDefaults {
  const cleared = (): AdvancedColorUiDefaults => ({
    colorMode: "off",
    activeColors: [],
    colorCounts: new Map(),
  });

  if (!pokemon) return cleared();

  const byId = new Map(emblems.map((e) => [e.id, e]));
  const targets = colorTargetsFor(pokemon, byId);
  if (targets.size === 0) return cleared();

  const resolution = resolveColorSearchMode(pool, targets, SLOTS);
  return {
    colorMode: resolution.mode,
    activeColors: [...targets.keys()],
    colorCounts: new Map(targets),
  };
}

export interface BuildPresetParams {
  pokemon: Pokemon;
  level: number;
  /** The ACTUAL pool the search will run on — feasibility is judged on this. */
  pool: EmblemCandidate[];
  /** Full emblem list (needed to resolve curated-build color counts). */
  emblems: Emblem[];
  /** Full roster for population-relative protect-floor derivation. */
  pokemonList?: Pokemon[];
  /**
   * When true, deliberately strip the hard color constraints so the
   * orchestrator skips Phase-2 exact enumeration and runs the heuristic at the
   * chosen effort instead — only when the user picked a time-based effort AND
   * exact enumeration is actually feasible (within cap). When targets are
   * feasible but over-cap, callers should pass false so the heuristic still
   * enforces hard constraints. The soft color-bonus incentive (colorBonuses)
   * steers the heuristic when constraints are stripped. Defaults to false.
   */
  forceHeuristic?: boolean;
}

export interface PresetSearchBuild {
  options: SearchOptions;
  resolution: ColorSearchResolution;
  objective: BasicObjective;
}

/**
 * Build the SearchOptions for a one-click / preset search.
 *
 * Produces the Expert-equivalent configuration: stat priorities, protect
 * floors and Pokémon-aware scoring from {@link deriveBasicObjective}, plus the
 * meta color targets enforced as hard constraints whenever they are feasible
 * on `pool` (otherwise soft color-bonus steering). exactCap is the default 1B,
 * so exact enumeration runs whenever the constrained build count is countable
 * and within budget — identical to an Expert search with auto defaults.
 */
export function buildPresetSearchOptions(params: BuildPresetParams): PresetSearchBuild {
  const { pokemon, level, pool, emblems, pokemonList = [], forceHeuristic = false } = params;
  const objective = deriveBasicObjective(pokemon, level, emblems, pokemonList);
  const targets = objective.colorTargets as Map<EmblemColor, number>;
  const resolution = resolveColorSearchMode(pool, targets, SLOTS);

  // forceHeuristic drops hard constraints only when the caller signals the user
  // deliberately skipped exact while enumeration was feasible; colorBonuses
  // still steers softly when constraints are stripped.
  const colorConstraints = forceHeuristic ? null : resolution.colorConstraints;

  const options: SearchOptions = {
    mode: "maximize",
    priorities: objective.priorities,
    targets: {},
    targetActive: {},
    protected: objective.protectedFloors,
    colorConstraints,
    colorBonuses: true,
    scoringMode: "pokemon",
    pokemonContext: objective.pokemonContext,
    slots: SLOTS,
    exactCap: DEFAULT_EXACT_CAP,
  };

  return { options, resolution, objective };
}
