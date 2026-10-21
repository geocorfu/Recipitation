"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { findExisting, saveRecipes } from "@/app/actions";
import { parsePaste } from "@/lib/recipe";
import type { PastedRecipe } from "@/lib/types";
import { RecipeView } from "./RecipeView";

type Phase = "paste" | "checking" | "preview" | "saving";

/** @param instructions the Claude project instructions, shown once for setup. */
export function PasteFlow({ instructions }: { instructions: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("paste");
  const [pasted, setPasted] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [recipes, setRecipes] = useState<PastedRecipe[]>([]);
  /** id -> title of the saved recipe a pasted one will replace. */
  const [existing, setExisting] = useState<Record<string, string>>({});

  async function preview(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = parsePaste(pasted);
    if (!parsed) {
      setError("Δεν μοιάζει με συνταγή από το Claude. Αντέγραψε όλη την απάντηση, μαζί με το code block.");
      return;
    }
    setPhase("checking");
    try {
      const ids = parsed.map((r) => r.id).filter((id): id is string => !!id);
      setExisting(ids.length > 0 ? await findExisting(ids) : {});
      setRecipes(parsed);
      setPhase("preview");
    } catch {
      setError("Δεν υπάρχει σύνδεση με τον server. Δοκίμασε ξανά.");
      setPhase("paste");
    }
  }

  async function save() {
    const replacing = recipes.filter((r) => r.id && existing[r.id]);
    if (
      replacing.length > 0 &&
      !confirm(
        replacing.length === 1
          ? `Αυτό θα αντικαταστήσει: ${existing[replacing[0].id!]}. Συνέχεια;`
          : `Θα αντικατασταθούν ${replacing.length} συνταγές. Συνέχεια;`,
      )
    ) {
      return;
    }

    setError(null);
    setPhase("saving");
    try {
      const { ids, error: saveError } = await saveRecipes(recipes);
      if (!ids || saveError) {
        setError(saveError ?? "Δεν αποθηκεύτηκε.");
        setPhase("preview");
        return;
      }
      router.push(ids.length === 1 ? `/recipes/${ids[0]}` : "/");
      router.refresh();
    } catch {
      setError("Δεν υπάρχει σύνδεση με τον server. Δοκίμασε ξανά.");
      setPhase("preview");
    }
  }

  async function copyInstructions() {
    try {
      await navigator.clipboard.writeText(instructions);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Δεν αντιγράφηκε αυτόματα. Επίλεξε το κείμενο παρακάτω και αντέγραψέ το.");
    }
  }

  // ---------------------------------------------------------------
  if (phase === "paste" || phase === "checking") {
    return (
      <>
        {error && <div className="error">{error}</div>}
        <form className="card" onSubmit={preview}>
          <h2>Επικόλληση από το Claude</h2>
          <p className="small muted">
            Στείλε τη φωτογραφία, το κείμενο ή τον σύνδεσμο της συνταγής στο Claude project «Συνταγές»,
            αντέγραψε όλη την απάντηση και επικόλλησέ τη εδώ. Εδώ μπαίνει και ένα αρχείο αντιγράφου
            ασφαλείας για επαναφορά.
          </p>
          <div className="field">
            <label htmlFor="pasted">Η απάντηση του Claude</label>
            <textarea
              id="pasted"
              rows={8}
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              placeholder={'```json\n{ "title": "…", "ingredients": [ … ] }\n```'}
              spellCheck={false}
            />
          </div>
          <button className="btn primary" type="submit" disabled={!pasted.trim() || phase === "checking"}>
            {phase === "checking" ? (
              <>
                <span className="spinner" /> Έλεγχος…
              </>
            ) : (
              "Προεπισκόπηση"
            )}
          </button>

          <details style={{ marginTop: 16 }}>
            <summary className="small" style={{ cursor: "pointer", fontWeight: 600 }}>
              Ρύθμιση Claude (μία φορά)
            </summary>
            <ol className="small" style={{ paddingLeft: 20, margin: "10px 0" }}>
              <li>Στο Claude Desktop ή στο claude.ai, φτιάξε ένα project με όνομα «Συνταγές».</li>
              <li>Αντέγραψε τις οδηγίες παρακάτω στις οδηγίες του project και αποθήκευσε.</li>
              <li>Για κάθε συνταγή, άνοιξε συνομιλία σε αυτό το project και στείλε φωτογραφία, κείμενο ή σύνδεσμο.</li>
            </ol>
            <button type="button" className="btn small" onClick={copyInstructions}>
              {copied ? "Αντιγράφηκε" : "Αντιγραφή οδηγιών"}
            </button>
            <pre
              className="small muted"
              style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", marginTop: 10, maxHeight: 240, overflow: "auto" }}
            >
              {instructions}
            </pre>
          </details>
        </form>
      </>
    );
  }

  // ---------------------------------------------------------------
  const saving = phase === "saving";
  const replaceCount = recipes.filter((r) => r.id && existing[r.id]).length;
  const newCount = recipes.length - replaceCount;
  const single = recipes.length === 1;

  return (
    <>
      {error && <div className="error">{error}</div>}

      <div className={replaceCount > 0 ? "notice" : "ok"}>
        {single
          ? replaceCount > 0
            ? `Θα αντικαταστήσει: ${existing[recipes[0].id!]}`
            : "Νέα συνταγή"
          : `${newCount} νέες, ${replaceCount} αντικαταστάσεις`}
      </div>

      {recipes.map((r, idx) => {
        const label = r.id && existing[r.id] ? "Αντικατάσταση" : "Νέα";
        const body = (
          <>
            {r.warnings.length > 0 && (
              <div className="notice">
                <strong>Έλεγξε πριν αποθηκεύσεις:</strong>
                <ul className="warnings">
                  {r.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
            <RecipeView recipe={r} />
          </>
        );
        return single ? (
          <div key={idx}>{body}</div>
        ) : (
          <details key={idx} className="card">
            <summary style={{ cursor: "pointer", fontWeight: 700 }}>
              {r.title} <span className="tag">{label}</span>
              {r.warnings.length > 0 && <span className="tag"> ⚠ {r.warnings.length}</span>}
            </summary>
            <div style={{ marginTop: 12 }}>{body}</div>
          </details>
        );
      })}

      <p className="small muted">
        Κάτι λάθος; Ζήτα τη διόρθωση στη συνομιλία με το Claude και επικόλλησε ξανά.
      </p>
      <div className="row">
        <button type="button" className="btn" onClick={() => setPhase("paste")} disabled={saving}>
          Πίσω
        </button>
        <button type="button" className="btn primary grow" onClick={save} disabled={saving}>
          {saving ? "Αποθήκευση…" : single ? "Αποθήκευση" : `Αποθήκευση ${recipes.length} συνταγών`}
        </button>
      </div>
    </>
  );
}
