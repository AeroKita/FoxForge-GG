import { describe, it, expect } from "vitest";
import { offenseFor } from "../offense";
import type { StatBlock } from "../../types";

function statBlock(overrides: Partial<StatBlock>): StatBlock {
  return {
    hp: 0,
    attack: 0,
    defense: 0,
    spAttack: 0,
    spDefense: 0,
    attackSpeed: 0,
    critRate: 0,
    cdr: 0,
    lifesteal: 0,
    spLifesteal: 0,
    moveSpeed: 0,
    ...overrides,
  };
}

describe("offenseFor", () => {
  it("physical → attack", () => {
    const effective = statBlock({ attack: 120, spAttack: 80 });
    expect(offenseFor("physical", effective)).toEqual({
      key: "attack",
      label: "Attack",
      value: 120,
    });
  });

  it("special → spAttack", () => {
    const effective = statBlock({ attack: 120, spAttack: 80 });
    expect(offenseFor("special", effective)).toEqual({
      key: "spAttack",
      label: "Sp. Atk",
      value: 80,
    });
  });

  it("hybrid with attack 100 / spAttack 90 → attack", () => {
    const effective = statBlock({ attack: 100, spAttack: 90 });
    expect(offenseFor("hybrid", effective)).toEqual({
      key: "attack",
      label: "Attack",
      value: 100,
    });
  });

  it("hybrid with 90/100 → spAttack", () => {
    const effective = statBlock({ attack: 90, spAttack: 100 });
    expect(offenseFor("hybrid", effective)).toEqual({
      key: "spAttack",
      label: "Sp. Atk",
      value: 100,
    });
  });

  it("hybrid tie 100/100 → spAttack", () => {
    const effective = statBlock({ attack: 100, spAttack: 100 });
    expect(offenseFor("hybrid", effective)).toEqual({
      key: "spAttack",
      label: "Sp. Atk",
      value: 100,
    });
  });
});
