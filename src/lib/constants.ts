/** Keep in sync with the category list in claude-project-instructions.md. */
export const CATEGORIES = [
  "Ορεκτικά",
  "Σαλάτες",
  "Σούπες",
  "Λαδερά",
  "Όσπρια",
  "Ζυμαρικά & Ρύζι",
  "Κρέας",
  "Κοτόπουλο",
  "Ψάρι & Θαλασσινά",
  "Πίτες & Αρτοσκευάσματα",
  "Γλυκά",
  "Σάλτσες & Βάσεις",
  "Ποτά",
  "Άλλο",
] as const;

export const DEFAULT_CATEGORY = "Άλλο";

/** Keep in sync with the unit codes in claude-project-instructions.md. */
export const UNITS = [
  "g", "kg", "ml", "l", "tbsp", "tsp", "cup", "glass",
  "pc", "clove", "bunch", "pinch", "can", "pack", "slice",
] as const;

export const METRIC_LABEL = { g: "γρ.", ml: "ml" } as const;

/** Short Greek labels for the unit codes, as used on the shopping list. */
export const UNIT_LABEL = {
  g: "γρ.", kg: "κιλά", ml: "ml", l: "λίτρα", tbsp: "κ.σ.", tsp: "κ.γ.", cup: "φλ.", glass: "ποτ.",
  pc: "τεμ.", clove: "σκελ.", bunch: "ματσάκι", pinch: "πρέζα", can: "κονσ.", pack: "συσκ.", slice: "φέτες",
} as const;
