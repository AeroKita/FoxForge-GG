/**
 * Pool-building: from the full emblem dataset → a filtered EmblemCandidate[].
 */

import type { Emblem, EmblemColor } from "../../types";
import type { EmblemCandidate, PoolConfig } from "./types";
import { buildCandidatePool, distinctPokemonCount } from "./adapt";

export { distinctPokemonCount };

/**
 * Build the search pool according to the configuration.
 * - useOwned=true: only owned emblems; mixedGrades controls whether all owned
 *   grade variants are included (true) or only the best-owned grade (false).
 *   allowedGrades is ignored for owned pools.
 * - useOwned=false: all emblems at the specified allowedGrades.
 */
export function buildPool(
  emblems: Emblem[],
  config: PoolConfig,
  ownedKeys: Set<string>,
): EmblemCandidate[] {
  if (config.useOwned) {
    return buildCandidatePool(emblems, {
      ownedKeys,
      mixedGrades: config.mixedGrades ?? true,
    });
  }
  return buildCandidatePool(emblems, { grades: [...config.allowedGrades] });
}

/**
 * Count valid k-slot loadouts: pick k distinct Pokémon, one grade variant each.
 *
 * For Pokémon i with v_i grade variants in the pool, the count is
 *   e_k(v_1, …, v_n) = Σ_{|S|=k} Π_{i∈S} v_i
 * computed in O(n·k) via DP (no enumeration of individual loadouts).
 */
function countDistinctLoadouts(variantCounts: number[], slots: number): bigint {
  if (variantCounts.length < slots) return 0n;
  if (variantCounts.every((v) => v === 1)) return binomialBig(variantCounts.length, slots);

  const ways = Array.from({ length: slots + 1 }, () => 0n);
  ways[0] = 1n;
  for (const v of variantCounts) {
    const w = BigInt(v);
    for (let k = slots; k >= 1; k--) {
      ways[k] += ways[k - 1] * w;
    }
  }
  return ways[slots];
}

/** Distinct Pokémon names → number of grade variants present in the pool. */
function variantCountsByPokemon(pool: EmblemCandidate[]): number[] {
  const counts = new Map<string, number>();
  for (const c of pool) {
    counts.set(c.pokemonName, (counts.get(c.pokemonName) ?? 0) + 1);
  }
  return [...counts.values()];
}

/**
 * Number of valid 10-slot loadouts (distinct Pokémon, order-independent) from
 * this pool. Each slot picks one grade variant for a distinct Pokémon name.
 *
 * Single-grade pools: C(distinctPokemon, 10). Multi-grade pools: full
 * combinatorial count including grade choice per slot.
 */
export function approximateBuildCount(pool: EmblemCandidate[], slots = 10): bigint {
  return countDistinctLoadouts(variantCountsByPokemon(pool), slots);
}

function binomialBig(n: number, k: number): bigint {
  if (k > n) return 0n;
  if (k === 0 || k === n) return 1n;
  k = Math.min(k, n - k);
  let num = 1n;
  for (let i = 0; i < k; i++) {
    num = (num * BigInt(n - i)) / BigInt(i + 1);
  }
  return num;
}

/**
 * Format a BigInt build count for human-readable display.
 * Tiers: T ≥ 1e12, B ≥ 1e9, M ≥ 1e6, k ≥ 1e3, else exact.
 * Used for both constrained-build counts AND the exactCap value, so both
 * always appear at the same scale — ensuring "count > cap" comparisons
 * in indicator strings are always internally consistent.
 */
export function formatBuildCount(n: bigint): string {
  const m = Number(n);
  if (m >= 1e12) return (m / 1e12).toFixed(1) + "T";
  if (m >= 1e9) return (m / 1e9).toFixed(1) + "B";
  if (m >= 1e6) return (m / 1e6).toFixed(1) + "M";
  if (m >= 1e4) return Math.round(m / 1000) + "k";
  if (m >= 1000) return (m / 1000).toFixed(1) + "k";
  return String(m);
}

// ---------------------------------------------------------------------------
// Constrained build count (dual-color-aware DP)
// ---------------------------------------------------------------------------

/**
 * Count distinct 10-Pokémon builds from the pool whose per-color counts
 * exactly satisfy every entry in colorConstraints (unconstrained colors are
 * free). Dual-color emblems are handled correctly: a Pokémon whose emblem has
 * two colors contributes +1 to both of the checked colors it carries.
 *
 * Algorithm: groups distinct Pokémon by their "color-type vector" (which
 * constrained colors they carry), then runs a BigInt DP over the groups.
 * Mirrors countColorTargetBuilds in uniteemblemfinder.github.io/src/app.js
 * (clean-room TypeScript port; no code copied verbatim).
 *
 * Returns:
 *  - a BigInt with the exact count, when feasible and computable.
 *  - 0n when the constraints cannot be met by any build from the pool.
 *  - null when the DP state space would exceed MAX_DP_STATES (too large to
 *    count quickly; caller should display "too many to count").
 */
export function countConstrainedBuilds(
  pool: EmblemCandidate[],
  colorConstraints: Map<EmblemColor, number>,
  slots = 10,
): bigint | null {
  const checked = [...colorConstraints.keys()];
  if (!checked.length) return null;

  const targetVec = checked.map((col) => colorConstraints.get(col)!);
  const sum = targetVec.reduce((a, b) => a + b, 0);
  if (sum > 2 * slots) return 0n;
  if (targetVec.some((t) => t > slots)) return 0n;

  // Distinct Pokémon → colors + grade-variant count (colors are grade-independent)
  const byName = new Map<string, { colors: EmblemColor[]; variants: number }>();
  for (const c of pool) {
    const entry = byName.get(c.pokemonName);
    if (!entry) {
      byName.set(c.pokemonName, { colors: c.colors, variants: 1 });
    } else {
      entry.variants++;
    }
  }

  // Group Pokémon by their color-type vector over the checked colors.
  // e.g. a Pokémon with colors=[green,black] and checked=[green,black]
  // gets vec=[1,1]; one with colors=[green] gets vec=[1,0].
  const groupMap = new Map<string, { vec: number[]; variantCounts: number[] }>();
  for (const { colors, variants } of byName.values()) {
    const vec = checked.map((col) => (colors.includes(col) ? 1 : 0));
    const key = vec.join(",");
    const g = groupMap.get(key) ?? { vec, variantCounts: [] };
    g.variantCounts.push(variants);
    groupMap.set(key, g);
  }
  const groups = [...groupMap.values()];

  // DP state: "slotsUsed|count0,count1,..." → number of ways (BigInt).
  const initKey = "0|" + targetVec.map(() => 0).join(",");
  let dp = new Map<string, bigint>([[initKey, 1n]]);
  const MAX_DP_STATES = 300_000;

  for (const { vec, variantCounts } of groups) {
    const count = variantCounts.length;
    // e_x(variantCounts): ways to pick x Pokémon with grade assignments
    const pickWays = Array.from({ length: count + 1 }, () => 0n);
    pickWays[0] = 1n;
    for (const v of variantCounts) {
      const w = BigInt(v);
      for (let x = count; x >= 1; x--) {
        pickWays[x] += pickWays[x - 1] * w;
      }
    }

    const ndp = new Map<string, bigint>();
    for (const [key, ways] of dp) {
      const bar = key.indexOf("|");
      const usedSlots = +key.slice(0, bar);
      const colorCounts = key
        .slice(bar + 1)
        .split(",")
        .map(Number);

      for (let x = 0; x <= count; x++) {
        const ns = usedSlots + x;
        if (ns > slots) break;

        let ok = true;
        const nc = colorCounts.slice();
        for (let j = 0; j < nc.length; j++) {
          nc[j] += x * vec[j];
          if (nc[j] > targetVec[j]) {
            ok = false;
            break;
          }
        }
        if (!ok) break;

        const nk = ns + "|" + nc.join(",");
        ndp.set(nk, (ndp.get(nk) ?? 0n) + ways * pickWays[x]);
      }
    }
    if (ndp.size > MAX_DP_STATES) return null;
    dp = ndp;
  }

  return dp.get(slots + "|" + targetVec.join(",")) ?? 0n;
}
