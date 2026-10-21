"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/constants";
import { formatMinutes, totalMinutes } from "@/lib/recipe";
import { matchesQuery } from "@/lib/search";
import type { RecipeSummary } from "@/lib/types";
import { RecipeImage } from "./RecipeImage";

export function RecipeList({ recipes }: { recipes: RecipeSummary[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  // Only categories that have recipes, in the fixed order.
  const categories = useMemo(
    () => CATEGORIES.filter((c) => recipes.some((r) => r.category === c)),
    [recipes],
  );

  const visible = useMemo(
    () =>
      recipes.filter(
        (r) => (!category || r.category === category) && matchesQuery(r.search_text, query),
      ),
    [recipes, query, category],
  );

  if (recipes.length === 0) {
    return (
      <div className="card" style={{ textAlign: "center" }}>
        <h2>Καμία συνταγή ακόμα</h2>
        <p className="muted">Πρόσθεσε την πρώτη επικολλώντας την απάντηση του Claude.</p>
        <Link href="/recipes/new" className="btn primary">
          + Νέα συνταγή
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="filters" style={{ gridTemplateColumns: "1fr", marginTop: 12 }}>
        <input
          type="search"
          placeholder="Αναζήτηση: συνταγή, υλικό, ποιος τη δίνει…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Αναζήτηση"
          enterKeyHint="search"
        />
      </div>

      {categories.length > 1 && (
        <div className="chips" role="group" aria-label="Κατηγορία">
          <button type="button" className={`chip ${category === "" ? "on" : ""}`} onClick={() => setCategory("")}>
            Όλες
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip ${category === c ? "on" : ""}`}
              onClick={() => setCategory(category === c ? "" : c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="muted">Δεν βρέθηκε συνταγή.</p>
      ) : (
        visible.map((r) => (
          <Link key={r.id} href={`/recipes/${r.id}`} className="item recipe-card">
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="title">{r.title}</div>
              <div className="meta">
                {[r.from_person, r.category, formatMinutes(totalMinutes(r))].filter(Boolean).join(" · ")}
              </div>
            </div>
            {r.image_url && <RecipeImage src={r.image_url} className="thumb" />}
          </Link>
        ))
      )}
    </>
  );
}
