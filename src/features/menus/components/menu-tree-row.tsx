"use client";

import {
  Plus,
  Pencil,
  Trash2,
  Menu as MenuIcon,
  ExternalLink,
  EyeOff,
  Eye,
  Power,
  PowerOff,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  Hash,
  CornerDownRight,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";
import type { MenuItem } from "@/features/menus/types";

/** Flat row item with computed level & path */
export interface MenuRow {
  menu: MenuItem;
  level: number;
  hasChildren: boolean;
  childCount: number;
}

export type DropPosition = "before" | "after" | "inside" | null;

export function MenuTreeRow({
  row,
  isFirst,
  isLast,
  canIndent,
  canOutdent,
  isDragged,
  overPosition,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onToggleVisible,
  onToggleActive,
  onMoveUp,
  onMoveDown,
  onIndent,
  onOutdent,
  onAddChild,
  onEdit,
  onDelete,
}: {
  row: MenuRow;
  isFirst: boolean;
  isLast: boolean;
  canIndent: boolean;
  canOutdent: boolean;
  isDragged: boolean;
  /** Non-null only when this row is the current drag-over target. */
  overPosition: DropPosition;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onToggleVisible: () => void;
  onToggleActive: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onIndent: () => void;
  onOutdent: () => void;
  onAddChild: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const m = row.menu;

  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "group relative flex items-center gap-1 px-2 py-1.5 hover:bg-accent/20 transition-colors",
        !m.isActive && "opacity-50",
        !m.isVisible && "opacity-60",
        row.level === 0 && "bg-muted/30 font-medium",
        isDragged && "opacity-30",
      )}
      style={{ paddingLeft: 8 + row.level * 16 }}
    >
      {/* Drop indicator — before */}
      {overPosition === "before" && (
        <div className="absolute inset-x-2 top-0 h-0.5 bg-primary rounded-full ring-2 ring-primary/40 z-10" />
      )}
      {/* Drop indicator — inside (full row) */}
      {overPosition === "inside" && (
        <div className="absolute inset-1 rounded-md bg-primary/20 ring-2 ring-primary z-10 pointer-events-none" />
      )}
      {/* Drop indicator — after */}
      {overPosition === "after" && (
        <div className="absolute inset-x-2 bottom-0 h-0.5 bg-primary rounded-full ring-2 ring-primary/40 z-10" />
      )}

      {/* Drag handle — the ↑↓←→ buttons provide the keyboard-operable equivalent */}
      <GripVertical
        aria-hidden="true"
        className="h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground/50 hover:text-muted-foreground"
      />

      {/* Indent guide — desktop only */}
      {row.level > 0 && (
        <CornerDownRight className="hidden md:block h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
      )}

      <MenuIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

      {/* Sort order badge — hidden on small mobile */}
      <Badge
        variant="muted"
        className="hidden sm:flex gap-1 text-[10px] shrink-0"
        title={`ลำดับที่ ${m.sortOrder}`}
      >
        <Hash className="h-2.5 w-2.5" />
        {m.sortOrder}
      </Badge>

      {/* Name & meta */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="truncate text-sm">{m.nameTh}</p>
          <code className="hidden md:inline text-[10px] text-muted-foreground">{m.code}</code>
          {m.menuType === "BUTTON" && (
            <Badge variant="warning" className="hidden sm:inline-flex text-[10px]">
              Action
            </Badge>
          )}
          {!m.isVisible && (
            <Badge variant="muted" className="hidden sm:inline-flex text-[10px]">
              ซ่อน
            </Badge>
          )}
          {!m.isActive && (
            <Badge variant="muted" className="hidden sm:inline-flex text-[10px]">
              ระงับ
            </Badge>
          )}
          {m.openInNewTab && (
            <ExternalLink className="hidden sm:inline h-3 w-3 text-muted-foreground" />
          )}
          {row.hasChildren && (
            <Badge variant="info" className="text-[10px]">
              {row.childCount}
            </Badge>
          )}
        </div>
        {m.path && <p className="hidden sm:block truncate text-xs text-muted-foreground">{m.path}</p>}
      </div>

      {/* Action buttons — desktop */}
      <div className="hidden lg:flex shrink-0 items-center gap-0.5">
        {/* Toggle visibility */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title={m.isVisible ? "ซ่อน" : "แสดง"}
          aria-label={m.isVisible ? "ซ่อน" : "แสดง"}
          onClick={onToggleVisible}
        >
          {m.isVisible ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </Button>
        {/* Toggle active */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title={m.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
          aria-label={m.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
          onClick={onToggleActive}
        >
          {m.isActive ? (
            <Power className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <PowerOff className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </Button>

        {/* Reorder: up */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={isFirst}
          title="เลื่อนขึ้น"
          aria-label="เลื่อนขึ้น"
          onClick={onMoveUp}
        >
          <ArrowUp className={cn("h-3.5 w-3.5", isFirst && "opacity-30")} />
        </Button>
        {/* Reorder: down */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={isLast}
          title="เลื่อนลง"
          aria-label="เลื่อนลง"
          onClick={onMoveDown}
        >
          <ArrowDown className={cn("h-3.5 w-3.5", isLast && "opacity-30")} />
        </Button>

        {/* Indent (→): make child of previous row */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-blue-600 hover:bg-blue-50"
          disabled={!canIndent}
          title="ซ้อน (เป็นเมนูย่อยของเมนูก่อนหน้า)"
          aria-label="ซ้อน (เป็นเมนูย่อยของเมนูก่อนหน้า)"
          onClick={onIndent}
        >
          <ArrowRight className={cn("h-3.5 w-3.5", !canIndent && "opacity-30")} />
        </Button>

        {/* Outdent (←): move up one level */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-amber-600 hover:bg-amber-50"
          disabled={!canOutdent}
          title="ถอด (ออกจากเมนูแม่)"
          aria-label="ถอด (ออกจากเมนูแม่)"
          onClick={onOutdent}
        >
          <ArrowLeft className={cn("h-3.5 w-3.5", !canOutdent && "opacity-30")} />
        </Button>

        {/* Add child */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-emerald-600 hover:bg-emerald-50"
          title="เพิ่มเมนูย่อย"
          aria-label="เพิ่มเมนูย่อย"
          onClick={onAddChild}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>

        {/* Edit */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title="แก้ไข"
          aria-label="แก้ไข"
          onClick={onEdit}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>

        {/* Delete */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-danger hover:bg-danger/10"
          title="ลบ"
          aria-label="ลบ"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Action buttons — tablet (md-lg): only show key actions */}
      <div className="hidden md:flex lg:hidden shrink-0 items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={isFirst}
          title="เลื่อนขึ้น"
          aria-label="เลื่อนขึ้น"
          onClick={onMoveUp}
        >
          <ArrowUp className={cn("h-3.5 w-3.5", isFirst && "opacity-30")} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={isLast}
          title="เลื่อนลง"
          aria-label="เลื่อนลง"
          onClick={onMoveDown}
        >
          <ArrowDown className={cn("h-3.5 w-3.5", isLast && "opacity-30")} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title="แก้ไข"
          aria-label="แก้ไข"
          onClick={onEdit}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-danger hover:bg-danger/10"
          title="ลบ"
          aria-label="ลบ"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Action buttons — mobile: reorder + key actions (no drag-and-drop fallback at this width) */}
      <div className="flex md:hidden shrink-0 items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={isFirst}
          title="เลื่อนขึ้น"
          aria-label="เลื่อนขึ้น"
          onClick={onMoveUp}
        >
          <ArrowUp className={cn("h-3.5 w-3.5", isFirst && "opacity-30")} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          disabled={isLast}
          title="เลื่อนลง"
          aria-label="เลื่อนลง"
          onClick={onMoveDown}
        >
          <ArrowDown className={cn("h-3.5 w-3.5", isLast && "opacity-30")} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title="แก้ไข"
          aria-label="แก้ไข"
          onClick={onEdit}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-danger hover:bg-danger/10"
          title="ลบ"
          aria-label="ลบ"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </li>
  );
}
