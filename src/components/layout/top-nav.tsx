"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { useIsMobile } from "@/hooks/use-media-query";
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

function ThemeMenu() {
  const { setTheme, theme } = useTheme();
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Sun className="h-4 w-4" />
        <span>ธีม</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v)}>
            <DropdownMenuRadioItem value="light">
              <Sun className="h-4 w-4" />
              Light
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">
              <Moon className="h-4 w-4" />
              Dark
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">
              <Monitor className="h-4 w-4" />
              System
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}

function LanguageMenu() {
  const language = useUIStore((s) => s.language);
  const setLanguage = useUIStore((s) => s.setLanguage);
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Globe className="h-4 w-4" />
        <span>ภาษา</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup
            value={language}
            onValueChange={(v) => setLanguage(v as "th" | "en")}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <DropdownMenuRadioItem key={lang.code} value={lang.code}>
                <span className="mr-1">{lang.flag}</span>
                {lang.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}

function NotificationsMenu() {
  const unread = mockNotifications.filter((n) => !n.read).length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="การแจ้งเตือน" className="relative">
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
            <div className="p-8 text-center text-sm text-muted-foreground">ไม่มีการแจ้งเตือน</div>
          ) : (
            <ul className="divide-y">
              {mockNotifications.map((n) => {
                return (
                  <li key={n.id}>
                    {n.link ? (
                      <Link
                        href={n.link}
                        className="block px-4 py-3 hover:bg-accent transition-colors"
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
          className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            {currentDepartmentRole && (
              <div className="flex items-center gap-1 mt-1">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {currentDepartmentRole.departmentName} · {currentDepartmentRole.roleName}
                </p>
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Switch Department / Role */}
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
                        <div className="flex-1 min-w-0">
                          <p className="truncate">{udr.departmentName}</p>
                          <p className="text-xs text-muted-foreground truncate">
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
          className="text-danger focus:text-danger cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          ออกจากระบบ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TopNav() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setMobileOpen = useUIStore((s) => s.setSidebarMobileOpen);
  const isMobile = useIsMobile();

  return (
    <header className="sticky top-0 z-30 flex h-[var(--topnav-height)] items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:gap-4 sm:px-4">
      {/* Sidebar toggle (mobile + desktop) */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          if (isMobile) setMobileOpen(true);
          else toggleSidebar();
        }}
        aria-label={isMobile ? "เปิดเมนู" : collapsed ? "ขยาย Sidebar" : "ย่อ Sidebar"}
      >
        {isMobile ? (
          <Menu className="h-4 w-4" />
        ) : collapsed ? (
          <ChevronsRight className="h-4 w-4" />
        ) : (
          <ChevronsLeft className="h-4 w-4" />
        )}
      </Button>

      {/* Global search */}
      <div className="relative hidden md:flex flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="ค้นหาทั่วระบบ..."
          className="h-9 pl-9 pr-12 bg-muted/30"
          aria-label="ค้นหาทั่วระบบ"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden h-5 -translate-y-1/2 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
          ⌘K
        </kbd>
      </div>

      <div className="flex-1 md:hidden" />

      <div className="flex items-center gap-1">
        <ThemeMenu_Button />
        <LanguageMenu_Button />
        <NotificationsMenu />
        <UserMenu />
      </div>
    </header>
  );
}

// Standalone buttons (icon-only) to fit top nav
function ThemeMenu_Button() {
  const { theme, setTheme } = useTheme();
  const cycle = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycle}
      aria-label={`ธีม: ${theme ?? "system"}`}
      title={`ธีม: ${theme ?? "system"}`}
    >
      <ThemeIcon />
    </Button>
  );
}

function ThemeIcon() {
  const { theme } = useTheme();
  if (theme === "dark") return <Moon className="h-4 w-4" />;
  if (theme === "system") return <Monitor className="h-4 w-4" />;
  return <Sun className="h-4 w-4" />;
}

function LanguageMenu_Button() {
  const language = useUIStore((s) => s.language);
  const setLanguage = useUIStore((s) => s.setLanguage);
  const current = SUPPORTED_LANGUAGES.find((l) => l.code === language);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="เปลี่ยนภาษา">
          <span className="text-base">{current?.flag ?? "🌐"}</span>
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
            <span className="mr-2">{lang.flag}</span>
            {lang.label}
            {language === lang.code && <Check className="ml-auto h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationContent({ n }: { n: Notification }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          "mt-0.5 h-2 w-2 rounded-full shrink-0",
          n.type === "success" && "bg-success",
          n.type === "warning" && "bg-warning",
          n.type === "danger" && "bg-danger",
          n.type === "info" && "bg-info",
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium truncate">{n.title}</p>
          {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
      </div>
    </div>
  );
}
