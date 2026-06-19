import { describe, it, expect } from "vitest";
import { shouldDismissSheet } from "../swipeDismiss";

describe("shouldDismissSheet", () => {
  it("never dismisses on zero or upward drag", () => {
    expect(shouldDismissSheet({ dragPx: 0, velocityPxPerMs: 0.8, sheetHeightPx: 800 })).toBe(false);
    expect(shouldDismissSheet({ dragPx: -50, velocityPxPerMs: 0.8, sheetHeightPx: 800 })).toBe(
      false,
    );
  });

  it("dismisses on slow drag past the distance threshold", () => {
    expect(shouldDismissSheet({ dragPx: 250, velocityPxPerMs: 0.01, sheetHeightPx: 800 })).toBe(
      true,
    );
  });

  it("does not dismiss on slow drag short of the distance threshold", () => {
    expect(shouldDismissSheet({ dragPx: 150, velocityPxPerMs: 0.01, sheetHeightPx: 800 })).toBe(
      false,
    );
  });

  it("applies the 80px floor on short sheets", () => {
    expect(shouldDismissSheet({ dragPx: 60, velocityPxPerMs: 0.01, sheetHeightPx: 200 })).toBe(
      false,
    );
    expect(shouldDismissSheet({ dragPx: 90, velocityPxPerMs: 0.01, sheetHeightPx: 200 })).toBe(
      true,
    );
  });

  it("dismisses on fast flick past min distance even when short of distance threshold", () => {
    expect(shouldDismissSheet({ dragPx: 40, velocityPxPerMs: 0.8, sheetHeightPx: 800 })).toBe(true);
  });

  it("does not dismiss on fast flick that barely moved", () => {
    expect(shouldDismissSheet({ dragPx: 10, velocityPxPerMs: 0.8, sheetHeightPx: 800 })).toBe(
      false,
    );
  });
});
