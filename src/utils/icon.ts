/**
 * Lucide icon lookup, tolerant of various backend formats.
 *
 *   "menu"        → Menu
 *   "file-text"   → FileText
 *   "building"    → Building2
 *   "shield"      → Shield
 *   "key"         → Key
 *   "LayoutDashboard" → LayoutDashboard (already Pascal)
 *
 * Returns null when no icon is given or the name doesn't resolve.
 *
 * Implementation note: we pre-build a normalized lookup map at module load
 * (icons are static) so React Compiler / lint rules don't complain about
 * "creating components during render".
 */
import * as LucideIcons from "lucide-react";
import * as React from "react";

type LucideComponent = React.ComponentType<{ className?: string }>;

const rawIcons = LucideIcons as unknown as Record<string, LucideComponent | undefined>;

const toPascal = (s: string): string =>
  s
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join("");

// Pre-build a normalized lookup: for every available icon, add aliases.
const aliasIndex: Record<string, LucideComponent> = (() => {
  const idx: Record<string, LucideComponent> = {};
  for (const key of Object.keys(rawIcons)) {
    if (typeof rawIcons[key] !== "function") continue;
    const Cmp = rawIcons[key]!;
    // Exact name
    idx[key] = Cmp;
    // lowercase variant
    const lower = key.toLowerCase();
    if (!idx[lower]) idx[lower] = Cmp;
    // kebab-case variant
    const kebab = key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
    if (!idx[kebab]) idx[kebab] = Cmp;
  }
  return idx;
})();

/** Public API — look up an icon by name, returning null if not found. */
export const resolveLucideIcon = (name: string | null | undefined): LucideComponent | null => {
  if (!name) return null;
  const trimmed = name.trim();
  if (!trimmed) return null;

  // 1) exact match in the raw icons (e.g. "Menu", "Building2")
  if (rawIcons[trimmed]) return rawIcons[trimmed] ?? null;
  // 2) match against the alias index (lowercase, kebab-case)
  if (aliasIndex[trimmed]) return aliasIndex[trimmed] ?? null;
  // 3) PascalCase of the raw name, with optional 2 / Icon suffix
  const pascal = toPascal(trimmed);
  if (rawIcons[pascal]) return rawIcons[pascal] ?? null;
  for (const suffix of ["", "2", "Icon"]) {
    const candidate = `${pascal}${suffix}`;
    if (rawIcons[candidate]) return rawIcons[candidate] ?? null;
    if (aliasIndex[candidate.toLowerCase()]) return aliasIndex[candidate.toLowerCase()] ?? null;
  }
  return null;
};
