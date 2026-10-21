import { METRIC_LABEL, UNIT_LABEL } from "./constants";
import { normalizeForSearch } from "./search";
import type { Ingredient, IngredientGroup, Metric, Unit } from "./types";

export interface ListRecipe {
  id: string;
  title: string;
  ingredients: IngredientGroup[];
}

export interface ListItem {
  key: string;
  name: string;
  amounts: { unit: Unit | null; quantity: number }[];
  /** Lines without a quantity ("αλάτι", "λίγο λάδι"), as written. */
  loose: string[];
  /** Grams or ml across different units, when every line converts. */
  total: Metric | null;
  recipes: string[];
}

/** Kilos and litres are added up as grams and ml. */
const BASE: Partial<Record<Unit, [Unit, number]>> = { kg: ["g", 1000], l: ["ml", 1000] };

function inMetric(i: Ingredient): Metric | null {
  if (i.quantity === null) return null;
  if (i.unit === "g" || i.unit === "kg") return { amount: i.quantity * (i.unit === "kg" ? 1000 : 1), unit: "g", estimated: false };
  if (i.unit === "ml" || i.unit === "l") return { amount: i.quantity * (i.unit === "l" ? 1000 : 1), unit: "ml", estimated: false };
  return i.metric;
}

/** One line per ingredient name across the chosen recipes, quantities added up per unit. */
export function mergeIngredients(recipes: ListRecipe[]): ListItem[] {
  const items = new Map<string, ListItem & { metrics: (Metric | null)[] }>();

  for (const r of recipes) {
    for (const i of r.ingredients.flatMap((g) => g.items)) {
      const key = normalizeForSearch(i.name);
      if (!key) continue;
      let item = items.get(key);
      if (!item) {
        item = { key, name: i.name, amounts: [], loose: [], total: null, recipes: [], metrics: [] };
        items.set(key, item);
      }
      if (!item.recipes.includes(r.title)) item.recipes.push(r.title);
      item.metrics.push(inMetric(i));

      if (i.quantity === null) {
        if (!item.loose.includes(i.text)) item.loose.push(i.text);
        continue;
      }
      const [unit, factor] = (i.unit && BASE[i.unit]) ?? [i.unit, 1];
      const same = item.amounts.find((a) => a.unit === unit);
      if (same) same.quantity += i.quantity * factor;
      else item.amounts.push({ unit, quantity: i.quantity * factor });
    }
  }

  return [...items.values()].map(({ metrics, ...item }) => {
    const unit = metrics[0]?.unit;
    const converts = item.amounts.length > 1 && metrics.every((m) => m !== null && m.unit === unit);
    return {
      ...item,
      total: converts
        ? {
            amount: Math.round(metrics.reduce((sum, m) => sum + m!.amount, 0)),
            unit: unit!,
            estimated: metrics.some((m) => m!.estimated),
          }
        : null,
    };
  });
}

const FRACTIONS: [number, string][] = [[1 / 4, "¼"], [1 / 3, "⅓"], [1 / 2, "½"], [2 / 3, "⅔"], [3 / 4, "¾"]];

/** 1.5 → "1½", 0.25 → "¼", 2.4 → "2,4". */
export function formatQuantity(q: number): string {
  const whole = Math.floor(q);
  const rest = q - whole;
  if (rest < 0.02) return String(whole);
  if (rest > 0.98) return String(whole + 1);
  const f = FRACTIONS.find(([v]) => Math.abs(rest - v) < 0.02);
  if (f) return whole ? `${whole}${f[1]}` : f[1];
  return q.toLocaleString("el-GR", { maximumFractionDigits: 2 });
}

export function formatAmount({ unit, quantity }: { unit: Unit | null; quantity: number }): string {
  if ((unit === "g" || unit === "ml") && quantity >= 1000) {
    return `${formatQuantity(quantity / 1000)} ${UNIT_LABEL[unit === "g" ? "kg" : "l"]}`;
  }
  return unit ? `${formatQuantity(quantity)} ${UNIT_LABEL[unit]}` : formatQuantity(quantity);
}

/** "1½ φλ. + 2 κ.σ. · σύνολο ≈ 225 γρ. · λίγο για το τηγάνι" */
export function describeItem(item: ListItem): string {
  const parts = [item.amounts.map(formatAmount).join(" + ")];
  if (item.total) {
    const amount = item.total.amount.toLocaleString("el-GR");
    parts.push(`σύνολο ${item.total.estimated ? "περίπου" : "≈"} ${amount} ${METRIC_LABEL[item.total.unit]}`);
  }
  // A bare "αλάτι" repeats the name; "λίγο λάδι για το τηγάνι" adds something.
  parts.push(...item.loose.filter((t) => normalizeForSearch(t) !== item.key));
  return parts.filter(Boolean).join(" · ");
}

/** The list lives in this browser only: which recipes, and which items are ticked off. */
const STORAGE_KEY = "recipitation:list:v1";

export interface StoredList {
  ids: string[];
  ticked: string[];
}

export function readList(): StoredList {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return {
      ids: Array.isArray(raw.ids) ? raw.ids.filter((x: unknown) => typeof x === "string") : [],
      ticked: Array.isArray(raw.ticked) ? raw.ticked.filter((x: unknown) => typeof x === "string") : [],
    };
  } catch {
    return { ids: [], ticked: [] };
  }
}

export function writeList(list: StoredList) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Private mode or storage off: the list just won't survive a reload.
  }
}
