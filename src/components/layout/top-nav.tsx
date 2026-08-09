/**
 * Top Navigation — v2 (modern tab-bar aesthetic)
 *
 * Visual style:
 *   - Subtle vertical gradient (translucent) with backdrop blur
 *   - Soft shadow at the bottom for depth (separates from content)
 *   - Current-page indicator in the breadcrumb area styled as an "active tab"
 *     with a thin gradient underline
 *   - Search bar uses a softer, "segmented" surface feel
 *   - Action buttons grouped on the right with consistent spacing
 *   - Theme toggle expanded into a dropdown with the 3 options
 *
 * Layout (left → right):
 *   [Sidebar toggle]  [Current page tab]  ...  [Search]  [Actions: theme, lang, notif, user]
 */
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Building2,
  Check,
  ChevronsLeft,
  ChevronsRight,
  Globe,
  LogOut,
  Menu,
  Moon,
  RefreshCw,
  Search,
  Settings,
  Sun,
  User as UserIcon,
  Monitor,
  Home,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { useSwitchDepartment, useLogout } from "@/features/auth/hooks/use-auth";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getInitials } from "@/utils/format";
import { SUPPORTED_LANGUAGES } from "@/constants/app";
import { useIsMobile, useIsTablet } from "@/hooks/use-media-query";
import { showToast } from "@/lib/toast";
import type { Notification } from "@/types/notification";

const mockNotifications: Notification[] = [
  {
    id: "n1",
    type: "warning",
    title: "คำขอใหม่",
    message: "คุณมีคำขอใหม่ 3 รายการรอการอนุมัติ",
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    read: false,
    link: "/operations/approvals",
  },
  {
    id: "n2",
    type: "info",
    title: "ผู้ใช้งานใหม่",
    message: "ผู้ใช้งานใหม่ลงทะเบียนเข้าใช้งาน 2 ราย",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    read: false,
    link: "/user-management/users",
  },
  {
    id: "n3",
    type: "success",
    title: "Backup สำเร็จ",
    message: "Daily backup เสร็จสมบูรณ์",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: "n4",
    type: "danger",
    title: "คำขอเร่งด่วน",
    message: "TK-20240005 ติดสถานะนานเกินกำหนด",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    read: true,
    link: "/operations/tickets",
  },
];

/* ----------------------------------------------------------------
   Current-page "tab" indicator
   ---------------------------------------------------------------- */

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "หน้าหลัก",
  "/user-management": "จัดการผู้ใช้งาน",
  "/user-management/users": "รายการผู้ใช้งาน",
  "/user-management/roles": "จัดการบทบาท",
  "/user-management/departments": "จัดการแผนก",
  "/permissions": "จัดการสิทธิ์",
  "/sessions": "จัดการเซสชัน",
  "/system": "ระบบ",
  "/system/menu-management": "จัดการเมนู",
  "/system/settings": "ตั้งค่า",
  "/system/activity-logs": "บันทึกการใช้งาน",
  "/profile": "โปรไฟล์",
  "/materials": "จัดการอะไหล่",
};

function getPageTitle(pathname: string): { title: string; parent: string | null } {
  if (PAGE_TITLES[pathname]) {
    return { title: PAGE_TITLES[pathname], parent: null };
  }
  // Try parent path
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length > 1) {
    const parent = "/" + parts.slice(0, -1).join("/");
    if (PAGE_TITLES[parent]) {
      return { title: parts[parts.length - 1] ?? "หน้าหลัก", parent: PAGE_TITLES[parent] };
    }
  }
  return { title: parts[parts.length - 1] ?? "หน้าหลัก", parent: null };
}

function CurrentPageTab() {
  const pathname = usePathname();
  const { title, parent } = getPageTitle(pathname);
  return (
    <nav
      aria-label="Current page"
      className="hidden md:flex items-center gap-1.5 min-w-0 text-sm"
    >
      <Link
        href="/dashboard"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
        aria-label="กลับไปหน้าหลัก"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {parent && (
        <>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
          <span className="truncate text-muted-foreground">{parent}</span>
        </>
      )}
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
      <span
        key={pathname}
        className="nav-tab relative truncate rounded-md px-2 py-0.5 text-sm font-semibold text-foreground"
      >
        {title}
      </span>
    </nav>
  );
}

/* ----------------------------------------------------------------
   Theme dropdown
   ---------------------------------------------------------------- */

function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  const items = [
    { value: "light", label: "สว่าง", Icon: Sun },
    { value: "dark", label: "มืด", Icon: Moon },
    { value: "system", label: "ตามระบบ", Icon: Monitor },
  ] as const;
  const current = items.find((i) => i.value === (theme ?? "system"));
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`ธีม: ${current?.label ?? "ตามระบบ"}`}
          title={`ธีม: ${current?.label ?? "ตามระบบ"}`}
        >
          <ThemeIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          เลือกธีม
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map(({ value, label, Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className="cursor-pointer"
          >
            <Icon className="h-4 w-4" />
            {label}
            {(theme ?? "system") === value && (
              <Check className="ml-auto h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThemeIcon() {
  const { theme } = useTheme();
  if (theme === "dark") return <Moon className="h-4 w-4" />;
  if (theme === "system") return <Monitor className="h-4 w-4" />;
  return <Sun className="h-4 w-4" />;
}

/* ----------------------------------------------------------------
   Language menu
   ---------------------------------------------------------------- */

function LanguageMenu() {
  const language = useUIStore((s) => s.language);
  const setLanguage = useUIStore((s) => s.setLanguage);
  const current = SUPPORTED_LANGUAGES.find((l) => l.code === language);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="เปลี่ยนภาษา">
          <span className="text-base leading-none">{current?.flag ?? "🌐"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>เลือกภาษา</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SUPPORTED_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className="cursor-pointer"
          >
            <span className="mr-2 text-base leading-none">{lang.flag}</span>
            {lang.label}
            {language === lang.code && <Check className="ml-auto h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ----------------------------------------------------------------
   Notifications popover
   ---------------------------------------------------------------- */

function NotificationsMenu() {
  const unread = mockNotifications.filter((n) => !n.read).length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="การแจ้งเตือน"
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <Badge
              variant="danger"
              className="absolute -right-0.5 -top-0.5 h-4 min-w-[1rem] rounded-full px-1 text-[9px]"
            >
              {unread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">การแจ้งเตือน</h3>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs"
              onClick={() => showToast.success("อ่านการแจ้งเตือนทั้งหมดแล้ว")}
            >
              อ่านทั้งหมด
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {mockNotifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              ไม่มีการแจ้งเตือน
            </div>
          ) : (
            <ul className="divide-y">
              {mockNotifications.map((n) => {
                return (
                  <li key={n.id}>
                    {n.link ? (
                      <Link
                        href={n.link}
                        className="block px-4 py-3 transition-colors hover:bg-accent"
                      >
                        <NotificationContent n={n} />
                      </Link>
                    ) : (
                      <div className="block px-4 py-3">
                        <NotificationContent n={n} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
        <div className="border-t px-4 py-2 text-center">
          <Link
            href="/operations/approvals"
            className="text-xs font-medium text-primary hover:underline"
          >
            ดูการแจ้งเตือนทั้งหมด
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ----------------------------------------------------------------
   User menu
   ---------------------------------------------------------------- */

function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const currentDepartmentRole = useAuthStore((s) => s.currentDepartmentRole);
  const userDepartmentRoles = useAuthStore((s) => s.userDepartmentRoles);
  const switchDept = useSwitchDepartment();
  const logout = useLogout();
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full transition-all hover:ring-2 hover:ring-ring/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="เมนูผู้ใช้งาน"
        >
          <Avatar size="sm">
            <AvatarImage src={user?.avatarUrl} alt={user?.fullName} />
            <AvatarFallback>{getInitials(user?.firstName, user?.lastName)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user?.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            {currentDepartmentRole && (
              <div className="mt-1 flex items-center gap-1">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {currentDepartmentRole.departmentName} · {currentDepartmentRole.roleName}
                </p>
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {userDepartmentRoles.length > 1 && (
          <>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <RefreshCw className="h-4 w-4" />
                <span>เปลี่ยนแผนก / บทบาท</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="w-56">
                  {userDepartmentRoles.map((udr) => {
                    const isActive = udr.id === currentDepartmentRole?.id;
                    return (
                      <DropdownMenuItem
                        key={udr.id}
                        onClick={() => {
                          if (!isActive) {
                            switchDept.mutate({ userDepartmentRoleId: udr.id });
                          }
                        }}
                        className="cursor-pointer"
                      >
                        <Building2 className="h-4 w-4" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate">{udr.departmentName}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {udr.roleName} {udr.isPrimary && "· หลัก"}
                          </p>
                        </div>
                        {isActive && <Check className="h-4 w-4 text-primary" />}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <UserIcon className="h-4 w-4" />
            โปรไฟล์
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/system/settings" className="cursor-pointer">
            <Settings className="h-4 w-4" />
            ตั้งค่า
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="cursor-pointer text-danger focus:text-danger"
        >
          <LogOut className="h-4 w-4" />
          ออกจากระบบ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ----------------------------------------------------------------
   Search bar (segmented feel)
   ---------------------------------------------------------------- */

function GlobalSearch() {
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  return (
    <button
      type="button"
      onClick={() => setCommandPaletteOpen(true)}
      className={cn(
        "group/search relative hidden h-8 w-full max-w-md items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 text-left text-sm transition-all",
        "hover:border-border hover:bg-muted/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
      )}
      aria-label="เปิด quick switcher (กด ⌘K)"
    >
      <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover/search:text-foreground" />
      <span className="flex-1 truncate text-muted-foreground">
        ค้นหาเมนู หน้าเว็บ หรือคำสั่ง...
      </span>
      <span className="hidden items-center gap-1 sm:flex">
        <Sparkles className="h-3 w-3 text-muted-foreground/60" />
        <kbd className="flex h-5 items-center gap-0.5 rounded border border-border/60 bg-background/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </span>
    </button>
  );
}

/* ----------------------------------------------------------------
   Notification row content
   ---------------------------------------------------------------- */

function NotificationContent({ n }: { n: Notification }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          "mt-0.5 h-2 w-2 shrink-0 rounded-full",
          n.type === "success" && "bg-success",
          n.type === "warning" && "bg-warning",
          n.type === "danger" && "bg-danger",
          n.type === "info" && "bg-info",
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium">{n.title}</p>
          {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------
   Top Nav root
   ---------------------------------------------------------------- */

export function TopNav() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const mobileOpen = useUIStore((s) => s.sidebarMobileOpen);
  const setMobileOpen = useUIStore((s) => s.setSidebarMobileOpen);
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  return (
    <header
      className={cn(
        "topnav-gradient flex h-[var(--topnav-height)] items-center gap-2 rounded-2xl border border-sidebar-border",
        "px-3 shadow-md sm:gap-3 sm:px-4",
        "shadow-[0_4px_12px_-2px_rgb(0_0_0/0.08)]",
      )}
    >
      {/* Sidebar toggle (mobile drawer / tablet overlay / desktop collapse) */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          if (isMobile) setMobileOpen(true);
          else if (isTablet) setMobileOpen(!mobileOpen);
          else toggleSidebar();
        }}
        aria-label={
          isMobile
            ? "เปิดเมนู"
            : isTablet
              ? mobileOpen
                ? "ปิดเมนู"
                : "ขยาย Sidebar"
              : collapsed
                ? "ขยาย Sidebar"
                : "ย่อ Sidebar"
        }
        className="shrink-0"
      >
        {isMobile ? (
          <Menu className="h-4 w-4" />
        ) : isTablet ? (
          mobileOpen ? (
            <ChevronsLeft className="h-4 w-4" />
          ) : (
            <ChevronsRight className="h-4 w-4" />
          )
        ) : collapsed ? (
          <ChevronsRight className="h-4 w-4" />
        ) : (
          <ChevronsLeft className="h-4 w-4" />
        )}
      </Button>

      {/* Current page tab — gives the top nav its "tab bar" feel */}
      <CurrentPageTab />

      {/* Spacer on mobile */}
      <div className="flex-1 md:hidden" />

      {/* Global search */}
      <div className="hidden flex-1 md:flex md:justify-center">
        <GlobalSearch />
      </div>

      <div className="flex-1 md:hidden" />

      {/* Right-side action cluster */}
      <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border/60 bg-background/40 p-0.5 backdrop-blur-sm">
        <ThemeMenu />
        <LanguageMenu />
        <NotificationsMenu />
        <div className="mx-1 h-5 w-px bg-border/60" />
        <UserMenu />
      </div>
    </header>
  );
}
