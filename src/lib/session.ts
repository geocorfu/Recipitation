import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isAllowedEmail } from "@/lib/auth";

/** The signed-in family editor, or null for a visitor (who may only read). */
export async function getEditor(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user && isAllowedEmail(user.email) ? user : null;
}
