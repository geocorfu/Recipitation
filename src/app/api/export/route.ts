import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/auth";
import { exportFile } from "@/lib/recipe";
import type { Recipe } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Downloads every recipe as one JSON file in the paste schema (ids included),
 * so pasting it on the Add page restores everything without duplicates.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAllowedEmail(user.email)) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { data, error } = await supabase.from("recipes").select("*").order("title");
  if (error) {
    return NextResponse.json({ error: "Couldn't load the recipes" }, { status: 500 });
  }

  const today = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(exportFile((data ?? []) as Recipe[]), null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="recipitation-${today}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
