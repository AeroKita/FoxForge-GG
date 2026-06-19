import { describe, it, expect } from "vitest";
import { isSearchResultStale } from "../staleResult";

describe("isSearchResultStale", () => {
  it("is not stale when there is no captured baseline (null)", () => {
    expect(isSearchResultStale(null, "settings-abc")).toBe(false);
  });

  it("is not stale when the live key matches the result key", () => {
    expect(isSearchResultStale("settings-abc", "settings-abc")).toBe(false);
  });

  it("is stale when the live key differs from the result key", () => {
    expect(isSearchResultStale("settings-abc", "settings-xyz")).toBe(true);
  });

  it("treats an empty-string live key as a real (differing) value", () => {
    expect(isSearchResultStale("settings-abc", "")).toBe(true);
    expect(isSearchResultStale("", "")).toBe(false);
  });
});
