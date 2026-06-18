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
