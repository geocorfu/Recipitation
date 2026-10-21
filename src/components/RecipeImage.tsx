"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A photo hosted on the recipe's original site. Many sites block hotlinking or move
 * images, so on any error it disappears and the layout works without it.
 * Plain <img>, not next/image: optimising remote images would use up Vercel's free quota.
 */
export function RecipeImage({ src, className }: { src: string; className: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);

  // The image may have failed before React attached onError (server-rendered page).
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) return null;
  return (
    <img
      ref={ref}
      src={src}
      alt=""
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
