import { CATEGORIES, DEFAULT_CATEGORY, METRIC_LABEL, UNITS } from "./constants";
import { buildSearchText, normalizeForSearch } from "./search";
import type {
  Category,
  Ingredient,
  IngredientGroup,
  Metric,
  PastedRecipe,
  Recipe,
  RecipeData,
  StepGroup,
  Unit,
} from "./types";

export const MAX_RECIPES_PER_PASTE = 1000;

// ---------------------------------------------------------------
// Cleaning. Runs in the browser for the preview and again on the
// server before saving, so nothing pasted is trusted as-is.
// ---------------------------------------------------------------

function text(v: unknown, max = 500): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  return t === "" ? null : t;
}

/** Accepts 2, "2" or "1,5"; anything else is null. */
function num(v: unknown, max: number): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v.replace(",", ".")) : NaN;
  return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
}

function int(v: unknown, max: number): number | null {
  const n = num(v, max);
  return n === null ? null : Math.round(n);
}

/** Only http(s) links, so a pasted "javascript:" or placeholder never becomes a link or image. */
function link(v: unknown): string | null {
  const s = text(v, 2000);
  if (!s || s.includes("...")) return null;
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validId(v: unknown): string | null {
  return typeof v === "string" && UUID.test(v.trim()) ? v.trim().toLowerCase() : null;
}

function category(v: unknown): Category {
  const s = text(v, 100);
  if (!s) return DEFAULT_CATEGORY;
  const key = normalizeForSearch(s);
  return CATEGORIES.find((c) => normalizeForSearch(c) === key) ?? DEFAULT_CATEGORY;
}

function tags(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of v) {
    const s = text(t, 40);
    if (!s || seen.has(normalizeForSearch(s))) continue;
    seen.add(normalizeForSearch(s));
    out.push(s);
  }
  return out.slice(0, 10);
}

function unit(v: unknown): Unit | null {
  return (UNITS as readonly unknown[]).includes(v) ? (v as Unit) : null;
}

function metric(v: unknown): Metric | null {
  if (!v || typeof v !== "object") return null;
  const m = v as Record<string, unknown>;
  const amount = num(m.amount, 100000);
  if (amount === null || amount <= 0 || (m.unit !== "g" && m.unit !== "ml")) return null;
  return {
    amount: Math.round(amount * 10) / 10,
    unit: m.unit,
    // When Claude leaves it out, treat the amount as a guess rather than as Argiro's table.
    estimated: m.estimated !== false,
  };
}

function ingredient(v: unknown): Ingredient | null {
  if (typeof v === "string") {
    const s = text(v);
    return s ? { quantity: null, unit: null, name: s, note: null, text: s, metric: null } : null;
  }
  if (!v || typeof v !== "object") return null;
  const i = v as Record<string, unknown>;
  const quantity = num(i.quantity, 100000);
  const u = unit(i.unit);
  const note = text(i.note, 200);
  const name = text(i.name, 200) ?? text(i.text, 200);
  if (!name) return null;
  return {
    quantity,
    unit: u,
    name,
    note,
    text: text(i.text) ?? [quantity, u, name, note].filter((x) => x !== null).join(" "),
    metric: quantity !== null ? metric(i.metric) : null,
  };
}

/** Accepts the grouped shape, or a flat list of items in case Claude skipped the groups. */
function groups<T>(v: unknown, item: (x: unknown) => T | null): { group: string | null; items: T[] }[] {
  if (!Array.isArray(v)) return [];
  const isGrouped = v.some((g) => g && typeof g === "object" && Array.isArray((g as { items?: unknown }).items));
  const raw = isGrouped ? v : [{ group: null, items: v }];
  return raw
    .filter((g): g is Record<string, unknown> => !!g && typeof g === "object")
    .map((g) => ({
      group: text(g.group, 100),
      items: (Array.isArray(g.items) ? g.items : [])
        .map(item)
        .filter((x): x is T => x !== null)
        .slice(0, 200),
    }))
    .filter((g) => g.items.length > 0)
    .slice(0, 20);
}

const step = (v: unknown) => text(v, 2000);

/** Turns one pasted object into a clean recipe, or null if it has no title. */
export function normalizeRecipe(raw: unknown): PastedRecipe | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const title = text(r.title, 200);
  if (!title) return null;
  return {
    id: validId(r.id),
    title,
    category: category(r.category),
    tags: tags(r.tags),
    from_person: text(r.from_person, 200),
    servings: int(r.servings, 1000),
    yield: text(r.yield, 200),
    prep_minutes: int(r.prep_minutes, 10000),
    cook_minutes: int(r.cook_minutes, 10000),
    ingredients: groups<Ingredient>(r.ingredients, ingredient) as IngredientGroup[],
    steps: groups<string>(r.steps, step) as StepGroup[],
    notes: text(r.notes, 5000),
    source_url: link(r.source_url),
    image_url: link(r.image_url),
    warnings: Array.isArray(r.warnings)
      ? r.warnings.map((w) => text(w, 300)).filter((w): w is string => !!w).slice(0, 30)
      : [],
  };
}

/**
 * Reads a paste: Claude's whole reply (code fence and text around it), a bare recipe,
 * a list of recipes, or an export file. Returns null if no recipe JSON is found.
 */
export function parsePaste(input: string): PastedRecipe[] | null {
  const fenced = input.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : input;
  const obj = body.indexOf("{");
  const arr = body.indexOf("[");
  const isArray = arr !== -1 && (obj === -1 || arr < obj);
  const start = isArray ? arr : obj;
  const end = body.lastIndexOf(isArray ? "]" : "}");
  if (start === -1 || end <= start) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(body.slice(start, end + 1));
  } catch {
    return null;
  }

  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { recipes?: unknown }).recipes)
      ? (raw as { recipes: unknown[] }).recipes
      : [raw];
  const recipes = list
    .slice(0, MAX_RECIPES_PER_PASTE)
    .map(normalizeRecipe)
    .filter((r): r is PastedRecipe => r !== null);
  return recipes.length > 0 ? recipes : null;
}

/** The database row for a cleaned recipe: data fields plus search_text, never id or timestamps. */
export function toRow(r: RecipeData) {
  const data: RecipeData = {
    title: r.title,
    category: r.category,
    tags: r.tags,
    from_person: r.from_person,
    servings: r.servings,
    yield: r.yield,
    prep_minutes: r.prep_minutes,
    cook_minutes: r.cook_minutes,
    ingredients: r.ingredients,
    steps: r.steps,
    notes: r.notes,
    source_url: r.source_url,
    image_url: r.image_url,
  };
  return { ...data, search_text: buildSearchText(data) };
}

/** A saved recipe in the paste schema, for "Copy JSON" and the export file. */
export function toRecipeJson(r: Recipe) {
  const { search_text: _, ...data } = toRow(r);
  return { id: r.id, ...data };
}

export function exportFile(recipes: Recipe[]) {
  return {
    format: "recipitation",
    version: 1,
    exported_at: new Date().toISOString(),
    recipes: recipes.map(toRecipeJson),
  };
}

// ---------------------------------------------------------------
// Display
// ---------------------------------------------------------------

export function formatMinutes(m: number | null): string | null {
  if (m === null || m <= 0) return null;
  if (m < 60) return `${m}′`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} ώρ. ${rest}′` : `${h} ${h === 1 ? "ώρα" : "ώρες"}`;
}

export function totalMinutes(r: Pick<RecipeData, "prep_minutes" | "cook_minutes">): number | null {
  if (r.prep_minutes === null && r.cook_minutes === null) return null;
  return (r.prep_minutes ?? 0) + (r.cook_minutes ?? 0);
}

export function formatMetric(m: Metric): string {
  const amount = m.amount.toLocaleString("el-GR");
  return `${m.estimated ? "περίπου" : "≈"} ${amount} ${METRIC_LABEL[m.unit]}`;
}
