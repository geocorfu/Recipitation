import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recipitation",
  description: "Οι συνταγές της οικογένειας.",
  robots: { index: false, follow: false },
  // Lets a deploy be checked from the live page: Vercel sets this at runtime.
  other: { "x-commit": process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="el">
      <body>
        {user && (
          <header className="topbar">
            <div className="wrap">
              <Link href="/" className="brand">
                🍲 Recipitation
              </Link>
              <nav className="nav">
                <Link href="/recipes/new" className="btn primary small">
                  + Νέα
                </Link>
                <form action={signOut}>
                  <button className="btn small" type="submit">
                    Έξοδος
                  </button>
                </form>
              </nav>
            </div>
          </header>
        )}
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
