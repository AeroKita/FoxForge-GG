import { describe, expect, it } from "vitest";
import { deriveBuild } from "../derive";
import { emptyLoadout } from "../../state/loadout";

describe("deriveBuild — out-of-combat move speed (issue #25)", () => {
  it("Float Stone raises OOC move speed above the in-combat stat (real bundle data)", () => {
    const loadout = {
      ...emptyLoadout("absol"),
      heldItemIds: ["float-stone", null, null],
    };
    const d = deriveBuild(loadout, true, [40, 40, 40]);
    expect(d.effective).not.toBeNull();
    // grade-40 Float Stone = +20% OOC on top of the in-combat move speed.
    expect(d.oocMoveSpeed).toBe(Math.floor(d.effective!.moveSpeed * 1.2));
    expect(d.oocMoveSpeed!).toBeGreaterThan(d.effective!.moveSpeed);
  });

  it("yellow set bonus raises OOC move speed but not the in-combat stat", () => {
    const yellowIds = [
      "025-pikachu",
      "026-raichu",
      "081-magnemite",
      "082-magneton",
      "125-electabuzz",
      "135-jolteon",
      "100-voltorb",
    ];
    const loadout = {
      ...emptyLoadout("absol"),
      emblems: yellowIds.map((emblemId) => ({ emblemId, grade: "gold" as const })),
    };
    const d = deriveBuild(loadout, true, [40, 40, 40]);
    expect(d.emblemLoadout.activeSetBonuses.some((b) => b.color === "yellow")).toBe(true);
    // Yellow is gated out of the in-combat block but must lift OOC speed.
    expect(d.oocMoveSpeed!).toBeGreaterThan(d.effective!.moveSpeed);
  });
});
