/**
 * Menu management page — redesigned for simpler UX
 *
 * Design:
 *   - Flat list (not recursive tree) with indent showing level
 *   - All actions via buttons — NO drag & drop
 *   - Buttons: ↑↓ reorder, →→ indent (become child), ← outdent, + child, ✏ edit, 🗑 delete
 *   - Always visible sort order badge
 */
"use client";

import * as React from "react";
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
  Save,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  Hash,
  CornerDownRight,
  GripVertical,
} from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import { IconPicker } from "@/components/forms/icon-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useMenusList,
  useCreateMenu,
  useUpdateMenu,
  useDeleteMenu,
  useReorderMenus,
} from "@/features/menus/hooks/use-menus";
import type { MenuItem, MenuFormData } from "@/features/menus/types";
import { cn } from "@/utils/cn";

const EMPTY_FORM: MenuFormData = {
  code: "",
  nameTh: "",
  nameEn: "",
  parentId: null,
  menuType: "MAIN",
  path: "",
  icon: "",
  sortOrder: 100,
  isVisible: true,
  isActive: true,
  openInNewTab: false,
  externalUrl: "",
  description: "",
};

/** Flat row item with computed level & path */
interface MenuRow {
  menu: MenuItem;
  level: number;
  hasChildren: boolean;
  childCount: number;
}

export default function MenuManagementPage() {
  const { data: listData, isLoading, isError, error } = useMenusList();
  const createMenu = useCreateMenu();
  const updateMenu = useUpdateMenu();
  const deleteMenu = useDeleteMenu();
  const reorderMenus = useReorderMenus();

  const flatMenus = React.useMemo<MenuItem[]>(
    () => (listData?.items ?? []) as MenuItem[],
    [listData],
  );

  // Build a child map for O(1) lookup
  const childrenMap = React.useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const m of flatMenus) {
      const parentId = (m.parentId ?? m.parent?.id ?? null) as string | null;
      if (parentId) {
        const list = map.get(parentId) ?? [];
        list.push(m);
        map.set(parentId, list);
      }
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    }
    return map;
  }, [flatMenus]);

  // Build hierarchical flat list (DFS) for rendering
  // Always show all menus; show parent before children; indent shows level
  const rows = React.useMemo<MenuRow[]>(() => {
    const sortedRoots = [...flatMenus]
      .filter((m) => !(m.parentId ?? m.parent?.id ?? null))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    const result: MenuRow[] = [];
    const walk = (menu: MenuItem, level: number) => {
      const children = childrenMap.get(menu.id) ?? [];
      const hasChildren = children.length > 0;
      result.push({ menu, level, hasChildren, childCount: children.length });
      for (const child of children) {
        walk(child, level + 1);
      }
    };
    for (const root of sortedRoots) {
      walk(root, 0);
    }
    return result;
  }, [flatMenus, childrenMap]);

  const [editing, setEditing] = React.useState<MenuItem | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [creatingChildOf, setCreatingChildOf] = React.useState<MenuItem | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<MenuItem | null>(null);

  // Drag-drop state
  const [draggedId, setDraggedId] = React.useState<string | null>(null);
  const [overRowId, setOverRowId] = React.useState<string | null>(null);
  const [overPosition, setOverPosition] = React.useState<"before" | "after" | "inside" | null>(null);

  // ============================================================
  // Reorder operations
  // ============================================================

  /** Swap a menu with its previous sibling (same parent) */
  const moveUp = (menuId: string) => {
    const target = flatMenus.find((m) => m.id === menuId);
    if (!target) return;
    const parentId = (target.parentId ?? target.parent?.id ?? null) as string | null;
    const siblings = [
      ...flatMenus
        .filter((m) => (m.parentId ?? m.parent?.id ?? null) === parentId)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    ];
    const idx = siblings.findIndex((s) => s.id === menuId);
    if (idx <= 0) return; // already first
    const prev = siblings[idx - 1];
    const cur = siblings[idx];
    if (!prev || !cur) return;
    reorderMenus.mutate([
      { id: cur.id, sortOrder: prev.sortOrder, parentId: parentId ?? null },
      { id: prev.id, sortOrder: cur.sortOrder, parentId: parentId ?? null },
    ]);
  };

  /** Swap a menu with its next sibling (same parent) */
  const moveDown = (menuId: string) => {
    const target = flatMenus.find((m) => m.id === menuId);
    if (!target) return;
    const parentId = (target.parentId ?? target.parent?.id ?? null) as string | null;
    const siblings = [
      ...flatMenus
        .filter((m) => (m.parentId ?? m.parent?.id ?? null) === parentId)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    ];
    const idx = siblings.findIndex((s) => s.id === menuId);
    if (idx < 0 || idx >= siblings.length - 1) return; // already last
    const next = siblings[idx + 1];
    const cur = siblings[idx];
    if (!next || !cur) return;
    reorderMenus.mutate([
      { id: cur.id, sortOrder: next.sortOrder, parentId: parentId ?? null },
      { id: next.id, sortOrder: cur.sortOrder, parentId: parentId ?? null },
    ]);
  };

  /**
   * Indent a menu — make it a child of its previous sibling.
   * (Row index: must have a previous sibling at the same indent level.)
   * To keep it simple, we look at the rows list to find the previous row
   * that is at level === target.level - 1.
   */
  const indent = (menuId: string) => {
    const rowIndex = rows.findIndex((r) => r.menu.id === menuId);
    if (rowIndex < 0) return;
    const target = rows[rowIndex];
    if (!target) return;
    // Find the previous row whose level < target.level
    for (let i = rowIndex - 1; i >= 0; i--) {
      const r = rows[i];
      if (!r) continue;
      if (r.level < target.level) {
        // Make this menu a child of r.menu
        const newParent = r.menu;
        const newParentChildren = childrenMap.get(newParent.id) ?? [];
        const lastSort = newParentChildren[newParentChildren.length - 1]?.sortOrder ?? 0;
        reorderMenus.mutate([
          { id: menuId, sortOrder: lastSort + 1, parentId: newParent.id },
        ]);
        return;
      }
    }
  };

  /**
   * Outdent a menu — move it up one level (to its parent's parent).
   * Place it just after its parent in the new parent's children list.
   */
  const outdent = (menuId: string) => {
    const target = flatMenus.find((m) => m.id === menuId);
    if (!target) return;
    const currentParentId = (target.parentId ?? target.parent?.id ?? null) as string | null;
    if (!currentParentId) return; // already at root
    const currentParent = flatMenus.find((m) => m.id === currentParentId);
    if (!currentParent) return;
    const newParentId = (currentParent.parentId ?? currentParent.parent?.id ?? null) as string | null;
    // Find sortOrder — place after current parent in new parent's children
    const newSiblings = [
      ...flatMenus
        .filter((m) => (m.parentId ?? m.parent?.id ?? null) === newParentId)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    ];
    const parentSort = currentParent.sortOrder ?? 0;
    // Find first sibling with sortOrder > parentSort, use that - 1
    const nextSibling = newSiblings.find((s) => (s.sortOrder ?? 0) > parentSort);
    const newSort = nextSibling
      ? (nextSibling.sortOrder ?? 0) - 1
      : parentSort + 1;
    reorderMenus.mutate([
      { id: menuId, sortOrder: newSort, parentId: newParentId },
    ]);
  };

  const handleInlineUpdate = (id: string, patch: Partial<MenuItem>) => {
    updateMenu.mutate({ id, data: patch });
  };

  // ============================================================
  // Drag-and-drop reorder
  // ============================================================

  const handleDragStart = (e: React.DragEvent, menuId: string) => {
    setDraggedId(menuId);
    e.dataTransfer.setData("text/menu-id", menuId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setOverRowId(null);
    setOverPosition(null);
  };

  const handleRowDragOver = (e: React.DragEvent, row: MenuRow, index: number) => {
    if (!draggedId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const h = rect.height;
    let position: "before" | "after" | "inside";
    if (y < h * 0.25) position = "before";
    else if (y > h * 0.75) position = "after";
    else position = "inside";
    setOverRowId(row.menu.id);
    setOverPosition(position);
  };

  const handleRowDrop = (e: React.DragEvent, row: MenuRow) => {
    e.preventDefault();
    const droppedId = e.dataTransfer.getData("text/menu-id") || draggedId;
    if (!droppedId || !overPosition) {
      handleDragEnd();
      return;
    }
    if (droppedId === row.menu.id) {
      handleDragEnd();
      return;
    }
    const targetMenu = row.menu;
    let newParentId: string | null;
    let newSortOrder: number;

    if (overPosition === "inside") {
      // Make this menu a child of target
      newParentId = targetMenu.id;
      const targetChildren = childrenMap.get(targetMenu.id) ?? [];
      const lastSort = targetChildren[targetChildren.length - 1]?.sortOrder ?? 0;
      newSortOrder = lastSort + 1;
    } else if (overPosition === "before") {
      // Place before target (sibling of target)
      newParentId = (targetMenu.parentId ?? targetMenu.parent?.id ?? null) as string | null;
      newSortOrder = (targetMenu.sortOrder ?? 0) - 1;
    } else {
      // Place after target (sibling of target)
      newParentId = (targetMenu.parentId ?? targetMenu.parent?.id ?? null) as string | null;
      newSortOrder = (targetMenu.sortOrder ?? 0) + 1;
    }

    reorderMenus.mutate([{ id: droppedId, sortOrder: newSortOrder, parentId: newParentId }]);
    handleDragEnd();
  };

  return (
    <>
      <PageContainer>
        <PageHeader
          title="จัดการเมนู"
          description="จัดการเมนู — ลากเพื่อเรียง, ↑↓ สลับ, → ซ้อน, ← ถอด"
          breadcrumbs={[
            { label: "หน้าหลัก", href: "/dashboard" },
            { label: "ระบบ" },
            { label: "จัดการเมนู" },
          ]}
          primaryAction={
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              เพิ่มเมนู
            </Button>
          }
        />

        {/* Action legend — responsive: hidden on mobile, fewer items on tablet */}
        <Card className="mb-2 p-2 hidden md:block">
          <div className="flex items-center gap-4 flex-wrap px-2 py-1 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">สัญลักษณ์:</span>
            <span className="flex items-center gap-1">
              <GripVertical className="h-3.5 w-3.5" /> ลากเพื่อเรียงลำดับ
            </span>
            <span className="flex items-center gap-1">
              <ArrowUp className="h-3.5 w-3.5" />/<ArrowDown className="h-3.5 w-3.5" /> สลับลำดับ
            </span>
            <span className="hidden lg:flex items-center gap-1">
              <ArrowRight className="h-3.5 w-3.5" /> ซ้อน
            </span>
            <span className="hidden lg:flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> ถอด
            </span>
            <span className="hidden lg:flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" /> เพิ่มเมนูย่อย
            </span>
            <span className="flex items-center gap-1">
              <Pencil className="h-3.5 w-3.5" /> แก้ไข
            </span>
            <span className="flex items-center gap-1 text-danger">
              <Trash2 className="h-3.5 w-3.5" /> ลบ
            </span>
          </div>
        </Card>

        <Card className="p-2">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : isError ? (
            <div className="m-4 rounded-md border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
              <p className="font-medium">โหลดเมนูไม่สำเร็จ</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
            </div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              ยังไม่มีเมนูในระบบ — คลิก "เพิ่มเมนู" เพื่อเริ่มต้น
            </div>
          ) : (
            <ul className="divide-y divide-border/40">
              {rows.map((row, index) => {
                const m = row.menu;
                const parentId = (m.parentId ?? m.parent?.id ?? null) as string | null;
                const hasParent = parentId !== null;
                // First / last within siblings?
                const siblings = flatMenus
                  .filter((x) => (x.parentId ?? x.parent?.id ?? null) === parentId)
                  .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
                const isFirst = siblings[0]?.id === m.id;
                const isLast = siblings[siblings.length - 1]?.id === m.id;
                // Can indent? (there must be a previous row at a smaller level)
                const canIndent = row.level > 0 && index > 0 && (() => {
                  for (let i = index - 1; i >= 0; i--) {
                    const r = rows[i];
                    if (!r) continue;
                    if (r.level < row.level) return true;
                    if (r.level === row.level) return false;
                  }
                  return false;
                })();
                const canOutdent = hasParent;
                return (
                  <li
                    key={m.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, m.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleRowDragOver(e, row, index)}
                    onDrop={(e) => handleRowDrop(e, row)}
                    className={cn(
                      "group relative flex items-center gap-1 px-2 py-1.5 hover:bg-accent/20 transition-colors",
                      !m.isActive && "opacity-50",
                      !m.isVisible && "opacity-60",
                      row.level === 0 && "bg-muted/30 font-medium",
                      draggedId === m.id && "opacity-30",
                    )}
                    style={{ paddingLeft: 8 + row.level * 16 }}
                  >
                    {/* Drop indicator — before */}
                    {overRowId === m.id && overPosition === "before" && (
                      <div className="absolute inset-x-2 top-0 h-0.5 bg-primary rounded-full ring-2 ring-primary/40 z-10" />
                    )}
                    {/* Drop indicator — inside (full row) */}
                    {overRowId === m.id && overPosition === "inside" && (
                      <div className="absolute inset-1 rounded-md bg-primary/20 ring-2 ring-primary z-10 pointer-events-none" />
                    )}
                    {/* Drop indicator — after */}
                    {overRowId === m.id && overPosition === "after" && (
                      <div className="absolute inset-x-2 bottom-0 h-0.5 bg-primary rounded-full ring-2 ring-primary/40 z-10" />
                    )}

                    {/* Drag handle */}
                    <GripVertical
                      className="h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground/50 hover:text-muted-foreground"
                    />

                    {/* Indent guide — desktop only */}
                    {row.level > 0 && (
                      <CornerDownRight
                        className="hidden md:block h-3.5 w-3.5 shrink-0 text-muted-foreground/50"
                      />
                    )}

                    <MenuIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

                    {/* Sort order badge — hidden on small mobile */}
                    <Badge variant="muted" className="hidden sm:flex gap-1 text-[10px] shrink-0" title={`ลำดับที่ ${m.sortOrder}`}>
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
                        {m.openInNewTab && <ExternalLink className="hidden sm:inline h-3 w-3 text-muted-foreground" />}
                        {row.hasChildren && (
                          <Badge variant="info" className="text-[10px]">
                            {row.childCount}
                          </Badge>
                        )}
                      </div>
                      {m.path && (
                        <p className="hidden sm:block truncate text-xs text-muted-foreground">{m.path}</p>
                      )}
                    </div>

                    {/* Action buttons — desktop */}
                    <div className="hidden lg:flex shrink-0 items-center gap-0.5">
                      {/* Toggle visibility */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title={m.isVisible ? "ซ่อน" : "แสดง"}
                        onClick={() => handleInlineUpdate(m.id, { isVisible: !m.isVisible })}
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
                        onClick={() => handleInlineUpdate(m.id, { isActive: !m.isActive })}
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
                        onClick={() => moveUp(m.id)}
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
                        onClick={() => moveDown(m.id)}
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
                        onClick={() => indent(m.id)}
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
                        onClick={() => outdent(m.id)}
                      >
                        <ArrowLeft className={cn("h-3.5 w-3.5", !canOutdent && "opacity-30")} />
                      </Button>

                      {/* Add child */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-emerald-600 hover:bg-emerald-50"
                        title="เพิ่มเมนูย่อย"
                        onClick={() => setCreatingChildOf(m)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>

                      {/* Edit */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="แก้ไข"
                        onClick={() => setEditing(m)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-danger hover:bg-danger/10"
                        title="ลบ"
                        onClick={() => setPendingDelete(m)}
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
                        onClick={() => moveUp(m.id)}
                      >
                        <ArrowUp className={cn("h-3.5 w-3.5", isFirst && "opacity-30")} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={isLast}
                        title="เลื่อนลง"
                        onClick={() => moveDown(m.id)}
                      >
                        <ArrowDown className={cn("h-3.5 w-3.5", isLast && "opacity-30")} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="แก้ไข"
                        onClick={() => setEditing(m)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-danger hover:bg-danger/10"
                        title="ลบ"
                        onClick={() => setPendingDelete(m)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Action buttons — mobile: only show key actions */}
                    <div className="flex md:hidden shrink-0 items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="แก้ไข"
                        onClick={() => setEditing(m)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-danger hover:bg-danger/10"
                        title="ลบ"
                        onClick={() => setPendingDelete(m)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </PageContainer>
      <PageFooter />

      {/* Create dialog (root) */}
      <MenuFormDialog
        open={creating}
        onOpenChange={(o) => !o && setCreating(false)}
        title="เพิ่มเมนูใหม่"
        submitLabel="สร้างเมนู"
        mode="create"
        onSubmit={(data) => {
          createMenu.mutate(data, {
            onSuccess: () => setCreating(false),
          });
        }}
        isPending={createMenu.isPending}
        allMenus={flatMenus}
      />

      {/* Create child dialog */}
      <MenuFormDialog
        open={!!creatingChildOf}
        onOpenChange={(o) => !o && setCreatingChildOf(null)}
        title={`เพิ่มเมนูย่อยของ "${creatingChildOf?.nameTh ?? ""}"`}
        submitLabel="สร้างเมนูย่อย"
        mode="create"
        initial={creatingChildOf ? { ...EMPTY_FORM, parentId: creatingChildOf.id, menuType: "MENU" } : null}
        onSubmit={(data) => {
          createMenu.mutate(data, {
            onSuccess: () => setCreatingChildOf(null),
          });
        }}
        isPending={createMenu.isPending}
        allMenus={flatMenus}
      />

      {/* Edit dialog */}
      <MenuFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="แก้ไขเมนู"
        submitLabel="บันทึก"
        mode="update"
        initial={editing ? menuToForm(editing) : null}
        onSubmit={(data) => {
          if (editing) {
            updateMenu.mutate(
              { id: editing.id, data },
              { onSuccess: () => setEditing(null) },
            );
          }
        }}
        isPending={updateMenu.isPending}
        allMenus={flatMenus}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="ลบเมนูนี้?"
        description={
          pendingDelete ? (
            <>
              จะลบ <strong>{pendingDelete.nameTh}</strong> ({pendingDelete.code}) และไม่สามารถกู้คืนได้
              {(childrenMap.get(pendingDelete.id)?.length ?? 0) > 0 && (
                <span className="mt-2 block text-danger">
                  ⚠️ เมนูนี้มีเมนูย่อย {childrenMap.get(pendingDelete.id)?.length} รายการ — ต้องลบเมนูย่อยก่อน
                </span>
              )}
            </>
          ) : null
        }
        confirmText="ลบเลย"
        variant="danger"
        onConfirm={() => {
          if (pendingDelete) {
            deleteMenu.mutate(pendingDelete.id, {
              onSuccess: () => setPendingDelete(null),
            });
          }
        }}
      />
    </>
  );
}

// ---------- Form Dialog ----------

function MenuFormDialog({
  open,
  onOpenChange,
  title,
  submitLabel,
  mode,
  initial,
  onSubmit,
  isPending,
  allMenus,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  submitLabel: string;
  /** "create" → POST /menus; "update" → PATCH /menus/:id. The two endpoints
   *  accept different field sets (see filter below). */
  mode: "create" | "update";
  initial?: MenuFormData | null;
  onSubmit: (data: Partial<MenuItem>) => void;
  isPending: boolean;
  allMenus: MenuItem[];
}) {
  const [form, setForm] = React.useState<MenuFormData>(initial ?? EMPTY_FORM);

  React.useEffect(() => {
    if (open) setForm(initial ?? EMPTY_FORM);
  }, [open, initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.nameTh || !form.nameEn) return;

    // Map frontend menuType → backend menuType (MENU → SUB).
    // The backend's enum is MAIN | SUB; the frontend exposes MAIN | MENU | BUTTON
    // so admins can pick a non-routing "action" type in the UI.
    const backendMenuType =
      form.menuType === "MENU" ? "SUB" : form.menuType;

    // Strip fields the backend rejects for the current mode.
    const payload: Partial<MenuItem> = {
      code: form.code,
      nameTh: form.nameTh,
      nameEn: form.nameEn,
      parentId: form.parentId,
      menuType: backendMenuType as unknown as MenuItem["menuType"],
      path: form.path || null,
      icon: form.icon || null,
      sortOrder: form.sortOrder,
    };
    if (mode === "update") {
      payload.isVisible = form.isVisible;
      payload.isActive = form.isActive;
    }
    onSubmit(payload);
  };

  const codeId = React.useId();
  const sortOrderId = React.useId();
  const nameThId = React.useId();
  const nameEnId = React.useId();
  const menuTypeId = React.useId();
  const parentIdField = React.useId();
  const pathId = React.useId();
  const iconId = React.useId();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            กรอกข้อมูลเมนู — <code className="font-mono">nameEn</code> ต้องไม่ว่าง
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Code *" htmlFor={codeId}>
              <Input
                id={codeId}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="MENU_CODE"
                required
              />
            </Field>
            <Field label="Sort order" htmlFor={sortOrderId}>
              <Input
                id={sortOrderId}
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: Number(e.target.value) || 0 })
                }
              />
            </Field>
          </div>
          <Field label="ชื่อ (ไทย) *" htmlFor={nameThId}>
            <Input
              id={nameThId}
              value={form.nameTh}
              onChange={(e) => setForm({ ...form, nameTh: e.target.value })}
              placeholder="จัดการอะไหล่"
              required
            />
          </Field>
          <Field label="ชื่อ (English) *" htmlFor={nameEnId}>
            <Input
              id={nameEnId}
              value={form.nameEn}
              onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
              placeholder="Materials Management"
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Menu type" htmlFor={menuTypeId}>
              <Select
                value={form.menuType}
                onValueChange={(v) => setForm({ ...form, menuType: v as MenuFormData["menuType"] })}
              >
                <SelectTrigger id={menuTypeId} className="w-full">
                  <SelectValue className="truncate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAIN">MAIN — เมนูหลัก (top-level)</SelectItem>
                  <SelectItem value="MENU">MENU — เมนูย่อย (child)</SelectItem>
                  <SelectItem value="BUTTON">BUTTON — ปุ่ม action</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Parent" htmlFor={parentIdField}>
              <Select
                value={form.parentId ?? "_root"}
                onValueChange={(v) =>
                  setForm({ ...form, parentId: v === "_root" ? null : v })
                }
              >
                <SelectTrigger id={parentIdField} className="w-full">
                  <SelectValue className="truncate" placeholder="เลือกเมนูหลัก..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_root">(ไม่มี — top level)</SelectItem>
                  {allMenus
                    .filter((m) => m.menuType !== "MENU")
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nameTh} ({m.code})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Path" htmlFor={pathId}>
              <Input
                id={pathId}
                value={form.path}
                onChange={(e) => setForm({ ...form, path: e.target.value })}
                placeholder="/example"
              />
            </Field>
            <Field label="Icon" htmlFor={iconId}>
              <IconPicker
                id={iconId}
                value={form.icon}
                onChange={(v) => setForm({ ...form, icon: v })}
                placeholder="เลือก icon..."
              />
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.isVisible}
                onCheckedChange={(v) => setForm({ ...form, isVisible: v })}
              />
              แสดงใน Sidebar
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
              เปิดใช้งาน
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.openInNewTab}
                onCheckedChange={(v) => setForm({ ...form, openInNewTab: v })}
              />
              เปิดแท็บใหม่
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isPending}>
              <Save className="h-4 w-4" />
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

// ---------- helpers ----------

function menuToForm(m: MenuItem): MenuFormData {
  // Normalize menuType: backend uses "SUB", frontend uses "MENU"
  const rawType = m.menuType as unknown as string;
  const menuType: MenuFormData["menuType"] =
    rawType === "SUB" ? "MENU" : (rawType as MenuFormData["menuType"]);

  // parentId: backend may use parent.id (list) or parentId (detail) — fallback
  const parentId = m.parentId ?? m.parent?.id ?? null;

  return {
    code: m.code,
    nameTh: m.nameTh,
    nameEn: m.nameEn,
    parentId,
    menuType,
    path: m.path ?? "",
    icon: m.icon ?? "",
    sortOrder: m.sortOrder,
    isVisible: m.isVisible,
    isActive: m.isActive,
    openInNewTab: m.openInNewTab ?? false,
    externalUrl: m.externalUrl ?? "",
    description: m.description ?? "",
  };
}
