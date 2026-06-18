import { describe, it, expect, beforeEach } from "vitest";
import type { SearchResult } from "../../engine/emblemSearch/types";
import {
  buildSearchSettingsKey,
  getEmblemSearchSessionState,
  getSessionSearchSettingsKey,
  persistSessionSearchSettings,
  resetEmblemSearchSession,
  SearchRunCoordinator,
  seedEmblemSearchSession,
  type EmblemSearchSettingsSnapshot,
  type EmblemSearchState,
} from "../emblemSearch";

interface PendingWorkerJob {
  id: string;
  runToken: number;
  resolve: (result: SearchResult | null) => void;
  reject: (error: Error) => void;
}

/** Mirrors hook logic: cancel must release a hung worker await before rerun. */
function simulateCancelThenRerun(
  coordinator: SearchRunCoordinator,
  pending: PendingWorkerJob | null,
  releasePending: (result: SearchResult | null) => PendingWorkerJob | null,
) {
  const firstToken = pending?.runToken ?? coordinator.begin();
  coordinator.cancel();
  releasePending(null);

  const secondToken = coordinator.begin();
  return {
    firstToken,
    secondToken,
    firstStillCurrent: coordinator.isCurrent(firstToken),
    secondCurrent: coordinator.isCurrent(secondToken),
  };
}

const BASE: EmblemSearchSettingsSnapshot = {
  pokemonId: "pikachu",
  optimizeLevel: 15,
  basicUseOwned: true,
  useOwned: false,
  mixedGrades: true,
  allowedGrades: ["bronze", "gold", "silver"],
  basicEffort: "exact",
  effort: "normal",
  colorBonuses: true,
  pokemonAwareScoring: true,
  exactCap: 1_000_000_000,
  mode: "maximize",
  customWeights: {},
  targetValues: {},
  targetActive: {},
  floorValues: {},
  floorActive: {},
  colorMode: "off",
  activeColors: [],
  colorCounts: {},
  ownedKeys: ["001-bulbasaur:gold"],
};

const MOCK_RESULT = {
  picks: [{ emblem: { id: "001-bulbasaur" }, grade: "gold" as const }],
  score: 42,
  candidates: 100,
  totalMs: 500,
  phase: "heuristic",
} as SearchResult;

const DONE_STATE: EmblemSearchState = {
  status: "done",
  progress: { pct: 100, label: "Done" },
  eta: null,
  result: MOCK_RESULT,
  errorMsg: null,
};

describe("buildSearchSettingsKey", () => {
  beforeEach(() => {
    resetEmblemSearchSession();
  });

  it("is stable for identical snapshots", () => {
    const a = buildSearchSettingsKey(BASE);
    const b = buildSearchSettingsKey({ ...BASE });
    expect(a).toBe(b);
  });

  it("changes when a search-relevant field changes", () => {
    const base = buildSearchSettingsKey(BASE);
    expect(buildSearchSettingsKey({ ...BASE, optimizeLevel: 10 })).not.toBe(base);
    expect(buildSearchSettingsKey({ ...BASE, basicUseOwned: false })).not.toBe(base);
    expect(buildSearchSettingsKey({ ...BASE, effort: "thorough" })).not.toBe(base);
    expect(buildSearchSettingsKey({ ...BASE, mode: "target" })).not.toBe(base);
    expect(buildSearchSettingsKey({ ...BASE, ownedKeys: ["002-ivysaur:silver"] })).not.toBe(base);
  });
});

describe("session cache", () => {
  beforeEach(() => {
    resetEmblemSearchSession();
  });

  it("stores and reads a completed search result", () => {
    const key = buildSearchSettingsKey(BASE);
    seedEmblemSearchSession(DONE_STATE, key);

    expect(getEmblemSearchSessionState()).toEqual(DONE_STATE);
    expect(getSessionSearchSettingsKey()).toBe(key);
  });

  it("updates the settings fingerprint after completion", () => {
    seedEmblemSearchSession(DONE_STATE, null);
    const key = buildSearchSettingsKey({ ...BASE, effort: "thorough" });

    persistSessionSearchSettings(key);

    expect(getSessionSearchSettingsKey()).toBe(key);
    expect(getEmblemSearchSessionState()?.result).toBe(MOCK_RESULT);
  });

  it("simulated remount baseline uses cached key instead of default remount settings", () => {
    const searchKey = buildSearchSettingsKey({ ...BASE, effort: "thorough", basicUseOwned: false });
    const remountDefaultsKey = buildSearchSettingsKey(BASE);

    seedEmblemSearchSession(DONE_STATE, searchKey);

    const remountBaseline = getSessionSearchSettingsKey() ?? remountDefaultsKey;
    expect(remountBaseline).toBe(searchKey);
    expect(remountBaseline).not.toBe(remountDefaultsKey);
  });

  it("clears session on reset", () => {
    seedEmblemSearchSession(DONE_STATE, buildSearchSettingsKey(BASE));
    resetEmblemSearchSession();
    expect(getEmblemSearchSessionState()).toBeNull();
    expect(getSessionSearchSettingsKey()).toBeNull();
  });
});

describe("SearchRunCoordinator", () => {
  it("invalidates a run after cancel so stale completions are ignored", () => {
    const coordinator = new SearchRunCoordinator();
    const first = coordinator.begin();
    expect(coordinator.isCurrent(first)).toBe(true);

    coordinator.cancel();
    expect(coordinator.isCurrent(first)).toBe(false);
  });

  it("invalidates prior runs when a new run begins", () => {
    const coordinator = new SearchRunCoordinator();
    const first = coordinator.begin();
    const second = coordinator.begin();

    expect(coordinator.isCurrent(first)).toBe(false);
    expect(coordinator.isCurrent(second)).toBe(true);
  });

  it("cancel then begin yields a fresh token for the replacement run", () => {
    const coordinator = new SearchRunCoordinator();
    const cancelled = coordinator.begin();
    coordinator.cancel();
    const replacement = coordinator.begin();

    expect(coordinator.isCurrent(cancelled)).toBe(false);
    expect(coordinator.isCurrent(replacement)).toBe(true);
  });

  it("cancel releases a pending worker await so rerun is not blocked", async () => {
    const coordinator = new SearchRunCoordinator();
    const firstToken = coordinator.begin();

    let pending: PendingWorkerJob | null = {
      id: "job-1",
      runToken: firstToken,
      resolve: () => {},
      reject: () => {},
    };

    const workerDone = new Promise<SearchResult | null>((resolve) => {
      pending!.resolve = resolve;
    });

    const releasePending = (result: SearchResult | null) => {
      const current = pending;
      if (!current) return null;
      pending = null;
      current.resolve(result);
      return current;
    };

    const rerun = simulateCancelThenRerun(coordinator, pending, releasePending);

    expect(await workerDone).toBeNull();
    expect(rerun.firstStillCurrent).toBe(false);
    expect(rerun.secondCurrent).toBe(true);
    expect(pending).toBeNull();
  });
});
