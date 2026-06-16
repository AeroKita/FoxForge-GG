import { useEffect } from "react";

/**
 * Shared modal behavior: close on Escape and lock background scroll while open.
 * Keeps overlay components consistent and keyboard-friendly.
 */
export function useModalDismiss(onClose: () => void, open = true) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, open]);
}
