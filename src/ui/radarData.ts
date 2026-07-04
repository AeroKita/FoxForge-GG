export interface RadarInput {
  hp: number;
  attack: number;
  spAttack: number;
  defense: number;
  spDefense: number;
  aps: number; // attacks per second
}

export interface RadarRow {
  axis: string; // "HP" | "Atk" | "Sp. Atk" | "Def" | "Sp. Def" | "Atk/s"
  a: number; // 0–100, normalized per axis
  b: number;
}

const AXES: { key: keyof Omit<RadarInput, never>; axis: string }[] = [
  { key: "hp", axis: "HP" },
  { key: "attack", axis: "Atk" },
  { key: "spAttack", axis: "Sp. Atk" },
  { key: "defense", axis: "Def" },
  { key: "spDefense", axis: "Sp. Def" },
  { key: "aps", axis: "Atk/s" },
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
