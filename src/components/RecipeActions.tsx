"use client";

import { useState } from "react";
import { deleteRecipe } from "@/app/actions";

/** Copies the recipe as JSON, to correct it in the Claude project and paste it back over itself. */
export function CopyJsonButton({ json }: { json: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(json);
      setState("copied");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2500);
  }

  return (
    <button type="button" className="btn" onClick={copy}>
      {state === "copied" ? "Αντιγράφηκε" : state === "failed" ? "Δεν αντιγράφηκε" : "Αντιγραφή JSON"}
    </button>
  );
}

export function DeleteRecipeButton({ id }: { id: string }) {
  return (
    <form
      action={deleteRecipe.bind(null, id)}
      onSubmit={(e) => {
        if (!confirm("Να διαγραφεί αυτή η συνταγή; Δεν αναιρείται.")) e.preventDefault();
      }}
    >
      <button className="btn danger" type="submit">
        Διαγραφή
      </button>
    </form>
  );
}
