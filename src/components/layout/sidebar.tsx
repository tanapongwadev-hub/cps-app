/**
 * Sidebar — main admin navigation
 *
 * Sections (top → bottom, expanded mode):
 *   1. Header — logo + REAL/MOCK badge
 *   2. Search / Cmd+K trigger
 *   3. Pinned — menus the user has starred (from sidebarStore.pinnedMenuIds)
 *   4. Recent — last 5 paths the user has visited (from sidebarStore.recentPaths)
 *   5. Main menu — all menus from accessControl
 *   6. Footer — theme + collapse + super-admin badge
 *
 * Collapsed mode hides everything except the icon rail + footer.
 */
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  CircleDot,
  Server,
  FlaskConical,
  Star,
  Clock,
  Pin,
  X,
  Sun,
  Moon,
  Monitor,
  Settings,
  Command as CommandIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useIsMobile } from "@/hooks/use-media-query";
import { usePermission } from "@/hooks/use-permission";
import { isMockMode } from "@/config/env";
import { resolveMenuPath, isComingSoonPath } from "@/config/menu-overrides";
import { cn } from "@/utils/cn";
import { resolveLucideIcon } from "@/utils/icon";
import { SESSION_STORAGE_KEYS } from "@/constants/app";
import type { MenuItem } from "@/types/menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { showToast } from "@/lib/toast";

/* ---------------------------------------------------------------- icons */

function Icon({ name, className }: { name?: string | null; className?: string }) {
  const IconComponent = React.useMemo(() => resolveLucideIcon(name), [name]);
  // eslint-disable-next-line react-hooks/static-components
  if (IconComponent) return <IconComponent className={className} />;
  return <CircleDot className={cn(className, "text-sidebar-muted-foreground/50")} />;
}

/** Pick the best display name from any of the fields the backend may return. */
function pickMenuName(item: MenuItem): string {
  return item.name ?? item.nameEn ?? item.nameTh ?? item.code ?? "";
}

/* ---------------------------------------------------------------- pinned row */

function PinnedRow({ item, onUnpin }: { item: MenuItem; onUnpin: () => void }) {
  const pathname = usePathname();
  const path = resolveMenuPath(item.code, item.path);
  const isActive = path ? pathname === path || pathname.startsWith(`${path}/`) : false;
  const isPlaceholder = isComingSoonPath(path);
  if (!path) return null;
  return (
    <Link
      href={path}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group/pin relative flex items-center gap-3 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
      )}
    >
      <Icon name={item.icon} className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 truncate">{pickMenuName(item)}</span>
      {isPlaceholder && (
        <Badge variant="warning" className="h-4 px-1 text-[9px]">
          เร็วๆ นี้
        </Badge>
      )}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onUnpin();
        }}
        aria-label={`เลิกปักหมุด ${pickMenuName(item)}`}
        className={cn(
          "rounded p-0.5 text-sidebar-muted-foreground opacity-0 transition-opacity",
          "hover:bg-sidebar-background/50 hover:text-foreground",
          "group-hover/pin:opacity-100",
        )}
      >
        <X className="h-3 w-3" />
      </button>
    </Link>
  );
}

/* ---------------------------------------------------------------- recent row */

function RecentRow({ path, onForget }: { path: string; onForget: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === path || pathname.startsWith(`${path}/`);
  return (
    <Link
      href={path}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group/rec relative flex items-center gap-3 rounded-md px-2.5 py-1.5 text-sm transition-colors",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
      )}
    >
      <Clock className="h-3.5 w-3.5 shrink-0 opacity-70" />
      <span className="flex-1 truncate text-xs">{prettyRecentPath(path)}</span>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onForget();
        }}
        aria-label={`ลบ ${path} ออกจากรายการล่าสุด`}
        className={cn(
          "rounded p-0.5 text-sidebar-muted-foreground opacity-0 transition-opacity",
          "hover:bg-sidebar-background/50 hover:text-foreground",
          "group-hover/rec:opacity-100",
        )}
      >
        <X className="h-3 w-3" />
      </button>
    </Link>
  );
}

/** "/user-management/users" → "user-management / users" */
function prettyRecentPath(path: string): string {
  return path
    .split("/")
    .filter(Boolean)
    .slice(-2)
    .join(" / ");
}

/* ---------------------------------------------------------------- main menu item */

interface SidebarMenuItemProps {
  item: MenuItem;
  level?: number;
  collapsed?: boolean;
  onNavigate?: () => void;
}

function SidebarMenuItem({ item, level = 0, collapsed, onNavigate }: SidebarMenuItemProps) {
  const pathname = usePathname();
  const hasChildren = (item.children?.length ?? 0) > 0;
  const effectivePath = resolveMenuPath(item.code, item.path);
  const displayName = pickMenuName(item);
  const isActive = effectivePath ? pathname === effectivePath || pathname.startsWith(`${effectivePath}/`) : false;
  const isChildActive =
    hasChildren && item.children?.some((c) => {
      const childPath = resolveMenuPath(c.code, c.path);
      return childPath && pathname.startsWith(childPath);
    });
  const isPlaceholder = isComingSoonPath(effectivePath);

  // Pin / unpin (only for leaf items with a path)
  const togglePin = useSidebarStore((s) => s.togglePin);
  const isPinned = useSidebarStore((s) => s.pinnedMenuIds.includes(item.id));

  const [open, setOpen] = React.useState(isChildActive);
  React.useEffect(() => {
    if (isChildActive) setOpen(true);
  }, [isChildActive]);

  if (item.isHidden) return null;

  if (hasChildren && !effectivePath) {
    if (collapsed) return null;
    return (
      <div className="space-y-1">
        <div
          className={cn(
            "px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted-foreground",
            level > 0 && "pl-6",
          )}
        >
          {pickMenuName(item)}
        </div>
        <div className="space-y-1">
          {item.children?.map((child) => (
            <SidebarMenuItem
              key={child.id}
              item={child}
              level={level + 1}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>
    );
  }

  const handlePinClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nowPinned = togglePin(item.id);
    showToast.success(
      nowPinned ? "ปักหมุดเมนูแล้ว" : "เลิกปักหมุดแล้ว",
      nowPinned ? `เพิ่ม "${displayName}" เข้าเมนูโปรด` : undefined,
    );
  };

  const content = (
    <div
      className={cn(
        "group/menu relative flex items-center gap-3 rounded-md text-sm font-medium transition-all duration-200",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        // Active state with subtle gradient + primary left bar
        isActive && [
          "bg-gradient-to-r from-sidebar-primary/15 to-sidebar-accent text-sidebar-accent-foreground",
          "shadow-[inset_2px_0_0_0_hsl(var(--sidebar-primary))]",
        ],
        collapsed ? "h-10 w-10 justify-center mx-auto" : "h-9 px-3 py-1",
        level > 0 && !collapsed && "ml-4 w-[calc(100%-1rem)]",
      )}
    >
      <Icon
        name={item.icon}
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          isActive && "text-sidebar-primary",
        )}
      />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{displayName}</span>
          {isPlaceholder && (
            <Badge variant="warning" className="ml-auto h-5 px-1.5 text-[10px]">
              เร็วๆ นี้
            </Badge>
          )}
          {item.badge !== undefined && !isPlaceholder && (
            <Badge
              variant={item.badgeVariant ?? "default"}
              className="ml-auto h-5 min-w-[1.25rem] rounded-full px-1.5 text-[10px] font-semibold"
            >
              {item.badge}
            </Badge>
          )}
          {/* Pin button (visible on hover).
              Only render on LEAF items (no children) — the collapsible-group
              case wraps the whole row in a <button> for toggle, and nesting
              another <button> inside is invalid HTML. */}
          {effectivePath && !isPlaceholder && !hasChildren && (
            <button
              type="button"
              onClick={handlePinClick}
              aria-label={isPinned ? `เลิกปักหมุด ${displayName}` : `ปักหมุด ${displayName}`}
              aria-pressed={isPinned}
              className={cn(
                "rounded p-0.5 transition-all",
                isPinned
                  ? "text-amber-400 opacity-100"
                  : "text-sidebar-muted-foreground opacity-0 group-hover/menu:opacity-100 hover:text-foreground",
              )}
            >
              <Star className={cn("h-3.5 w-3.5", isPinned && "fill-current")} />
            </button>
          )}
          {hasChildren && (
            <ChevronRight
              className={cn(
                "h-4 w-4 shrink-0 text-sidebar-muted-foreground transition-transform",
                open && "rotate-90",
              )}
            />
          )}
        </>
      )}
    </div>
  );

  if (!hasChildren && effectivePath) {
    const link = (
      <Link
        href={effectivePath}
        onClick={onNavigate}
        aria-current={isActive ? "page" : undefined}
        className="block"
      >
        {content}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right" className="flex flex-col gap-0.5">
            <span>{displayName}</span>
            {isPinned && (
              <span className="flex items-center gap-1 text-[10px] text-amber-400">
                <Star className="h-2.5 w-2.5 fill-current" /> ปักหมุดไว้
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }
    return link;
  }

  if (collapsed) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="block w-full text-left"
        aria-expanded={open}
      >
        {content}
      </button>
      {open && hasChildren && (
        <div className="mt-1 space-y-1">
          {item.children?.map((child) => (
            <SidebarMenuItem
              key={child.id}
              item={child}
              level={level + 1}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- main */

export function Sidebar() {
  const menuFromAccessControl = useAuthStore((s) => s.menu);
  const permissions = useAuthStore((s) => s.permissions);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const superAdmin = usePermission();
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const mobileOpen = useUIStore((s) => s.sidebarMobileOpen);
  const setMobileOpen = useUIStore((s) => s.setSidebarMobileOpen);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const isMobile = useIsMobile();

  // Sidebar customisation store
  const pinnedIds = useSidebarStore((s) => s.pinnedMenuIds);
  const recentPaths = useSidebarStore((s) => s.recentPaths);
  const unpin = useSidebarStore((s) => s.unpin);
  const forgetPath = useSidebarStore((s) => s.forgetPath);

  const { theme, setTheme } = useTheme();

  const [search, setSearch] = React.useState("");

  // Build a flat index of all menu items by id and by path
  const flatMenu = React.useMemo(() => {
    const out: MenuItem[] = [];
    const walk = (items: MenuItem[]) => {
      for (const m of items) {
        out.push(m);
        if (m.children?.length) walk(m.children);
      }
    };
    walk(menuFromAccessControl);
    return out;
  }, [menuFromAccessControl]);

  const menuById = React.useMemo(
    () => new Map(flatMenu.map((m) => [m.id, m] as const)),
    [flatMenu],
  );

  // Pinned items, preserving the user's pin order
  const pinnedItems = React.useMemo(
    () =>
      pinnedIds
        .map((id) => menuById.get(id))
        .filter((m): m is MenuItem => !!m),
    [pinnedIds, menuById],
  );

  // Recents — show the path only if it matches a known menu (others are noise)
  const recentMenuItems = React.useMemo(
    () =>
      recentPaths
        .map((p) => flatMenu.find((m) => resolveMenuPath(m.code, m.path) === p))
        .filter((m): m is MenuItem => !!m),
    [recentPaths, flatMenu],
  );

  // Filter the main menu (also matches pinned/recent paths so the user can search anything)
  const filteredMenu = React.useMemo(() => {
    if (!search.trim()) return menuFromAccessControl;
    const q = search.toLowerCase();
    const filter = (items: MenuItem[]): MenuItem[] =>
      items
        .map((m) => ({ ...m, children: m.children ? filter(m.children) : undefined }))
        .filter((m) => {
          const displayName = m.name ?? m.nameEn ?? m.nameTh ?? m.code ?? "";
          if (displayName.toLowerCase().includes(q) || (m.code ?? "").toLowerCase().includes(q))
            return true;
          if (m.children && m.children.length > 0) return true;
          return false;
        });
    return filter(menuFromAccessControl);
  }, [menuFromAccessControl, search]);

  const showingSearch = search.trim().length > 0;
  const showingPinnedOrRecent = !showingSearch && (pinnedItems.length > 0 || recentMenuItems.length > 0);

  const content = (
    <div
      className={cn(
        "flex h-full flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-300",
        collapsed ? "w-[var(--sidebar-width-collapsed)]" : "w-[var(--sidebar-width)]",
      )}
    >
      {/* Header — logo + backend indicator */}
      <div
        className={cn(
          "flex h-[var(--header-height)] items-center border-b border-sidebar-border",
          collapsed ? "justify-center px-2" : "gap-3 px-4",
        )}
      >
        <Link
          href="/dashboard"
          className="flex flex-1 items-center gap-2 overflow-hidden"
          aria-label="กลับไปหน้าแดชบอร์ด"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 text-sidebar-primary-foreground font-bold text-sm shadow-sm">
            A
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="text-sm font-semibold leading-tight">Admin Template</span>
              <span className="text-[10px] text-sidebar-muted-foreground">Enterprise</span>
            </div>
          )}
        </Link>
        {!collapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                  isMockMode
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                )}
                aria-label={isMockMode ? "ใช้ mock backend" : "เชื่อมต่อ real backend"}
              >
                {isMockMode ? <FlaskConical className="h-3 w-3" /> : <Server className="h-3 w-3" />}
                {isMockMode ? "MOCK" : "REAL"}
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {isMockMode
                ? "กำลังใช้ mock backend (in-memory handlers)"
                : "เชื่อมต่อ NestJS backend จริง"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Search + Cmd+K trigger */}
      {!collapsed && (
        <div className="px-3 py-2 space-y-1.5">
          {/* Quick filter — narrows the visible menu in-place. */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sidebar-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาเมนู..."
              className="h-8 border-sidebar-border bg-sidebar-accent/30 pl-8 pr-8 text-sidebar-foreground placeholder:text-sidebar-muted-foreground focus-visible:ring-sidebar-ring"
              aria-label="กรองเมนู"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="ล้างการค้นหา"
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          {/* ⌘K trigger — opens the global command palette for fuzzy search across
              pinned + recent + all menus. */}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className={cn(
              "group/kbd flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-[11px]",
              "text-sidebar-muted-foreground hover:text-sidebar-accent-foreground transition-colors",
            )}
            aria-label="เปิด quick switcher (global search)"
          >
            <span className="flex-1 truncate">ค้นหาขั้นสูง</span>
            <kbd className="flex items-center gap-0.5 rounded border border-sidebar-border bg-sidebar-background/40 px-1 font-mono text-[10px]">
              <CommandIcon className="h-2.5 w-2.5" />K
            </kbd>
          </button>
        </div>
      )}

      {/* Body — pinned / recent / main menu */}
      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-5 py-2" aria-label="Main">
          {/* PINNED */}
          {!collapsed && !showingSearch && pinnedItems.length > 0 && (
            <Section
              icon={<Pin className="h-3 w-3" />}
              label="ปักหมุด"
              count={pinnedItems.length}
            >
              {pinnedItems.map((item) => (
                <PinnedRow
                  key={`pin-${item.id}`}
                  item={item}
                  onUnpin={() => unpin(item.id)}
                />
              ))}
            </Section>
          )}

          {/* RECENT */}
          {!collapsed && !showingSearch && recentMenuItems.length > 0 && (
            <Section
              icon={<Clock className="h-3 w-3" />}
              label="ล่าสุด"
              count={recentMenuItems.length}
            >
              {recentMenuItems.map((item) => {
                const path = resolveMenuPath(item.code, item.path);
                if (!path) return null;
                return (
                  <RecentRow
                    key={`rec-${path}`}
                    path={path}
                    onForget={() => forgetPath(path)}
                  />
                );
              })}
            </Section>
          )}

          {/* MAIN MENU */}
          <Section
            label={showingPinnedOrRecent ? "เมนูทั้งหมด" : "เมนูหลัก"}
            icon={showingPinnedOrRecent ? undefined : <CommandIcon className="h-3 w-3" />}
          >
            {filteredMenu.length === 0 ? (
              <EmptyState
                isAuthenticated={isAuthenticated}
                hasPermissions={permissions && permissions.length > 0}
                search={search}
              />
            ) : (
              filteredMenu.map((item) => (
                <SidebarMenuItem key={item.id} item={item} collapsed={collapsed} />
              ))
            )}
          </Section>
        </nav>
      </ScrollArea>

      {/* Footer */}
      {!isMobile && (
        <div className="border-t border-sidebar-border p-2 space-y-1">
          {!collapsed && superAdmin.isSuperAdmin() && (
            <div className="flex items-center gap-1.5 rounded-md bg-sidebar-accent/40 px-2 py-1 text-[10px] font-medium text-sidebar-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
              SUPER ADMIN · {superAdmin.permissions.length} permissions
            </div>
          )}
          <div className={cn("flex items-center gap-1", collapsed && "flex-col")}>
            {/* Theme toggle */}
            {!collapsed && (
              <ThemeToggle theme={theme} setTheme={setTheme} />
            )}
            {/* Settings link */}
            {!collapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/system/settings"
                    aria-label="ตั้งค่า"
                    className="flex flex-1 items-center justify-center gap-2 rounded-md px-2 py-1.5 text-xs text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    <span>ตั้งค่า</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top">ตั้งค่าระบบ</TooltipContent>
              </Tooltip>
            )}
            {/* Collapse */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
                    !collapsed && "flex-shrink-0",
                    collapsed && "w-full justify-center",
                  )}
                  aria-label={collapsed ? "ขยาย Sidebar" : "ย่อ Sidebar"}
                >
                  {collapsed ? (
                    <ChevronsRight className="h-4 w-4" />
                  ) : (
                    <ChevronsLeft className="h-4 w-4" />
                  )}
                  {!collapsed && <span className="hidden lg:inline">ย่อ</span>}
                </button>
              </TooltipTrigger>
              <TooltipContent side={collapsed ? "right" : "top"}>
                {collapsed ? "ขยาย Sidebar" : "ย่อ Sidebar"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    if (!mobileOpen) return null;
    return (
      <>
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
        <aside className="fixed inset-y-0 left-0 z-50 w-[var(--sidebar-width)] animate-in slide-in-from-left duration-200">
          {content}
        </aside>
      </>
    );
  }

  return <aside className="sticky top-0 hidden h-screen md:block">{content}</aside>;
}

/* ---------------------------------------------------------------- section header */

function Section({
  label,
  icon,
  count,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-1">
      <div className="flex items-center justify-between gap-2 px-2 pb-1">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        {typeof count === "number" && count > 0 && (
          <span className="rounded-full bg-sidebar-accent px-1.5 py-0.5 text-[9px] font-medium text-sidebar-muted-foreground tabular-nums">
            {count}
          </span>
        )}
      </div>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}

function EmptyState({
  isAuthenticated,
  hasPermissions,
  search,
}: {
  isAuthenticated: boolean;
  hasPermissions: boolean;
  search: string;
}) {
  const message = !isAuthenticated
    ? "กรุณาเข้าสู่ระบบ"
    : !hasPermissions
      ? "กำลังโหลดเมนู..."
      : search.trim()
        ? `ไม่พบเมนูที่ตรงกับ "${search.trim()}"`
        : "ไม่มีเมนูที่เข้าถึงได้";
  return (
    <div className="flex flex-col items-center gap-1 px-3 py-6 text-center">
      <CircleDot className="h-4 w-4 text-sidebar-muted-foreground/40" />
      <p className="text-xs text-sidebar-muted-foreground">{message}</p>
    </div>
  );
}

function ThemeToggle({
  theme,
  setTheme,
}: {
  theme: string | undefined;
  setTheme: (t: "light" | "dark" | "system") => void;
}) {
  const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const label = theme === "light" ? "สว่าง" : theme === "dark" ? "มืด" : "ตามระบบ";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => setTheme(next)}
          aria-label={`ธีม: ${label}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-md px-2 py-1.5 text-xs text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <Icon className="h-3.5 w-3.5" />
          <span>ธีม: {label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">สลับเป็น{next === "light" ? "โหมดสว่าง" : next === "dark" ? "โหมดมืด" : "ตามระบบ"}</TooltipContent>
    </Tooltip>
  );
}
