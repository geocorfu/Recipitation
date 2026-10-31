import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Runs once a day (see vercel.json). Reading and writing the database keeps the
 * free Supabase project from pausing after a week of inactivity.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("recipes").select("id");
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // A daily read alone didn't count as activity for Supabase, so also write a row.
  const { error: beatError } = await supabase
    .from("heartbeat")
    .upsert({ id: 1, last_run: new Date().toISOString(), recipes_checked: data.length });

  return NextResponse.json({
    ok: true,
    recipes: data.length,
    heartbeat: beatError ? `failed: ${beatError.message}` : "written",
  });
}
