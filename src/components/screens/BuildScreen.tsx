interface BuildScreenProps {
  onOpenPokePicker: () => void;
}

/** Build tab content — filled in Phase 3 (hero, panels, pickers). */
export function BuildScreen({ onOpenPokePicker }: BuildScreenProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
      <p>Build screen — Phase 3 adds the glance hero and editor panels.</p>
      <button
        type="button"
        onClick={onOpenPokePicker}
        className="min-h-11 self-start rounded-xl bg-accent-weak px-4 py-2 font-medium text-accent-ink"
      >
        Select a Pokémon
      </button>
    </div>
  );
}
