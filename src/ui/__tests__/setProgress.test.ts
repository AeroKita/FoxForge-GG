import { describe, it, expect } from "vitest";
import { setProgressRows } from "../setProgress";
import type { EmblemColor, EmblemSetBonus } from "../../types";

const brownBonus: EmblemSetBonus = {
  color: "brown",
  stat: "hp",
  thresholds: { 2: 0.01, 4: 0.02, 6: 0.04 },
};

const redBonus: EmblemSetBonus = {
  color: "red",
  stat: "attack",
  thresholds: { 3: 0.02, 5: 0.04, 7: 0.08 },
};

const fixtureBonuses = [brownBonus, redBonus];

describe("setProgressRows", () => {
  it("brown count 1 → met null, next 2", () => {
    const counts = new Map<EmblemColor, number>([["brown", 1]]);
    const rows = setProgressRows(counts, fixtureBonuses);
    expect(rows).toHaveLength(1);
    expect(rows[0].met).toBeNull();
    expect(rows[0].next).toBe(2);
  });

  it("brown count 4 → met {4, 0.02}, next 6", () => {
    const counts = new Map<EmblemColor, number>([["brown", 4]]);
    const rows = setProgressRows(counts, fixtureBonuses);
    expect(rows[0].met).toEqual({ threshold: 4, bonusPercent: 0.02, stat: "hp" });
    expect(rows[0].next).toBe(6);
  });

  it("brown count 6 → met {6, 0.04}, next null", () => {
    const counts = new Map<EmblemColor, number>([["brown", 6]]);
    const rows = setProgressRows(counts, fixtureBonuses);
    expect(rows[0].met).toEqual({ threshold: 6, bonusPercent: 0.04, stat: "hp" });
    expect(rows[0].next).toBeNull();
  });

  it("brown count 7 → met {6, 0.04}, next null (over-top clamps)", () => {
    const counts = new Map<EmblemColor, number>([["brown", 7]]);
    const rows = setProgressRows(counts, fixtureBonuses);
    expect(rows[0].met).toEqual({ threshold: 6, bonusPercent: 0.04, stat: "hp" });
    expect(rows[0].next).toBeNull();
  });

  it("red count 3 → met {3, 0.02}, next 5", () => {
    const counts = new Map<EmblemColor, number>([["red", 3]]);
    const rows = setProgressRows(counts, fixtureBonuses);
    expect(rows[0].met).toEqual({ threshold: 3, bonusPercent: 0.02, stat: "attack" });
    expect(rows[0].next).toBe(5);
  });

  it("color with no bonus entry → met null, next null", () => {
    const counts = new Map<EmblemColor, number>([["gray", 2]]);
    const rows = setProgressRows(counts, fixtureBonuses);
    expect(rows[0].met).toBeNull();
    expect(rows[0].next).toBeNull();
  });

  it("sorting: counts {brown: 2, white: 6} → white first", () => {
    const counts = new Map<EmblemColor, number>([
      ["brown", 2],
      ["white", 6],
    ]);
    const rows = setProgressRows(counts, fixtureBonuses);
    expect(rows.map((r) => r.color)).toEqual(["white", "brown"]);
  });
});
