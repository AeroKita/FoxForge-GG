import type { AttackType, StatBlock } from "../types";

export interface OffenseStat {
  key: "attack" | "spAttack";
  label: "Attack" | "Sp. Atk";
  value: number;
}

/** The offense stat a Pokémon actually scales on. Hybrid picks the higher
 *  of the two; ties go to Sp. Atk (matches the archived BuildSummaryBar). */
export function offenseFor(attackType: AttackType, effective: StatBlock): OffenseStat {
  if (attackType === "special") {
    return { key: "spAttack", label: "Sp. Atk", value: effective.spAttack };
  }
  if (attackType === "hybrid") {
    if (effective.spAttack >= effective.attack) {
      return { key: "spAttack", label: "Sp. Atk", value: effective.spAttack };
    }
    return { key: "attack", label: "Attack", value: effective.attack };
  }
  return { key: "attack", label: "Attack", value: effective.attack };
}
