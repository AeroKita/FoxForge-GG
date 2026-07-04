import { activeBonusPercent } from "../engine/emblems";
import type { EmblemColor, EmblemSetBonus, StatBlock } from "../types";

export const STAT_LABEL: Partial<Record<keyof StatBlock, string>> = {
  attack: "Atk",
  spAttack: "Sp.Atk",
  defense: "Def",
  spDefense: "Sp.Def",
  hp: "HP",
  attackSpeed: "Atk Spd",
  cdr: "CDR",
  moveSpeed: "Move",
};

export interface SetProgressRow {
  color: EmblemColor;
  count: number;
  /** Highest met threshold's bonus, or null if none met yet. */
  met: { threshold: number; bonusPercent: number; stat: keyof StatBlock } | null;
  /** Next threshold above count, or null when the top threshold is met. */
  next: number | null;
}

/** One row per color with count > 0, sorted by count desc (ties: alphabetical
 *  color). Colors with no entry in `bonuses` get met: null, next: null. */
export function setProgressRows(
  counts: Map<EmblemColor, number>,
  bonuses: EmblemSetBonus[],
): SetProgressRow[] {
  const bonusByColor = new Map(bonuses.map((b) => [b.color, b]));

  const rows: SetProgressRow[] = [];
  for (const [color, count] of counts) {
    if (count <= 0) continue;
    const bonus = bonusByColor.get(color);
    if (!bonus) {
      rows.push({ color, count, met: null, next: null });
      continue;
    }

    const thresholds = Object.keys(bonus.thresholds)
      .map(Number)
      .sort((a, b) => a - b);

    const metPercent = activeBonusPercent(count, bonus.thresholds);
    const met =
      metPercent != null
        ? {
            threshold: thresholds.filter((t) => t <= count).pop()!,
            bonusPercent: metPercent,
            stat: bonus.stat,
          }
        : null;

    const next = thresholds.find((t) => t > count) ?? null;

    rows.push({ color, count, met, next });
  }

  rows.sort((a, b) => b.count - a.count || a.color.localeCompare(b.color));
  return rows;
}
