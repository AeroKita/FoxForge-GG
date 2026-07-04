import type { Role } from "../types";

// Role accent colors (Pokémon UNITE's role palette) for badges/borders.
export const ROLE_COLOR: Record<Role, { bg: string; text: string; ring: string }> = {
  Attacker: { bg: "bg-rose-100", text: "text-rose-700", ring: "ring-rose-300" },
  AllRounder: { bg: "bg-violet-100", text: "text-violet-700", ring: "ring-violet-300" },
  Speedster: { bg: "bg-sky-100", text: "text-sky-700", ring: "ring-sky-300" },
  Defender: { bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-300" },
  Supporter: { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-amber-300" },
};

// Solid role fill for the active "filter by role" chip in the Pokémon picker.
// Hues match ROLE_COLOR's families (rose / violet / sky / emerald / amber) at a
// saturated fill shade; pair with readableTextColor() so label text stays legible
// on each fill in both light and dark mode.
export const ROLE_FILTER_HEX: Record<Role, string> = {
  Attacker: "#e11d48", // rose-600  — red
  AllRounder: "#7c3aed", // violet-600 — purple
  Speedster: "#0ea5e9", // sky-500   — blue
  Defender: "#10b981", // emerald-500 — green
  Supporter: "#f59e0b", // amber-500  — yellow
};

export const ROLE_LABEL: Record<Role, string> = {
  Attacker: "Attacker",
  AllRounder: "All-Rounder",
  Speedster: "Speedster",
  Defender: "Defender",
  Supporter: "Supporter",
};

// Hero-band surface + portrait ring per role, both themes. Hues match
// ROLE_COLOR's families; dark uses low-opacity 950 fills over the neon bg.
export const ROLE_BAND: Record<Role, { band: string; ring: string }> = {
  Attacker: { band: "bg-rose-50 dark:bg-rose-950/50", ring: "ring-rose-400 dark:ring-rose-500" },
  AllRounder: {
    band: "bg-violet-50 dark:bg-violet-950/50",
    ring: "ring-violet-400 dark:ring-violet-500",
  },
  Speedster: { band: "bg-sky-50 dark:bg-sky-950/50", ring: "ring-sky-400 dark:ring-sky-500" },
  Defender: {
    band: "bg-emerald-50 dark:bg-emerald-950/50",
    ring: "ring-emerald-400 dark:ring-emerald-500",
  },
  Supporter: {
    band: "bg-amber-50 dark:bg-amber-950/50",
    ring: "ring-amber-400 dark:ring-amber-500",
  },
};
