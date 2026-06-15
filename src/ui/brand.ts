// ---------------------------------------------------------------- branding --
// Single source of truth for the app's name + tagline. The React UI and the
// web build (vite.config.ts → HTML <title> + PWA manifest) both read from here,
// so renaming the app is a one-line change in this file.
//
// A few native/release files can't import TypeScript and must be edited
// alongside this file for a full rename — see docs/08-branding.md for the list
// and the icon-regeneration process.

export const APP_NAME = "FoxForge GG";

// Compact form for tight spots (home-screen PWA label, etc.).
export const APP_SHORT_NAME = "FoxForge";

// Shown under the title in the app header.
export const APP_TAGLINE = "Forge your UNITE Loadout!";

// Used for the PWA manifest + meta description.
export const APP_DESCRIPTION =
  "FoxForge GG — design optimized Pokémon UNITE loadouts: emblems, held & trainer items, attack speed, and live stats.";
