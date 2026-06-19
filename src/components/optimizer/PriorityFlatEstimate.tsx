import type { FlatStatPrediction } from "../../engine/emblemSearch/predictStats";
import type { StatBlock } from "../../types";
import { fmtDelta } from "./shared";

/** Inline estimate under a priority slider — sign is color-coded for quick scanning. */
export function PriorityFlatEstimate({
  stat,
  pred,
  weight,
}: {
  stat: keyof StatBlock;
  pred?: FlatStatPrediction;
  weight: number;
}) {
  if (stat === "cdr") {
    return <span className="text-faint">from black set bonus, not flat emblems</span>;
  }
  if (!pred) {
    return <span className="text-faint">no priority</span>;
  }
  const protectedOnly = weight <= 0 && pred.weight <= 0;
  const v = pred.predicted;
  const signClass = v > 0 ? "text-pos" : v < 0 ? "text-neg" : "text-muted";
  return (
    <>
      <span className="text-faint">Approx. </span>
      <span className={`font-mono font-semibold tabular-nums ${signClass}`}>
        {fmtDelta(stat, v)}
      </span>
      <span className="text-faint">
        {protectedOnly ? " from emblems (minimum only)" : " from emblems"}
      </span>
    </>
  );
}
