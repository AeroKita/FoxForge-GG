export interface RadarInput {
  hp: number;
  attack: number;
  defense: number;
  moveSpeed: number;
  spDefense: number;
  spAttack: number;
}

export interface RadarRow {
  axis: string; // "HP" | "Atk" | "Def" | "Speed" | "Sp. Def" | "Sp. Atk"
  a: number; // 0–100, normalized per axis
  b: number;
}

const AXES: { key: keyof Omit<RadarInput, never>; axis: string }[] = [
  { key: "hp", axis: "HP" },
  { key: "attack", axis: "Atk" },
  { key: "defense", axis: "Def" },
  { key: "moveSpeed", axis: "Speed" },
  { key: "spDefense", axis: "Sp. Def" },
  { key: "spAttack", axis: "Sp. Atk" },
];

/** Per-axis normalization to max(a, b) × 100 so shapes are comparable
 *  regardless of magnitude. Both zero (or max ≤ 0) → 0 for both. */
export function radarRows(a: RadarInput, b: RadarInput): RadarRow[] {
  return AXES.map(({ key, axis }) => {
    const av = a[key];
    const bv = b[key];
    const max = Math.max(av, bv);
    if (max <= 0) return { axis, a: 0, b: 0 };
    return { axis, a: (av / max) * 100, b: (bv / max) * 100 };
  });
}
