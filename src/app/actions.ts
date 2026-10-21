"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getEditor } from "@/lib/session";
import { MAX_RECIPES_PER_PASTE, normalizeRecipe, toRow, validId } from "@/lib/recipe";
import type { PastedRecipe } from "@/lib/types";
import type { ListRecipe } from "@/lib/shopping";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/** Titles of the recipes these ids already belong to, so the preview can say what gets replaced. */
export async function findExisting(ids: string[]): Promise<Record<string, string>> {
  if (!(await getEditor())) return {};
  const valid = (Array.isArray(ids) ? ids : []).map(validId).filter((id): id is string => !!id);
  if (valid.length === 0) return {};
  const supabase = await createClient();
  const { data } = await supabase.from("recipes").select("id, title").in("id", valid);
  return Object.fromEntries((data ?? []).map((r) => [r.id as string, r.title as string]));
}

/**
 * Saves pasted recipes. A recipe whose id exists replaces it; one with an unknown id is
 * created with that id (restoring an export); one without an id is created new.
 * Server actions are public endpoints, so everything is cleaned again here.
 */
export async function saveRecipes(input: unknown[]): Promise<{ ids?: string[]; error?: string }> {
  if (!(await getEditor())) return { error: "Χρειάζεται σύνδεση." };
  if (!Array.isArray(input) || input.length === 0) return { error: "Δεν υπάρχει τίποτα για αποθήκευση." };
  if (input.length > MAX_RECIPES_PER_PASTE) return { error: "Πάρα πολλές συνταγές με τη μία." };

  const recipes = input.map(normalizeRecipe);
  if (recipes.some((r) => r === null)) return { error: "Κάθε συνταγή χρειάζεται τίτλο." };
  const clean = recipes as PastedRecipe[];

  const withId = clean.filter((r) => r.id).map((r) => ({ id: r.id!, ...toRow(r) }));
  const withoutId = clean.filter((r) => !r.id).map((r) => toRow(r));

  const supabase = await createClient();
  const ids: string[] = [];

  if (withId.length > 0) {
    const { data, error } = await supabase.from("recipes").upsert(withId, { onConflict: "id" }).select("id");
    if (error) return { error: `Δεν αποθηκεύτηκε: ${error.message}` };
    ids.push(...(data ?? []).map((r) => r.id as string));
  }
  if (withoutId.length > 0) {
    const { data, error } = await supabase.from("recipes").insert(withoutId).select("id");
    if (error) {
      revalidatePath("/");
      return { ids, error: `Αποθηκεύτηκαν μόνο οι συνταγές με id: ${error.message}` };
    }
    ids.push(...(data ?? []).map((r) => r.id as string));
  }

  revalidatePath("/");
  for (const id of ids) revalidatePath(`/recipes/${id}`);
  return { ids };
}

export async function deleteRecipe(id: string) {
  const valid = validId(id);
  if (!valid) throw new Error("Invalid recipe");
  if (!(await getEditor())) throw new Error("Not signed in");
  const supabase = await createClient();
  const { error } = await supabase.from("recipes").delete().eq("id", valid);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  redirect("/");
}

/** Ingredients of the recipes on a shopping list. Reading is open to visitors, like the pages. */
export async function getListRecipes(ids: string[]): Promise<ListRecipe[]> {
  const valid = (Array.isArray(ids) ? ids : []).slice(0, 50).map(validId).filter((id): id is string => !!id);
  if (valid.length === 0) return [];
  const { data } = await createServiceClient().from("recipes").select("id, title, ingredients").in("id", valid);
  // Keep the order the recipes were added in.
  return valid.flatMap((id) => (data ?? []).filter((r) => r.id === id)) as ListRecipe[];
}
