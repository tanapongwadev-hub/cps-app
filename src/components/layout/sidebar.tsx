/**
 * Sidebar — main admin navigation
 *
 * Visual style (v2):
 *   - Subtle vertical gradient background for depth
 *   - Animated left-bar active indicator (slides in on active item)
 *   - "Glass" effect on hover for menu items
 *   - Section headers with subtle divider line
 *   - Compact footer with better tooltip
 *
 * Sections (top → bottom, expanded mode):
 *   1. Header — logo + REAL/MOCK badge
 *   2. Search / Cmd+K trigger
 *   3. Pinned — menus the user has starred (from sidebarStore.pinnedMenuIds)
 *   4. Main menu — all menus from accessControl
 *   5. Footer — theme + collapse + super-admin badge
 *
 * Collapsed mode hides everything except the icon rail + footer.
 */
"use client";

import * as React from "react";
import Image from "next/image";
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
  Pin,
  X,
  Sun,
  Moon,
  Monitor,
  Settings,
  Command as CommandIcon,
  Sparkles,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { useSidebarStore } from "@/stores/sidebar-store";
import { useIsMobile, useIsTablet } from "@/hooks/use-media-query";
import { usePermission } from "@/hooks/use-permission";
import { isMockMode } from "@/config/env";
import { resolveMenuPath, isComingSoonPath } from "@/config/menu-overrides";
import { cn } from "@/utils/cn";
import { resolveLucideIcon } from "@/utils/icon";
import { SESSION_STORAGE_KEYS } from "@/constants/app";
import type { MenuItem } from "@/types/menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
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
        "group/pin relative flex items-center gap-3 rounded-md px-2.5 py-1.5 text-sm font-medium transition-all duration-200",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground active-glow",
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
        {/* Main Menu Group Header - slightly indented */}
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-2 text-xs font-bold text-sidebar-foreground/60",
            level > 0 && "pl-4",
          )}
        >
          {item.icon && (
            <Icon name={item.icon} className="h-4 w-4 shrink-0 text-sidebar-foreground/40" />
          )}
          <span className="flex-1 uppercase tracking-wide">{pickMenuName(item)}</span>
          <ChevronRight className="h-3 w-3 shrink-0 text-sidebar-muted-foreground/40" />
        </div>
        {/* Submenu Items - indented from main menu */}
        <div className="ml-4 space-y-0.5 border-l border-sidebar-border/30 pl-3">
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

  // Determine if this is a submenu item (has level > 0, meaning it's inside a group)
  const isSubmenu = level > 0;

  const content = (
    <div
      className={cn(
        "group/menu relative flex items-center gap-2 rounded-md text-sm font-medium transition-all duration-200",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        // Active state: subtle bg + animated left bar
        isActive && [
          "bg-sidebar-accent text-sidebar-accent-foreground",
          "active-glow",
        ],
        collapsed ? "h-10 w-10 justify-center mx-auto" : isSubmenu ? "h-8 px-2.5 py-1 text-xs" : "h-9 px-3 py-1",
      )}
    >
      <Icon
        name={item.icon}
        className={cn(
          "shrink-0 transition-all duration-200",
          isSubmenu ? "h-3.5 w-3.5" : "h-4 w-4",
          isActive && "text-sidebar-foreground",
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
                "h-4 w-4 shrink-0 text-sidebar-muted-foreground transition-transform duration-200",
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
        <div className="mt-1 space-y-1 fade-in-up">
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
  const isTablet = useIsTablet();

  // Sidebar customisation store
  const pinnedIds = useSidebarStore((s) => s.pinnedMenuIds);
  const unpin = useSidebarStore((s) => s.unpin);

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

  // Filter the main menu (also matches pinned paths so the user can search anything)
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
  const showingPinnedOnly = !showingSearch && pinnedItems.length > 0;

  // Tablet/compact layout: respect the user-defined collapsed state on
  // desktop, but force-collapsed on tablet so the sidebar defaults to the
  // icon-rail (the same shape a user gets when they collapse it on desktop).
  const effectiveCollapsed = collapsed; // desktop & mobile use the store

  const content = (opts?: { forceCollapsed?: boolean; forceExpanded?: boolean; onNavigate?: () => void }) => {
    const isForcedCollapsed = opts?.forceCollapsed ?? false;
    const isForcedExpanded = opts?.forceExpanded ?? false;
    // The width the sidebar should occupy (icon rail vs full)
    const isCollapsedView = isForcedExpanded ? false : isForcedCollapsed || effectiveCollapsed;
    // Shadow the store's `collapsed` with the effective one so the rest of
    // the JSX can keep using `collapsed` unchanged.
    const collapsed = isCollapsedView;
    return (
    <div
      className={cn(
        "sidebar-gradient sidebar-floating flex h-full flex-col text-sidebar-foreground transition-[width] duration-300",
        "overflow-hidden",
        isCollapsedView ? "w-[var(--sidebar-width-collapsed)]" : "w-[var(--sidebar-width)]",
      )}
    >
      {/* Header — logo + backend indicator */}
      <div
        className={cn(
          "relative flex h-[var(--header-height)] items-center",
          collapsed ? "justify-center px-2" : "gap-3 px-4",
        )}
      >
        <Link
          href="/dashboard"
          className="flex flex-1 items-center gap-2 overflow-hidden"
          aria-label="กลับไปหน้าแดชบอร์ด"
        >
          <Image
            src="/cci_logo.png"
            alt="CCI Logo"
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 object-contain"
            priority
          />
          {!collapsed && (
            <div className="flex flex-col truncate">
              
              <span className="text-[20px] text-sidebar-muted-foreground">
                CPS
              </span>
            </div>
          )}
        </Link>
        {!collapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
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
        <div className="space-y-1.5 px-3 py-2.5">
          {/* Quick filter — narrows the visible menu in-place. */}
          <div className="group/search relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sidebar-muted-foreground transition-colors group-focus-within/search:text-sidebar-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาเมนู..."
              className="h-8 border-sidebar-border bg-sidebar-accent/50 pl-8 pr-8 text-sidebar-foreground placeholder:text-sidebar-muted-foreground/70 transition-all focus-visible:bg-sidebar-accent focus-visible:ring-sidebar-ring"
              aria-label="กรองเมนู"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="ล้างการค้นหา"
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 text-sidebar-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </div>
          {/* ⌘K trigger — opens the global command palette for fuzzy search across
              pinned + recent + all menus. */}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className={cn(
              "group/kbd flex w-full items-center gap-2 rounded-md border border-transparent px-2 py-1 text-left text-[11px] transition-all",
              "text-sidebar-muted-foreground hover:border-sidebar-border/60 hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground",
            )}
            aria-label="เปิด quick switcher (global search)"
          >
            <Sparkles className="h-3 w-3 opacity-70 transition-opacity group-hover/kbd:opacity-100" />
            <span className="flex-1 truncate">Quick switcher</span>
            <kbd className="flex items-center gap-0.5 rounded border border-sidebar-border/80 bg-sidebar-background/50 px-1 font-mono text-[10px] text-sidebar-muted-foreground">
              <CommandIcon className="h-2.5 w-2.5" />K
            </kbd>
          </button>
        </div>
      )}

      {/* Body — pinned / recent / main menu */}
      <div className="flex-1 overflow-y-auto px-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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

          {/* RECENT section removed — "ล่าสุด" no longer shown in sidebar.
              (recentPaths is still tracked by useRecentPaths in case we want
              to surface it elsewhere — e.g. an admin/analytics view.) */}

          {/* MAIN MENU */}
          <Section
            label={showingPinnedOnly ? "เมนูทั้งหมด" : "เมนูหลัก"}
            icon={showingPinnedOnly ? undefined : <CommandIcon className="h-3 w-3" />}
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
      </div>

      {/* Footer */}
      {!isMobile && (
        <div className="space-y-1 p-2">
          {!collapsed && superAdmin.isSuperAdmin() && (
            <div className="flex items-center gap-1.5 rounded-md bg-gradient-to-r from-emerald-500/10 to-transparent px-2 py-1 text-[10px] font-medium text-sidebar-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
              </span>
              SUPER ADMIN · {superAdmin.permissions.length} permissions
            </div>
          )}
          <div className={cn("flex items-center gap-1", collapsed && "flex-col")}>
            {/* Theme toggle */}
            {!collapsed && <ThemeToggle theme={theme} setTheme={setTheme} />}
            {/* Settings link */}
            {!collapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/system/settings"
                    aria-label="ตั้งค่า"
                    className="flex flex-1 items-center justify-center gap-2 rounded-md px-2 py-1.5 text-xs text-sidebar-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
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
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-sidebar-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                    !collapsed && "shrink-0",
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
  };

  // Mobile (< 768px): sidebar is a full overlay drawer that slides in from
  // the left. Default closed — the user opens it with the hamburger button.
  if (isMobile) {
    if (!mobileOpen) return null;
    return (
      <>
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
        <aside className="fixed inset-y-0 left-0 z-50 w-80 animate-in slide-in-from-left duration-200">
          {content({ onNavigate: () => setMobileOpen(false) })}
        </aside>
      </>
    );
  }

  // Tablet (768-1023px): sidebar is always visible as a fixed-width icon rail
  // (collapsed) on the left. The user can click the hamburger in the top nav
  // to temporarily open the full sidebar as an overlay (the rail stays
  // collapsed underneath so the overlay covers the content cleanly).
  if (isTablet) {
    return (
      <>
        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />
            <aside
              className={cn(
                "fixed inset-y-0 left-0 z-50 w-[var(--sidebar-width)] animate-in slide-in-from-left duration-200",
                // Push the overlay to the right of the icon rail
                "left-[var(--sidebar-width-collapsed)]",
              )}
            >
              {content({ forceExpanded: true, onNavigate: () => setMobileOpen(false) })}
            </aside>
          </>
        )}
        <aside
          className={cn(
            "sticky top-0 hidden h-screen md:block",
            "w-[var(--sidebar-width-collapsed)]",
            "transition-[width] duration-300",
          )}
        >
          <div className="h-full overflow-hidden rounded-2xl">
            {content({ forceCollapsed: true, onNavigate: () => setMobileOpen(false) })}
          </div>
        </aside>
      </>
    );
  }

  // Desktop (≥ 1024px): sticky aside with rounded corners and shadow
  return (
    <aside className="sticky top-0 hidden h-screen md:block">
      <div className="h-full overflow-hidden rounded-2xl">
        {content()}
      </div>
    </aside>
  );
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
    <section className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 px-2">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted-foreground/80">
          {icon}
          <span>{label}</span>
        </div>
        {typeof count === "number" && count > 0 && (
          <span className="rounded-full bg-sidebar-accent/60 px-1.5 py-0.5 text-[9px] font-medium text-sidebar-muted-foreground tabular-nums">
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
          className="flex flex-1 items-center justify-center gap-2 rounded-md px-2 py-1.5 text-xs text-sidebar-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
        >
          <Icon className="h-3.5 w-3.5" />
          <span>ธีม: {label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">สลับเป็น{next === "light" ? "โหมดสว่าง" : next === "dark" ? "โหมดมืด" : "ตามระบบ"}</TooltipContent>
    </Tooltip>
  );
}

// Re-export to silence unused warnings
void SESSION_STORAGE_KEYS;
