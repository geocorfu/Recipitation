import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { getEditor } from "@/lib/session";
import { toRecipeJson, validId } from "@/lib/recipe";
import type { Recipe } from "@/lib/types";
import { RecipeView } from "@/components/RecipeView";
import { CookingMode } from "@/components/CookingMode";
import { ShoppingButton } from "@/components/ShoppingButton";
import { CopyJsonButton, DeleteRecipeButton } from "@/components/RecipeActions";

export const dynamic = "force-dynamic";

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const id = validId((await params).id);
  if (!id) notFound();

  const editor = await getEditor();
  const { data } = await createServiceClient().from("recipes").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const recipe = data as Recipe;

  return (
    <>
      <p className="small">
        <Link href="/" className="muted">
          ← Όλες οι συνταγές
        </Link>
      </p>

      <CookingMode />
      <div className="row" style={{ marginBottom: 12 }}>
        <ShoppingButton id={recipe.id} />
      </div>
      <RecipeView recipe={recipe} />

      {editor && (
        <div className="card">
          <h2>Διόρθωση</h2>
          <p className="small muted">
            Αντέγραψε το JSON, δώσ&apos; το στο Claude project με τη διόρθωση και επικόλλησε την
            απάντηση στη «Νέα». Θα αντικαταστήσει αυτή τη συνταγή.
          </p>
          <div className="row spread">
            <CopyJsonButton json={JSON.stringify(toRecipeJson(recipe), null, 2)} />
            <DeleteRecipeButton id={recipe.id} />
          </div>
        </div>
      )}
    </>
  );
}
