import { useCallback, useEffect, useRef } from "react";

/** Press-and-hold auto-repeat for stepper buttons: one step on press, then
 *  after an initial delay, repeated steps until release. Returns handlers to
 *  spread onto a <button>. Keyboard activation still works via onClick. */
export function useHoldRepeat(step: () => void): {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
  onClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
} {
  const stepRef = useRef(step);
  stepRef.current = step;

  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (delayRef.current != null) {
      clearTimeout(delayRef.current);
      delayRef.current = null;
    }
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const onPointerDown = useCallback(
    (_e: React.PointerEvent) => {
      stepRef.current();
      clearTimers();
      delayRef.current = setTimeout(() => {
        delayRef.current = null;
        intervalRef.current = setInterval(() => {
          stepRef.current();
        }, 75);
      }, 400);
    },
    [clearTimers],
  );

  const onPointerUp = useCallback(() => {
    clearTimers();
  }, [clearTimers]);

  const onPointerLeave = useCallback(() => {
    clearTimers();
  }, [clearTimers]);

  const onPointerCancel = useCallback(() => {
    clearTimers();
  }, [clearTimers]);

  const onClick = useCallback((e: React.MouseEvent) => {
    if (e.detail === 0) {
      stepRef.current();
    }
  }, []);

  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return {
    onPointerDown,
    onPointerUp,
    onPointerLeave,
    onPointerCancel,
    onClick,
    onContextMenu,
  };
}
