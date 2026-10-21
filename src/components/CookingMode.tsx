"use client";

import { useEffect, useRef, useState } from "react";

/** Keeps the screen on (Screen Wake Lock API) and switches to larger text while cooking. */
export function CookingMode() {
  const [on, setOn] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const lock = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!on) return;
    document.documentElement.classList.add("cooking");

    async function acquire() {
      if (!("wakeLock" in navigator)) {
        setNote("Αυτός ο browser δεν μπορεί να κρατήσει την οθόνη αναμμένη.");
        return;
      }
      try {
        lock.current = await navigator.wakeLock.request("screen");
        setNote(null);
      } catch {
        setNote("Η οθόνη μπορεί να σβήσει (π.χ. σε εξοικονόμηση μπαταρίας).");
      }
    }

    // The browser drops the lock when the tab is hidden, so take it again on return.
    function onVisible() {
      if (document.visibilityState === "visible") acquire();
    }

    acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      document.documentElement.classList.remove("cooking");
      lock.current?.release().catch(() => {});
      lock.current = null;
    };
  }, [on]);

  return (
    <div style={{ marginBottom: 12 }}>
      <button
        type="button"
        className={`btn ${on ? "primary" : ""}`}
        aria-pressed={on}
        onClick={() => setOn(!on)}
      >
        {on ? "✓ Μαγείρεμα: η οθόνη μένει ανοιχτή" : "👩‍🍳 Μαγείρεμα"}
      </button>
      {on && note && <p className="small muted" style={{ marginTop: 6 }}>{note}</p>}
    </div>
  );
}
