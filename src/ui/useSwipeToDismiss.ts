import { useCallback, useRef, useState } from "react";
import { shouldDismissSheet } from "./swipeDismiss";

interface SwipeToDismiss {
  /** px the panel is currently translated down (0 at rest). */
  offsetY: number;
  /** true while a finger is down and dragging (disable transition so it tracks the finger). */
  dragging: boolean;
  /** Spread onto the drag-handle element (grabber + header region). */
  handleProps: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
  };
}

/**
 * Drag-down-to-dismiss for the mobile bottom sheet. Active only below the
 * `sm` breakpoint (≥640px is a centered modal, where dragging makes no sense).
 * Attach `handleProps` to the non-scrolling top region (grabber + header) so
 * the gesture never competes with the sheet body's own scroll.
 */
export function useSwipeToDismiss(onClose: () => void): SwipeToDismiss {
  const [offsetY, setOffsetY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const gestureRef = useRef({
    startY: 0,
    startTime: 0,
    pointerId: -1,
    panelHeight: 0,
  });

  const isActivePointer = (pointerId: number) =>
    gestureRef.current.pointerId !== -1 && gestureRef.current.pointerId === pointerId;

  const resetGesture = useCallback((target: HTMLElement, pointerId: number) => {
    gestureRef.current.pointerId = -1;
    setOffsetY(0);
    setDragging(false);
    try {
      if (target.hasPointerCapture(pointerId)) {
        target.releasePointerCapture(pointerId);
      }
    } catch {
      // ignore release failures
    }
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (typeof window === "undefined" || !window.matchMedia("(max-width: 639px)").matches) {
      return;
    }

    const panelHeight =
      (e.currentTarget.parentElement as HTMLElement | null)?.getBoundingClientRect().height ??
      window.innerHeight;

    gestureRef.current = {
      startY: e.clientY,
      startTime: e.timeStamp,
      pointerId: e.pointerId,
      panelHeight,
    };

    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isActivePointer(e.pointerId)) return;

    const dy = e.clientY - gestureRef.current.startY;
    setOffsetY(Math.max(0, dy));
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isActivePointer(e.pointerId)) return;

      const { startY, startTime, panelHeight } = gestureRef.current;
      const dy = Math.max(0, e.clientY - startY);
      const elapsed = Math.max(1, e.timeStamp - startTime);
      const velocity = dy / elapsed;

      gestureRef.current.pointerId = -1;

      if (
        shouldDismissSheet({
          dragPx: dy,
          velocityPxPerMs: velocity,
          sheetHeightPx: panelHeight,
        })
      ) {
        onClose();
      } else {
        setOffsetY(0);
      }

      setDragging(false);
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // ignore release failures
      }
    },
    [onClose],
  );

  const onPointerCancel = useCallback(
    (e: React.PointerEvent) => {
      if (!isActivePointer(e.pointerId)) return;
      resetGesture(e.currentTarget as HTMLElement, e.pointerId);
    },
    [resetGesture],
  );

  return {
    offsetY,
    dragging,
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  };
}
