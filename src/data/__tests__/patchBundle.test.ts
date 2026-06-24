import { describe, it, expect } from "vitest";
import { loadBundle } from "../loadBundle";
import { computeEmblemLoadout } from "../../engine/emblems";
import { computeEffectiveStats } from "../../engine/formulas";
import type { CalcContext } from "../../types";
import raw from "../patch-current.json";

// Guards the live community bundle (UNITE-DB) against schema drift and bad data.
describe("community data bundle", () => {
  const bundle = loadBundle(raw);

  it("zod-validates and has the full roster", () => {
    expect(bundle.pokemon.length).toBeGreaterThanOrEqual(90);
    expect(bundle.heldItems.length).toBeGreaterThanOrEqual(40);
    expect(bundle.emblems.length).toBeGreaterThanOrEqual(250);
    expect(bundle.setBonuses.length).toBeGreaterThanOrEqual(9);
  });

  it("reproduces Lucario Lv15 in-game base stats", () => {
    const l = bundle.pokemon.find((p) => p.id === "lucario")!;
    const s = l.baseStatsByLevel[14];
    expect(s).toMatchObject({ hp: 7249, attack: 429, defense: 390, spAttack: 115, spDefense: 300 });
    expect(s.critRate).toBe(0.2);
    expect(s.attackSpeed).toBe(0.4);
    expect(s.moveSpeed).toBe(4300);
  });

  it("has exact max-level held-item flats at grade 40", () => {
    const fs = bundle.heldItems.find((i) => i.id === "float-stone")!.statsByGrade["40"];
    expect(fs).toMatchObject({ attack: 28, moveSpeed: 175 });
    const mb = bundle.heldItems.find((i) => i.id === "muscle-band")!.statsByGrade["40"];
    expect(mb.attack).toBe(17.5);
    expect(mb.attackSpeed).toBeCloseTo(0.0875, 6);
  });

  it("every pokemon has 15 level rows and a local asset path", () => {
    for (const p of bundle.pokemon) {
      expect(p.baseStatsByLevel).toHaveLength(15);
      expect(p.imageAsset).toMatch(/^\/assets\//);
    }
  });

  it("applies 6-Brown set bonus then item flats in the right order", () => {
    const lucario = bundle.pokemon.find((p) => p.id === "lucario")!;
    const brown = bundle.emblems
      .filter((e) => e.colors.includes("brown"))
      .slice(0, 6)
      .map((emblem) => ({ emblem, grade: "gold" as const }));
    const loadout = computeEmblemLoadout(brown, bundle.setBonuses);
    expect(loadout.activeSetBonuses.find((b) => b.color === "brown")?.bonusPercent).toBe(0.04);
    const ctx: CalcContext = { inCombat: true, goalsScored: 0 };
    const eff = computeEffectiveStats(lucario, 15, loadout, [], [], ctx);
    // attack must be strictly greater than base 429 after the +4% brown bonus
    expect(eff.attack).toBeGreaterThan(429);
  });

  it("marks UNITE-DB gold-only emblems (no silver/bronze on CDN)", () => {
    const goldOnly = bundle.emblems.filter((e) => e.goldOnly);
    expect(goldOnly.map((e) => e.pokemonName).sort()).toEqual([
      "Floragato",
      "Latias",
      "Latios",
      "Meowscarada",
      "Miraidon",
      "Sprigatito",
    ]);
  });

  it("gives every non-basic move a local skill-icon path", () => {
    for (const p of bundle.pokemon) {
      for (const m of p.moves) {
        if (m.slot === "basicAttack") continue;
        expect(m.iconAsset, `${p.id}/${m.name}`).toMatch(/^\/assets\/skills\//);
      }
    }
  });

  it("carries each curated build's two final moves (resolvable to icons)", () => {
    const lucario = bundle.pokemon.find((p) => p.id === "lucario")!;
    const moveByName = new Map(lucario.moves.map((m) => [m.name, m]));
    const build = lucario.builds!.find((b) => b.name === "Extreme Rush")!;
    expect(build.moves).toEqual(["Extreme Speed", "Bone Rush"]);
    for (const name of build.moves!) {
      expect(moveByName.get(name)?.iconAsset).toMatch(/^\/assets\/skills\//);
    }
  });

  it("every build move name resolves to a move in that Pokémon's catalog", () => {
    for (const p of bundle.pokemon) {
      const names = new Set(p.moves.map((m) => m.name));
      for (const b of p.builds ?? []) {
        for (const mv of b.moves ?? []) {
          expect(names.has(mv), `${p.id}: build "${b.name}" move "${mv}"`).toBe(true);
        }
      }
    }
  });

  it("held items expose grades 1–40 with correct scaling (Muscle Band)", () => {
    const mb = bundle.heldItems.find((i) => i.id === "muscle-band")!;
    expect(Object.keys(mb.statsByGrade)).toHaveLength(40);
    expect(mb.statsByGrade["30"]?.attack).toBe(15);
    expect(mb.statsByGrade["40"]?.attack).toBe(17.5);
    expect(mb.statsByGrade["40"]?.attackSpeed).toBeCloseTo(0.0875, 6);
  });

  it("carries structured grade 1/10/20 effect tiers from the source", () => {
    const mb = bundle.heldItems.find((i) => i.id === "muscle-band")!;
    expect(mb.effect).toEqual({ label: "Remaining HP", tiers: ["1%", "2%", "3%"] });
    const dc = bundle.heldItems.find((i) => i.id === "drain-crown")!;
    expect(dc.effect).toEqual({ label: "Lifesteal", tiers: ["9%", "12%", "15%"] });
  });

  describe("Basic/Advanced move descriptions", () => {
    it("Talonflame Fly upgrade has tiered descriptions", () => {
      const talonflame = bundle.pokemon.find((p) => p.id === "talonflame")!;
      const fly = talonflame.moves.find((m) => m.id === "fly")!;
      expect(fly.descriptionAdvanced).toContain("flies up into the sky for up to 3s");
      expect(fly.descriptionAdvanced).toContain(
        "Upgrade (Level 13): Throws opposing Pokémon hit for 0.4s",
      );
      expect(fly.description).toContain(
        "Upgrade (Level 13): Also throws enemies when this move hits",
      );
    });

    it("Talonflame Gale Wings passive has Advanced text", () => {
      const talonflame = bundle.pokemon.find((p) => p.id === "talonflame")!;
      expect(talonflame.passiveAbility.descriptionAdvanced).toContain("85% max HP");
    });

    it("Tyranitar Guts passive omits Advanced and keeps Basic", () => {
      const tyranitar = bundle.pokemon.find((p) => p.id === "tyranitar")!;
      expect(tyranitar.passiveAbility.id).toBe("guts");
      expect(tyranitar.passiveAbility.descriptionAdvanced).toBeUndefined();
      expect(tyranitar.passiveAbility.description.length).toBeGreaterThan(0);
    });
  });

  // Curated-merge regression guard: normalize.py must keep hand-curated emblemName labels.
  it("preserves curated build emblemName from curated_builds.json", () => {
    const skeledirge = bundle.pokemon.find((p) => p.id === "skeledirge")!;
    const build = skeledirge.builds!.find((b) => b.name === "Singing Special Attacker")!;
    expect(build.emblemName).toBe("Singing Special Attacker");
  });

  describe("upgrade-line paragraph formatting", () => {
    it("Pikachu Thunderbolt has a blank line before the upgrade bonus", () => {
      const pikachu = bundle.pokemon.find((p) => p.id === "pikachu")!;
      const thunderbolt = pikachu.moves.find((m) => m.id === "thunderbolt")!;
      expect(thunderbolt.description).toContain("\n\nUpgrade (Level 13):");
    });

    it("Quaquaval Low Sweep / Liquidation Basic text carries the upgrade level", () => {
      const q = bundle.pokemon.find((p) => p.id === "quaquaval")!;
      const lowSweep = q.moves.find((m) => m.name === "Low Sweep")!;
      const liquidation = q.moves.find((m) => m.name === "Liquidation")!;
      expect(lowSweep.description).toContain("\n\nUpgrade (Level 11):");
      expect(liquidation.description).toContain("\n\nUpgrade (Level 13):");
      // no bare marker left anywhere in Basic descriptions
      for (const p of bundle.pokemon) {
        for (const m of p.moves) {
          expect(m.description ?? "", `${p.id}/${m.name}`).not.toMatch(/Upgrade:(?! \(Level)/);
        }
      }
    });

    it("every Upgrade (Level marker is preceded by a blank line", () => {
      const upgradePattern = /Upgrade \(Level/g;
      for (const p of bundle.pokemon) {
        for (const m of p.moves) {
          for (const text of [m.description, m.descriptionAdvanced]) {
            if (!text) continue;
            let match: RegExpExecArray | null;
            while ((match = upgradePattern.exec(text)) !== null) {
              const idx = match.index;
              if (idx > 0) {
                expect(text.slice(idx - 2, idx), `${p.id}/${m.name}`).toBe("\n\n");
              }
            }
          }
        }
        const pa = p.passiveAbility;
        for (const text of [pa.description, pa.descriptionAdvanced]) {
          if (!text) continue;
          let match: RegExpExecArray | null;
          while ((match = upgradePattern.exec(text)) !== null) {
            const idx = match.index;
            if (idx > 0) {
              expect(text.slice(idx - 2, idx), `${p.id}/passive`).toBe("\n\n");
            }
          }
        }
      }
    });
  });

  describe("move GIF assets", () => {
    it("every gifAsset is a local skills WebP path", () => {
      for (const p of bundle.pokemon) {
        for (const m of p.moves) {
          if (!m.gifAsset) continue;
          expect(m.gifAsset, `${p.id}/${m.name}`).toMatch(/^\/assets\/skills\//);
          expect(m.gifAsset, `${p.id}/${m.name}`).toMatch(/\.webp$/);
        }
        if (p.passiveAbility.gifAsset) {
          expect(p.passiveAbility.gifAsset, `${p.id}/passive`).toMatch(/^\/assets\/skills\//);
          expect(p.passiveAbility.gifAsset, `${p.id}/passive`).toMatch(/\.webp$/);
        }
      }
    });

    it("Garchomp has no gifAsset but keeps iconAsset on moves (fallback)", () => {
      const garchomp = bundle.pokemon.find((p) => p.id === "garchomp")!;
      for (const m of garchomp.moves) {
        if (m.slot === "basicAttack") continue;
        expect(m.gifAsset).toBeUndefined();
        expect(m.iconAsset).toMatch(/^\/assets\/skills\//);
      }
      expect(garchomp.passiveAbility.gifAsset).toBeUndefined();
    });
  });

  describe("move video assets", () => {
    it("Talonflame Fly has a well-formed videoAsset", () => {
      const talonflame = bundle.pokemon.find((p) => p.id === "talonflame")!;
      const fly = talonflame.moves.find((m) => m.id === "fly")!;
      expect(fly.videoAsset).toBe("/assets/skills/Talonflame/Fly.mp4");
    });

    it("every videoAsset is a local skills MP4 path", () => {
      for (const p of bundle.pokemon) {
        for (const m of p.moves) {
          if (!m.videoAsset) continue;
          expect(m.videoAsset, `${p.id}/${m.name}`).toMatch(/^\/assets\/skills\//);
          expect(m.videoAsset, `${p.id}/${m.name}`).toMatch(/\.mp4$/);
        }
      }
    });

    it("a move with videoAsset does not carry a redundant gifAsset", () => {
      const talonflame = bundle.pokemon.find((p) => p.id === "talonflame")!;
      const fly = talonflame.moves.find((m) => m.id === "fly")!;
      expect(fly.videoAsset).toBeDefined();
      expect(fly.gifAsset).toBeUndefined();
    });

    it("no move carries both videoAsset and gifAsset", () => {
      for (const p of bundle.pokemon) {
        for (const m of p.moves) {
          if (!m.videoAsset) continue;
          expect(m.gifAsset, `${p.id}/${m.name}`).toBeUndefined();
        }
      }
    });

    it("every non-basicAttack move has videoAsset when the roster clip registry is complete", () => {
      for (const p of bundle.pokemon) {
        for (const m of p.moves) {
          if (m.slot === "basicAttack") continue;
          expect(m.videoAsset, `${p.id}/${m.name}`).toBeDefined();
        }
      }
    });
  });

  describe("Unite-move levels and activation-note cleanup", () => {
    it("gives every Unite move a numeric upgradeLevel", () => {
      for (const p of bundle.pokemon) {
        for (const m of p.moves) {
          if (m.slot !== "uniteMove") continue;
          expect(typeof m.upgradeLevel, `${p.id}/${m.name}`).toBe("number");
        }
      }
    });

    it("leaves no 'Activates at Level' note in any description", () => {
      for (const p of bundle.pokemon) {
        for (const m of p.moves) {
          expect(m.description ?? "", `${p.id}/${m.name}`).not.toContain("Activates at Level");
          expect(m.descriptionAdvanced ?? "", `${p.id}/${m.name}`).not.toContain(
            "Activates at Level",
          );
        }
      }
    });

    it("Quaquaval Carnival Splash is Lv 9", () => {
      const q = bundle.pokemon.find((p) => p.id === "quaquaval")!;
      const cs = q.moves.find((m) => m.name === "Carnival Splash")!;
      expect(cs.upgradeLevel).toBe(9);
    });

    it("Blaziken Spinning Flame Kick has its Basic text and Spinning Flame Fist is space-fixed", () => {
      const b = bundle.pokemon.find((p) => p.id === "blaziken")!;
      const kick = b.moves.find((m) => m.name === "Spinning Flame Kick")!;
      const fist = b.moves.find((m) => m.name === "Spinning Flame Fist")!;
      expect(kick.description).toContain("switches to kick style");
      expect(kick.upgradeLevel).toBe(8);
      expect(fist.description).toContain("for a short time. After using this move");
      expect(fist.description).not.toContain("time.After");
    });
  });
});
