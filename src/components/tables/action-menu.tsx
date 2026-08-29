"use client";

import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/utils/cn";

export interface ActionItem<T = unknown> {
  label: string;
  icon?: React.ReactElement | React.ReactNode;
  onClick: (row: T) => void;
  variant?: "default" | "danger";
  disabled?: ((row: T) => boolean) | boolean;
  hidden?: boolean;
}

interface ActionMenuProps<T = unknown> {
  items: ActionItem<T>[];
  /**
   * The row each `ActionItem.onClick` is invoked with. Required — every
   * table cell has a specific row, pass it explicitly. The pre-existing
   * "closure-capture" pattern (used in some tables) is being migrated to
   * this strict form.
   */
  row: T;
  label?: string;
}

export function ActionMenu<T = unknown>({ items, row, label = "เมนู" }: ActionMenuProps<T>) {
  const visible = items.filter((i) => !i.hidden);
  if (visible.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-10 w-10 sm:h-8 sm:w-8"
          aria-label={label}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        {visible.map((item, idx) => {
          const prev = visible[idx - 1];
          const showSeparator = prev && prev.variant !== item.variant;
          const isDisabled = typeof item.disabled === "function" ? item.disabled(row) : item.disabled;
          return (
            <React.Fragment key={item.label}>
              {showSeparator && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  item.onClick(row);
                }}
                disabled={!!isDisabled}
                className={cn(
                  "min-h-10",
                  item.variant === "danger" && "text-danger focus:text-danger",
                )}
              >
                {item.icon}
                {item.label}
              </DropdownMenuItem>
            </React.Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
