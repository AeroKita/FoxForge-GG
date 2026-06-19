import { useEffect, useState } from "react";

/**
 * Mobile-friendly per-color count input (Expert mode color section).
 *
 * Uses type="text" + inputMode="numeric" so iOS shows the numeric keypad and
 * there are no native spinner quirks. Digits-only filtering keeps it numeric.
 * A draft string lets the user clear the field and retype without it snapping
 * back to 0 mid-edit; the value is clamped to [0, max] only on commit (blur).
 * text-base (>=16px) prevents iOS focus auto-zoom.
 */
export function ColorCountField({
  value,
  max,
  onCommit,
  label,
}: {
  value: number;
  max: number;
  onCommit: (n: number) => void;
  label: string;
}) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const onChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    setDraft(digits);
    if (digits !== "") onCommit(Number(digits));
  };

  const commit = () => {
    const clamped = Math.max(0, Math.min(max, Number(draft) || 0));
    setDraft(String(clamped));
    onCommit(clamped);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={draft}
      onChange={(e) => onChange(e.target.value)}
      onBlur={commit}
      aria-label={`${label} count`}
      className="min-h-11 w-14 rounded bg-surface px-1 py-0.5 text-center font-mono text-base text-ink ring-1 ring-line focus:outline-none focus:ring-accent sm:min-h-0 sm:w-12 sm:py-1"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    />
  );
}
