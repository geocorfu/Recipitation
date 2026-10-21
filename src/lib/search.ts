import type { RecipeData } from "./types";

/**
 * Lowercase, accents stripped, final ς mapped to σ, spaces collapsed.
 * Used for search_text on save and for the query, so "μπριαμ" finds "Μπριάμ".
 */
export function normalizeForSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/ς/g, "σ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildSearchText(r: RecipeData): string {
  const parts = [
    r.title,
    r.from_person,
    r.category,
    ...r.tags,
    ...r.ingredients.flatMap((g) => g.items.map((i) => i.name)),
    r.notes,
  ];
  return normalizeForSearch(parts.filter(Boolean).join(" "));
}

/** Every word of the query must appear somewhere, in any order. */
export function matchesQuery(searchText: string, query: string): boolean {
  const words = normalizeForSearch(query).split(" ").filter(Boolean);
  return words.every((w) => searchText.includes(w));
}
