"use client";

import { useEffect, useState } from "react";

/** Returns true only after hydration */
export function useIsClient(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
