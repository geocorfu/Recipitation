"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readList, writeList } from "@/lib/shopping";

/** Adds this recipe to (or takes it off) the shopping list kept in this browser. */
export function ShoppingButton({ id }: { id: string }) {
  const [onList, setOnList] = useState(false);

  useEffect(() => setOnList(readList().ids.includes(id)), [id]);

  function toggle() {
    const list = readList();
    const ids = list.ids.includes(id) ? list.ids.filter((x) => x !== id) : [...list.ids, id];
    writeList({ ...list, ids });
    setOnList(ids.includes(id));
  }

  return (
    <>
      <button type="button" className={`btn ${onList ? "primary" : ""}`} aria-pressed={onList} onClick={toggle}>
        {onList ? "✓ Στη λίστα αγορών" : "🛒 Στη λίστα αγορών"}
      </button>
      {onList && (
        <Link href="/list" className="small">
          Άνοιγμα λίστας →
        </Link>
      )}
    </>
  );
}

/** Shortcut to the list from the home page, shown only when it has recipes. */
export function ListLink() {
  const [count, setCount] = useState(0);

  useEffect(() => setCount(readList().ids.length), []);

  if (count === 0) return null;
  return (
    <p style={{ marginTop: 0 }}>
      <Link href="/list" className="btn small">
        🛒 Λίστα αγορών ({count} {count === 1 ? "συνταγή" : "συνταγές"})
      </Link>
    </p>
  );
}
