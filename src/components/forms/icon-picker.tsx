/**
 * IconPicker — a Select box that lets the user pick an icon name from a
 * curated catalog. Each option shows the rendered icon + a human label.
 *
 * The value is a string (Lucide icon name in kebab-case, e.g. "users",
 * "file-text") — the same shape the backend already accepts.
 *
 * Use anywhere a user needs to pick an icon: menu management, role badges,
 * category icons, etc.
 */
"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { resolveLucideIcon } from "@/utils/icon";
import { cn } from "@/utils/cn";
import { X } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Curated catalog                                                     */
/* ------------------------------------------------------------------ */

export interface IconEntry {
  /** Value sent to the backend / stored (e.g. "users") */
  name: string;
  /** Human-readable label in the picker (e.g. "Users") */
  label: string;
  /** Optional Lucide component name override — defaults to `name` */
  componentName?: string;
}

export interface IconCategory {
  /** Category label shown as a group header in the dropdown */
  label: string;
  icons: IconEntry[];
}

/**
 * Curated list of common admin / dashboard icons. Ordered by what people
 * actually use most. Each entry is the kebab-case name the backend expects.
 */
export const ICON_CATALOG: IconCategory[] = [
  {
    label: "ทั่วไป",
    icons: [
      { name: "menu", label: "Menu" },
      { name: "layout-dashboard", label: "Dashboard" },
      { name: "home", label: "Home" },
      { name: "list", label: "List" },
      { name: "grid-3x3", label: "Grid" },
      { name: "layers", label: "Layers" },
      { name: "circle-dot", label: "Dot" },
    ],
  },
  {
    label: "ผู้ใช้งาน & ทีม",
    icons: [
      { name: "users", label: "Users" },
      { name: "user", label: "User" },
      { name: "user-plus", label: "Add user" },
      { name: "user-check", label: "Verify user" },
      { name: "user-cog", label: "User settings" },
      { name: "contact", label: "Contact" },
      { name: "building", label: "Building" },
      { name: "building-2", label: "Building 2" },
    ],
  },
  {
    label: "เนื้อหา & เอกสาร",
    icons: [
      { name: "file-text", label: "Document" },
      { name: "file", label: "File" },
      { name: "file-plus", label: "New file" },
      { name: "folder", label: "Folder" },
      { name: "folder-open", label: "Folder open" },
      { name: "archive", label: "Archive" },
      { name: "book-open", label: "Book" },
      { name: "bookmark", label: "Bookmark" },
      { name: "newspaper", label: "News" },
      { name: "scroll-text", label: "Log" },
    ],
  },
  {
    label: "ระบบ & ตั้งค่า",
    icons: [
      { name: "settings", label: "Settings" },
      { name: "cog", label: "Cog" },
      { name: "wrench", label: "Tools" },
      { name: "sliders-horizontal", label: "Options" },
      { name: "shield", label: "Shield" },
      { name: "shield-check", label: "Shield check" },
      { name: "key", label: "Key" },
      { name: "key-round", label: "Key round" },
      { name: "lock", label: "Lock" },
      { name: "unlock", label: "Unlock" },
    ],
  },
  {
    label: "ข้อมูล & รายงาน",
    icons: [
      { name: "database", label: "Database" },
      { name: "bar-chart-3", label: "Bar chart" },
      { name: "line-chart", label: "Line chart" },
      { name: "pie-chart", label: "Pie chart" },
      { name: "trending-up", label: "Trending up" },
      { name: "activity", label: "Activity" },
      { name: "gauge", label: "Gauge" },
      { name: "clipboard-list", label: "Checklist" },
    ],
  },
  {
    label: "การสื่อสาร",
    icons: [
      { name: "mail", label: "Mail" },
      { name: "message-square", label: "Message" },
      { name: "phone", label: "Phone" },
      { name: "bell", label: "Notification" },
      { name: "megaphone", label: "Announcement" },
      { name: "send", label: "Send" },
    ],
  },
  {
    label: "พาณิชย์ & สินค้า",
    icons: [
      { name: "shopping-cart", label: "Cart" },
      { name: "package", label: "Package" },
      { name: "package-2", label: "Package 2" },
      { name: "credit-card", label: "Payment" },
      { name: "wallet", label: "Wallet" },
      { name: "receipt", label: "Receipt" },
      { name: "tag", label: "Tag" },
      { name: "store", label: "Store" },
    ],
  },
  {
    label: "การดำเนินงาน",
    icons: [
      { name: "ticket", label: "Ticket" },
      { name: "inbox", label: "Inbox" },
      { name: "truck", label: "Shipping" },
      { name: "calendar", label: "Calendar" },
      { name: "calendar-days", label: "Calendar days" },
      { name: "clock", label: "Time" },
      { name: "check-circle-2", label: "Approved" },
      { name: "alert-circle", label: "Alert" },
      { name: "hammer", label: "Action" },
      { name: "briefcase", label: "Work" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Trigger label / selected icon preview                               */
/* ------------------------------------------------------------------ */

function IconPreview({
  name,
  className,
}: {
  name: string | null | undefined;
  className?: string;
}) {
  // We render the icon by calling React.createElement so the React Compiler
  // doesn't flag the "create component during render" rule. JSX with a
  // dynamic component reference (e.g. `<Cmp />`) is treated as a fresh
  // component on every render, which is what the rule wants to prevent.
  // eslint-disable-next-line react-hooks/static-components
  const Cmp = React.useMemo(() => resolveLucideIcon(name), [name]);
  if (!Cmp) {
    return <X className={cn("h-3.5 w-3.5 text-muted-foreground/50", className)} />;
  }
  return React.createElement(Cmp, { className });
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export interface IconPickerProps {
  /** Currently selected icon name (kebab-case) */
  value: string;
  /** Called with the new icon name (or "" if cleared) */
  onChange: (value: string) => void;
  /** Optional id for the hidden form field */
  id?: string;
  /** Optional placeholder shown when value is empty */
  placeholder?: string;
  /** When true, prepends an explicit "(no icon)" option */
  allowClear?: boolean;
  className?: string;
}

export function IconPicker({
  value,
  onChange,
  id,
  placeholder = "เลือก icon...",
  allowClear = true,
  className,
}: IconPickerProps) {
  return (
    <Select
      value={value || "_none"}
      onValueChange={(v) => onChange(v === "_none" ? "" : v)}
    >
      <SelectTrigger id={id} className={className}>
        <SelectValue placeholder={placeholder}>
          {value ? (
            <span className="flex items-center gap-2">
              <IconPreview name={value} className="h-3.5 w-3.5 shrink-0" />
              <span className="font-mono text-xs">{value}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        position="popper"
        sideOffset={4}
        className="max-h-[min(28rem,80vh)]"
      >
        {allowClear && (
          <>
            <SelectItem value="_none">
              <span className="flex items-center gap-2">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">(ไม่มี icon)</span>
              </span>
            </SelectItem>
            <SelectSeparator />
          </>
        )}
        {ICON_CATALOG.map((category) => (
          <SelectGroup key={category.label}>
            <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/80">
              {category.label}
            </SelectLabel>
            {category.icons.map((icon) => (
              <SelectItem key={icon.name} value={icon.name}>
                <span className="flex items-center gap-2">
                  <IconPreview name={icon.name} className="h-3.5 w-3.5 shrink-0" />
                  <span>{icon.label}</span>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground/60">
                    {icon.name}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
