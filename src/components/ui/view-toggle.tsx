"use client";

/**
 * ViewToggle — Segmented control สำหรับสลับ view mode (list / card)
 *
 * ใช้ localStorage เก็บ state และ sync กับระบบ SSR ผ่าน mounted flag
 * เพื่อป้องกัน hydration mismatch (server ไม่รู้ localStorage).
 *
 * รับ controlled value + onValueChange เพื่อให้ parent จัดการ state
 * ตามต้องการ หรือจะใช้ uncontrolled (defaultValue) แล้วให้ component
 * เก็บ state เองก็ได้
 */

import * as React from "react";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/utils/cn";

export type ViewMode = "list" | "card";

export interface ViewToggleOption<T extends string = ViewMode> {
  value: T;
  label: string;
  icon: React.ReactNode;
}

export interface ViewToggleProps<T extends string = ViewMode> {
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  /** LocalStorage key (ถ้ามี จะ persist ค่าที่ user เลือกไว้) */
  storageKey?: string;
  options?: ViewToggleOption<T>[];
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}

const DEFAULT_OPTIONS: ViewToggleOption<ViewMode>[] = [
  {
    value: "list",
    label: "ตาราง",
    icon: <List className="size-3.5" />,
  },
  {
    value: "card",
    label: "การ์ด",
    icon: <LayoutGrid className="size-3.5" />,
  },
];

/**
 * Hook สำหรับ sync view mode กับ localStorage และ share state ระหว่าง components
 * ใช้ custom event เพื่อให้ component อื่น ๆ ที่ใช้ key เดียวกัน update ตามทันที
 */
function useViewMode<T extends string = ViewMode>(
  storageKey: string | undefined,
  defaultValue: T,
  controlled: T | undefined,
  onValueChange: ((value: T) => void) | undefined,
): [T, (value: T) => void] {
  const [internal, setInternal] = React.useState<T>(defaultValue);
  const value = controlled ?? internal;

  // Hydrate จาก localStorage เมื่อ mount
  React.useEffect(() => {
    if (!storageKey || controlled !== undefined) return;
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored === "list" || stored === "card") {
        setInternal(stored as T);
      }
    } catch {
      // ignore
    }
  }, [storageKey, controlled]);

  const update = React.useCallback(
    (next: T) => {
      if (controlled === undefined) {
        setInternal(next);
      }
      if (storageKey) {
        try {
          window.localStorage.setItem(storageKey, next);
        } catch {
          // ignore
        }
      }
      onValueChange?.(next);
      // Notify siblings
      if (storageKey) {
        window.dispatchEvent(
          new CustomEvent("view-toggle:change", {
            detail: { storageKey, value: next },
          }),
        );
      }
    },
    [controlled, onValueChange, storageKey],
  );

  // Subscribe to other instances
  React.useEffect(() => {
    if (!storageKey) return;
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ storageKey: string; value: T }>).detail;
      if (detail?.storageKey === storageKey) {
        if (controlled === undefined) {
          setInternal(detail.value);
        }
        onValueChange?.(detail.value);
      }
    };
    window.addEventListener("view-toggle:change", handler);
    return () => window.removeEventListener("view-toggle:change", handler);
  }, [storageKey, controlled, onValueChange]);

  return [value, update];
}

export function ViewToggle<T extends string = ViewMode>({
  value: controlledValue,
  defaultValue,
  onValueChange,
  storageKey,
  options = DEFAULT_OPTIONS as ViewToggleOption<T>[],
  size = "md",
  className,
  ariaLabel = "สลับมุมมองการแสดงผล",
}: ViewToggleProps<T>) {
  const fallbackDefault = (defaultValue ?? options[0]?.value) as T;
  const [value, setValue] = useViewMode<T>(
    storageKey,
    fallbackDefault,
    controlledValue,
    onValueChange,
  );

  const isControlled = controlledValue !== undefined;
  const handleClick = (next: T) => {
    if (next === value) return;
    setValue(next);
    if (!isControlled) {
      // No-op (already handled in setValue)
    }
  };

  const sizeClasses =
    size === "sm"
      ? "h-8 p-0.5 text-xs"
      : "h-9 p-0.5 text-sm";

  const itemPadding = size === "sm" ? "px-2.5" : "px-3";

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "bg-muted text-muted-foreground inline-flex items-center gap-0.5 rounded-lg border",
        sizeClasses,
        className,
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={option.label}
            onClick={() => handleClick(option.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md font-medium transition-all",
              "focus-visible:ring-ring outline-none focus-visible:ring-2",
              itemPadding,
              "h-full",
              isActive
                ? "bg-card text-foreground shadow-sm"
                : "hover:text-foreground",
            )}
          >
            {option.icon}
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
