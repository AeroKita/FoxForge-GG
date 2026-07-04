import { describe, it, expect } from "vitest";
import { radarRows } from "../radarData";
import type { RadarInput } from "../radarData";

const zero: RadarInput = {
  hp: 0,
  attack: 0,
  spAttack: 0,
  defense: 0,
  spDefense: 0,
  aps: 0,
};

describe("radarRows", () => {
  it("equal inputs → all 100/100", () => {
    const input: RadarInput = {
      hp: 5000,
      attack: 200,
      spAttack: 150,
      defense: 100,
      spDefense: 80,
      aps: 1.5,
    };
    const rows = radarRows(input, input);
    expect(rows).toHaveLength(6);
    for (const row of rows) {
      expect(row.a).toBe(100);
      expect(row.b).toBe(100);
    }
  });

  it("a.hp 200 / b.hp 100 → 100/50", () => {
    const a = { ...zero, hp: 200 };
    const b = { ...zero, hp: 100 };
    const rows = radarRows(a, b);
    const hp = rows.find((r) => r.axis === "HP");
    expect(hp?.a).toBe(100);
    expect(hp?.b).toBe(50);
  });

  it("both 0 on an axis → 0/0", () => {
    const a = { ...zero, attack: 100 };
    const b = { ...zero, attack: 50 };
    const rows = radarRows(a, b);
    const def = rows.find((r) => r.axis === "Def");
    expect(def?.a).toBe(0);
    expect(def?.b).toBe(0);
  });

  it("output length 6 in fixed order", () => {
    const rows = radarRows(
      { hp: 1, attack: 2, spAttack: 3, defense: 4, spDefense: 5, aps: 6 },
      zero,
    );
    expect(rows.map((r) => r.axis)).toEqual(["HP", "Atk", "Sp. Atk", "Def", "Sp. Def", "Atk/s"]);
  });
});
