"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false, // only people added in Supabase can sign in
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setBusy(false);
    if (error) {
      setError(
        error.message.toLowerCase().includes("signups not allowed")
          ? "Αυτό το email δεν έχει πρόσβαση."
          : error.message,
      );
      return;
    }
    setStep("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 420, margin: "10vh auto 0" }}>
      <h1>🍲 Recipitation</h1>
      <p className="muted">Ιδιωτικό. Σύνδεση με το email σου.</p>

      <div className="card">
        {error && <div className="error">{error}</div>}

        {step === "email" ? (
          <form onSubmit={sendLink}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <button className="btn primary" style={{ width: "100%" }} disabled={busy}>
              {busy ? "Αποστολή…" : "Στείλε μου σύνδεσμο σύνδεσης"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode}>
            <div className="ok">Δες τα εισερχόμενα του {email}.</div>
            <p className="small muted">
              Πάτησε τον σύνδεσμο στο email ή γράψε εδώ τον 6ψήφιο κωδικό.
            </p>
            <div className="field">
              <label htmlFor="code">Κωδικός</label>
              <input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
              />
            </div>
            <div className="row">
              <button className="btn primary grow" disabled={busy || code.trim().length < 6}>
                {busy ? "Έλεγχος…" : "Σύνδεση"}
              </button>
              <button
                className="btn"
                type="button"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError(null);
                }}
              >
                Πίσω
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
