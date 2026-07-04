import { lazy, Suspense } from "react";
import { useStore } from "../../state/store";
import { HeroBand } from "../HeroBand";
import { RecommendPanel } from "../RecommendPanel";
import { LoadoutBoard } from "../LoadoutBoard";
import { MovesCard } from "../MovesCard";
import { StatPanel } from "../StatPanel";
import { StatDock } from "../StatDock";

const LevelGraph = lazy(() => import("../LevelGraph").then((m) => ({ default: m.LevelGraph })));

/** Build tab: hero band, recommendations, loadout board, moves, stats, and the stat dock. */
export function BuildScreen() {
  const { expert } = useStore();

  return (
    <div className="flex flex-col gap-3">
      <HeroBand />
      <RecommendPanel />
      <LoadoutBoard />
      <MovesCard />
      <StatPanel />
      {expert && (
        <Suspense fallback={null}>
          <LevelGraph />
        </Suspense>
      )}
      <div aria-hidden className="h-16" />
      <StatDock />
    </div>
  );
}
