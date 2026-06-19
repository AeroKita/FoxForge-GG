/** Tuning for swipe-to-dismiss on the mobile bottom sheet. */
export const DISMISS_DISTANCE_FRACTION = 0.25; // drag past 25% of sheet height → dismiss
export const DISMISS_MIN_DISTANCE_PX = 80; // …but never require less than 80px
export const DISMISS_FLICK_VELOCITY = 0.5; // px/ms downward → flick-dismiss
export const DISMISS_FLICK_MIN_PX = 24; // a flick must still travel ≥24px (ignore taps)

export interface SwipeRelease {
  /** How far the panel was dragged down from rest, in px (≤0 means dragged up/none). */
  dragPx: number;
  /** Downward speed at release, px per millisecond. */
  velocityPxPerMs: number;
  /** Current rendered height of the sheet panel, in px. */
  sheetHeightPx: number;
}

/**
 * Decide whether a released downward drag should dismiss the sheet.
 * Dismiss when EITHER the drag passed the distance threshold
 * (max of MIN_DISTANCE_PX and a fraction of the sheet height),
 * OR it was a fast downward flick that still traveled a minimum distance.
 */
export function shouldDismissSheet({
  dragPx,
  velocityPxPerMs,
  sheetHeightPx,
}: SwipeRelease): boolean {
  if (dragPx <= 0) return false;

  const distanceThreshold = Math.max(
    DISMISS_MIN_DISTANCE_PX,
    sheetHeightPx * DISMISS_DISTANCE_FRACTION,
  );
  if (dragPx >= distanceThreshold) return true;

  if (velocityPxPerMs >= DISMISS_FLICK_VELOCITY && dragPx >= DISMISS_FLICK_MIN_PX) {
    return true;
  }

  return false;
}
