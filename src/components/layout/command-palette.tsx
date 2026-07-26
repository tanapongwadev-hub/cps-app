/**
 * CommandPalette — Cmd/Ctrl+K quick switcher
 *
 * Searches across the user's:
 *   1. Pinned menus
 *   2. Recently visited paths
 *   3. All available menus (from accessControl)
 *
 * Keyboard:
 *   - Cmd/Ctrl+K — open (handled by Sidebar's ⌘K chip too)
 *   - ↑ / ↓     — navigate
 *   - Enter     — go to selected
 *   - Esc       — close
 *
 * Mount this once near the top of the admin layout.
 */
"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft, X, Star, Clock, Compass } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useIsMobile } from "@/hooks/use-media-query";
import { resolveMenuPath } from "@/config/menu-overrides";
import { resolveLucideIcon } from "@/utils/icon";
import { cn } from "@/utils/cn";
import { showToast } from "@/lib/toast";
import type { MenuItem } from "@/types/menu";

/* ---------------------------------------------------------------- types */

type CommandKind = "pinned" | "recent" | "menu";

interface CommandEntry {
  kind: CommandKind;
  id: string;
  label: string;
  path: string | null;
  iconName: string | null;
  hint?: string;
}

/* ---------------------------------------------------------------- helpers */

function pickName(item: { name?: string; nameEn?: string; nameTh?: string; code?: string }): string {
  return item.name ?? item.nameEn ?? item.nameTh ?? item.code ?? "";
}

function flattenMenus(items: MenuItem[], acc: MenuItem[] = []): MenuItem[] {
  for (const it of items) {
    acc.push(it);
    if (it.children?.length) flattenMenus(it.children, acc);
  }
  return acc;
}

/** Tiny fuzzy match: returns true if every char of `needle` appears in `haystack` in order. */
function fuzzyMatch(haystack: string, needle: string): boolean {
  if (!needle) return true;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  let i = 0;
  for (const ch of h) {
    if (ch === n[i]) i++;
    if (i === n.length) return true;
  }
  return i === n.length;
}

/* ---------------------------------------------------------------- component */

export function CommandPalette() {
  const router = useRouter();
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const isMobile = useIsMobile();

  const menu = useAuthStore((s) => s.menu);
  const pinnedIds = useSidebarStore((s) => s.pinnedMenuIds);
  const recentPaths = useSidebarStore((s) => s.recentPaths);
  const recordVisit = useSidebarStore((s) => s.recordVisit);

  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Build the flat menu index once per accessControl change
  const flatMenu = React.useMemo(() => flattenMenus(menu), [menu]);

  // Build the entries that match the query
  const entries = React.useMemo<CommandEntry[]>(() => {
    const byId = new Map(flatMenu.map((m) => [m.id, m] as const));
    const byPath = new Map<string, MenuItem>();
    for (const m of flatMenu) {
      const p = resolveMenuPath(m.code, m.path);
      if (p) byPath.set(p, m);
    }

    // Pinned
    const pinned: CommandEntry[] = pinnedIds
      .map((id) => byId.get(id))
      .filter((m): m is MenuItem => !!m)
      .map((m) => ({
        kind: "pinned",
        id: `pinned-${m.id}`,
        label: pickName(m),
        path: resolveMenuPath(m.code, m.path),
        iconName: m.icon ?? null,
      }));

    // Recent (resolve to menu entry if known, else show path only)
    const recent: CommandEntry[] = recentPaths
      .map((p) => {
        const m = byPath.get(p);
        if (m) {
          return {
            kind: "recent" as const,
            id: `recent-${p}`,
            label: pickName(m),
            path: p,
            iconName: m.icon ?? null,
            hint: p,
          };
        }
        return {
          kind: "recent" as const,
          id: `recent-${p}`,
          label: p,
          path: p,
          iconName: null,
          hint: "บันทึกล่าสุด",
        };
      });

    // All menus (deduped from pinned/recent)
    const used = new Set<string>([
      ...pinned.map((e) => e.path).filter((p): p is string => !!p),
      ...recent.map((e) => e.path).filter((p): p is string => !!p),
    ]);
    const all: CommandEntry[] = flatMenu
      .filter((m) => {
        const p = resolveMenuPath(m.code, m.path);
        return p && !used.has(p);
      })
      .map((m) => ({
        kind: "menu" as const,
        id: `menu-${m.id}`,
        label: pickName(m),
        path: resolveMenuPath(m.code, m.path),
        iconName: m.icon ?? null,
      }));

    const all_entries = [...pinned, ...recent, ...all];
    if (!query.trim()) return all_entries;
    return all_entries.filter((e) => fuzzyMatch(e.label, query));
  }, [flatMenu, pinnedIds, recentPaths, query]);

  // Keep activeIndex in range
  React.useEffect(() => {
    if (activeIndex >= entries.length) setActiveIndex(0);
  }, [entries, activeIndex]);

  // Reset state when opening, focus input
  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      // wait one frame so the input is in the DOM
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Global ⌘K / Ctrl+K shortcut (also works when palette is closed)
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  // Arrow keys + Enter inside the dialog
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (entries.length === 0 ? 0 : (i + 1) % entries.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) =>
        entries.length === 0 ? 0 : (i - 1 + entries.length) % entries.length,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const entry = entries[activeIndex];
      if (entry) navigateTo(entry);
    }
  };

  // Scroll active item into view
  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector<HTMLElement>(`[data-cmd-index="${activeIndex}"]`);
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const navigateTo = (entry: CommandEntry) => {
    if (!entry.path) {
      showToast.info(entry.label, "เมนูนี้ยังไม่มี path");
      return;
    }
    recordVisit(entry.path);
    setOpen(false);
    router.push(entry.path);
  };

  // Group entries by kind for rendering
  const groups = React.useMemo(() => {
    const pinnedGroup = entries.filter((e) => e.kind === "pinned");
    const recentGroup = entries.filter((e) => e.kind === "recent");
    const menuGroup = entries.filter((e) => e.kind === "menu");
    return { pinnedGroup, recentGroup, menuGroup };
  }, [entries]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[20%] z-50 grid w-full translate-x-[-50%] gap-0",
            "border bg-background shadow-2xl shadow-black/20 duration-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "rounded-xl",
            isMobile ? "max-w-[95vw]" : "max-w-xl",
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 border-b px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="ค้นหาเมนู หรือพิมพ์ path..."
              className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              aria-label="ค้นหาเมนู"
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="ล้าง"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <kbd className="hidden items-center gap-1 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:flex">
              <span className="text-xs">esc</span>
            </kbd>
          </div>

          {/* Results */}
          <div
            ref={listRef}
            className="max-h-[60vh] overflow-y-auto p-2"
            onKeyDown={onKeyDown}
            tabIndex={-1}
          >
            {entries.length === 0 ? (
              <EmptyState query={query} />
            ) : (
              <>
                {groups.pinnedGroup.length > 0 && (
                  <Group
                    label="ปักหมุด"
                    icon={<Star className="h-3 w-3" />}
                    entries={groups.pinnedGroup}
                    startIndex={0}
                    activeIndex={activeIndex}
                    onHover={setActiveIndex}
                    onSelect={navigateTo}
                  />
                )}
                {groups.recentGroup.length > 0 && (
                  <Group
                    label="ล่าสุด"
                    icon={<Clock className="h-3 w-3" />}
                    entries={groups.recentGroup}
                    startIndex={groups.pinnedGroup.length}
                    activeIndex={activeIndex}
                    onHover={setActiveIndex}
                    onSelect={navigateTo}
                  />
                )}
                {groups.menuGroup.length > 0 && (
                  <Group
                    label="เมนูทั้งหมด"
                    icon={<Compass className="h-3 w-3" />}
                    entries={groups.menuGroup}
                    startIndex={groups.pinnedGroup.length + groups.recentGroup.length}
                    activeIndex={activeIndex}
                    onHover={setActiveIndex}
                    onSelect={navigateTo}
                  />
                )}
              </>
            )}
          </div>

          {/* Footer hints */}
          <div className="flex items-center justify-between border-t bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <Hint icon={<CornerDownLeft className="h-3 w-3" />} label="เปิด" />
              <Hint icon={<kbd className="font-mono text-[10px]">↑↓</kbd>} label="เลือก" />
              <Hint icon={<kbd className="font-mono text-[10px]">esc</kbd>} label="ปิด" />
            </div>
            <span>{entries.length} รายการ</span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/* ---------------------------------------------------------------- sub-components */

function Group({
  label,
  icon,
  entries,
  startIndex,
  activeIndex,
  onHover,
  onSelect,
}: {
  label: string;
  icon: React.ReactNode;
  entries: CommandEntry[];
  startIndex: number;
  activeIndex: number;
  onHover: (i: number) => void;
  onSelect: (e: CommandEntry) => void;
}) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="space-y-0.5">
        {entries.map((entry, i) => {
          const globalIndex = startIndex + i;
          const active = globalIndex === activeIndex;
          const IconComponent = resolveLucideIcon(entry.iconName);
          return (
            <button
              key={entry.id}
              type="button"
              data-cmd-index={globalIndex}
              onMouseEnter={() => onHover(globalIndex)}
              onClick={() => onSelect(entry)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                  active ? "bg-primary-foreground/15" : "bg-muted",
                )}
              >
                {IconComponent ? (
                  <IconComponent className="h-3.5 w-3.5" />
                ) : (
                  <Search className="h-3.5 w-3.5 opacity-50" />
                )}
              </span>
              <span className="flex-1 truncate">{entry.label}</span>
              {entry.hint && (
                <span
                  className={cn(
                    "ml-2 truncate text-xs",
                    active ? "text-primary-foreground/70" : "text-muted-foreground",
                  )}
                >
                  {entry.hint}
                </span>
              )}
              {active && (
                <CornerDownLeft
                  className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    active ? "text-primary-foreground" : "text-muted-foreground",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
      <Search className="h-6 w-6 opacity-40" />
      <p>{query ? `ไม่พบเมนูที่ตรงกับ "${query}"` : "พิมพ์เพื่อค้นหาเมนู หรือ path"}</p>
    </div>
  );
}

function Hint({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1">
      {icon}
      <span>{label}</span>
    </span>
  );
}
