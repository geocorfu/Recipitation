import { createServiceClient } from "@/lib/supabase/server";
import { getEditor } from "@/lib/session";
import { RecipeList } from "@/components/RecipeList";
import { ListLink } from "@/components/ShoppingButton";
import type { RecipeSummary } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Visitors read too, so reads go through the server-only service client; anon has no table access.
  const editor = await getEditor();
  const { data, error } = await createServiceClient()
    .from("recipes")
    .select("id, title, category, from_person, prep_minutes, cook_minutes, image_url, search_text")
    .order("title");

  if (error) {
    return (
      <div className="error">
        Δεν φόρτωσαν οι συνταγές: {error.message}. Έτρεξε το supabase/schema.sql;
      </div>
    );
  }

  const recipes = (data ?? []) as RecipeSummary[];
  return (
    <>
      <h1>Οι συνταγές μας</h1>
      <ListLink />
      <RecipeList recipes={recipes} />
      {editor && recipes.length > 0 && (
        <p className="small" style={{ marginTop: 24 }}>
          {/* A plain link, not next/link: this is a file download, not a page. */}
          <a href="/api/export" className="btn small" download>
            Λήψη αντιγράφου (JSON)
          </a>
        </p>
      )}
    </>
  );
}
