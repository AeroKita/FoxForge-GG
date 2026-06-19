import { useState } from "react";
import { asset } from "../ui/asset";

/** Tooltip visual shown below the text: the animated WebP when present, else the
 *  static skill icon (centered, not stretched), else nothing. GIFs are 16:9 and
 *  the icon is square — both are contained in one fixed media box. */
export function MoveMedia({
  gifAsset,
  iconAsset,
  name,
}: {
  gifAsset?: string;
  iconAsset?: string;
  name: string;
}) {
  const [stage, setStage] = useState<"gif" | "icon" | "none">(
    gifAsset ? "gif" : iconAsset ? "icon" : "none",
  );
  const src = stage === "gif" ? gifAsset : stage === "icon" ? iconAsset : undefined;
  if (!src) return null;
  return (
    <span className="mt-1.5 flex justify-center">
      <img
        src={asset(src)}
        alt={`${name} preview`}
        loading="lazy"
        onError={() => setStage((s) => (s === "gif" && iconAsset ? "icon" : "none"))}
        className="max-h-[120px] w-auto max-w-[180px] rounded-md object-contain"
      />
    </span>
  );
}
