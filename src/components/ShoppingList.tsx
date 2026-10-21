"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getListRecipes } from "@/app/actions";
import { describeItem, mergeIngredients, readList, writeList, type ListRecipe, type StoredList } from "@/lib/shopping";

export function ShoppingList() {
  const [list, setList] = useState<StoredList | null>(null);
  const [recipes, setRecipes] = useState<ListRecipe[] | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const stored = readList();
    setList(stored);
    getListRecipes(stored.ids)
      .then(setRecipes)
      .catch(() => setRecipes([]));
  }, []);

  const items = useMemo(() => mergeIngredients(recipes ?? []), [recipes]);

  if (!list || recipes === null) return <p className="muted">Φόρτωση…</p>;

  if (recipes.length === 0) {
    return (
      <div className="card">
        <p style={{ marginTop: 0 }}>Η λίστα είναι άδεια.</p>
        <p className="small muted" style={{ marginBottom: 0 }}>
          Άνοιξε μια συνταγή και πάτα «🛒 Στη λίστα αγορών». Τα υλικά από πολλές συνταγές μπαίνουν μαζί σε μία
          λίστα.
        </p>
      </div>
    );
  }

  const current = list;
  const ticked = new Set(current.ticked);
  const ordered = [...items.filter((i) => !ticked.has(i.key)), ...items.filter((i) => ticked.has(i.key))];
  const left = items.filter((i) => !ticked.has(i.key)).length;

  function save(next: StoredList) {
    writeList(next);
    setList(next);
  }

  function toggle(key: string) {
    const next = ticked.has(key) ? current.ticked.filter((k) => k !== key) : [...current.ticked, key];
    save({ ...current, ticked: next });
  }

  function remove(id: string) {
    save({ ...current, ids: current.ids.filter((x) => x !== id) });
    setRecipes((rs) => (rs ?? []).filter((r) => r.id !== id));
  }

  function clear() {
    if (!confirm("Να αδειάσει η λίστα;")) return;
    save({ ids: [], ticked: [] });
    setRecipes([]);
  }

  async function copy() {
    const lines = ordered
      .filter((i) => !ticked.has(i.key))
      .map((i) => {
        const detail = describeItem(i);
        return `- ${i.name}${detail ? `: ${detail}` : ""}`;
      });
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked: the list is still on screen.
    }
  }

  return (
    <>
      <div className="chips">
        {recipes.map((r) => (
          <span key={r.id} className="chip on list-recipe">
            <Link href={`/recipes/${r.id}`}>{r.title}</Link>
            <button type="button" aria-label={`Αφαίρεση: ${r.title}`} onClick={() => remove(r.id)}>
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="card">
        <p className="small muted" style={{ marginTop: 0 }}>
          {left === 0 ? "Τα πήρες όλα." : `Μένουν ${left} από ${items.length}.`}
        </p>
        <ul className="ingredients shopping">
          {ordered.map((i) => {
            const detail = describeItem(i);
            return (
              <li key={i.key} className={ticked.has(i.key) ? "done" : ""}>
                <label>
                  <input type="checkbox" checked={ticked.has(i.key)} onChange={() => toggle(i.key)} />
                  <span>
                    <strong>{i.name}</strong>
                    {detail && <span className="muted"> · {detail}</span>}
                    {recipes.length > 1 && <span className="small muted list-from">{i.recipes.join(", ")}</span>}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="row">
        <button type="button" className="btn" onClick={copy}>
          {copied ? "Αντιγράφηκε" : "Αντιγραφή λίστας"}
        </button>
        {current.ticked.length > 0 && (
          <button type="button" className="btn" onClick={() => save({ ...current, ticked: [] })}>
            Ξετσεκάρισμα όλων
          </button>
        )}
        <button type="button" className="btn danger" onClick={clear}>
          Άδειασμα λίστας
        </button>
      </div>
    </>
  );
}
