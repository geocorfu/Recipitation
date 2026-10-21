import { formatMetric, formatMinutes } from "@/lib/recipe";
import type { RecipeData } from "@/lib/types";
import { RecipeImage } from "./RecipeImage";

/** The recipe itself. Used on the recipe page and as the preview before saving. */
export function RecipeView({ recipe: r }: { recipe: RecipeData }) {
  const facts = [
    r.servings !== null ? ["Μερίδες", String(r.servings)] : null,
    r.yield ? ["Βγάζει", r.yield] : null,
    formatMinutes(r.prep_minutes) ? ["Προετοιμασία", formatMinutes(r.prep_minutes)] : null,
    formatMinutes(r.cook_minutes) ? ["Μαγείρεμα", formatMinutes(r.cook_minutes)] : null,
  ].filter((f): f is [string, string] => f !== null);

  let host: string | null = null;
  if (r.source_url) {
    try {
      host = new URL(r.source_url).hostname.replace(/^www\./, "");
    } catch {
      host = r.source_url;
    }
  }

  return (
    <>
      {r.image_url && <RecipeImage src={r.image_url} className="hero" />}

      <h1>{r.title}</h1>
      <div className="muted">{[r.from_person, r.category].filter(Boolean).join(" · ")}</div>
      {facts.length > 0 && (
        <div className="facts">
          {facts.map(([label, value]) => (
            <span key={label}>
              {label}: <strong>{value}</strong>
            </span>
          ))}
        </div>
      )}
      {r.tags.length > 0 && (
        <div className="row" style={{ gap: 6, marginBottom: 12 }}>
          {r.tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="recipe-body">
        <div className="card">
          <h2>Υλικά</h2>
          {r.ingredients.length === 0 && <p className="muted small">Δεν υπάρχουν υλικά.</p>}
          {r.ingredients.map((g, gi) => (
            <div key={gi}>
              {g.group && <h3>{g.group}</h3>}
              <ul className="ingredients">
                {g.items.map((i, ii) => (
                  <li key={ii}>
                    {i.text}
                    {i.metric && <span className="metric">{formatMetric(i.metric)}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="card">
          <h2>Εκτέλεση</h2>
          {r.steps.length === 0 && <p className="muted small">Δεν υπάρχουν βήματα.</p>}
          {r.steps.map((g, gi) => (
            <div key={gi}>
              {g.group && <h3>{g.group}</h3>}
              <ol className="steps">
                {g.items.map((s, si) => (
                  <li key={si}>{s}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        {r.notes && (
          <div className="card">
            <h2>Σημειώσεις</h2>
            <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{r.notes}</p>
          </div>
        )}
      </div>

      {r.source_url && (
        <p className="small muted">
          Πηγή:{" "}
          <a href={r.source_url} target="_blank" rel="noopener noreferrer">
            {host}
          </a>
        </p>
      )}
    </>
  );
}
