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
import { Plus, Pencil, Trash2, GripVertical, ArrowUp, ArrowDown, ArrowRight, ArrowLeft } from "lucide-react";
import { PageHeader, PageContainer, PageFooter } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/forms/confirm-dialog";
import {
  useMenusList,
  useCreateMenu,
  useUpdateMenu,
  useDeleteMenu,
  useReorderMenus,
} from "@/features/menus/hooks/use-menus";
import type { MenuItem } from "@/features/menus/types";
import { MenuFormDialog, EMPTY_MENU_FORM, menuToForm } from "@/features/menus/components/menu-form-dialog";
import { MenuTreeRow, type MenuRow, type DropPosition } from "@/features/menus/components/menu-tree-row";

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
  const [overPosition, setOverPosition] = React.useState<DropPosition>(null);

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

  const handleDragStart = (menuId: string) => {
    setDraggedId(menuId);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setOverRowId(null);
    setOverPosition(null);
  };

  const handleRowDragOver = (e: React.DragEvent, row: MenuRow) => {
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
              ยังไม่มีเมนูในระบบ — คลิก &quot;เพิ่มเมนู&quot; เพื่อเริ่มต้น
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
                  <MenuTreeRow
                    key={m.id}
                    row={row}
                    isFirst={isFirst}
                    isLast={isLast}
                    canIndent={canIndent}
                    canOutdent={canOutdent}
                    isDragged={draggedId === m.id}
                    overPosition={overRowId === m.id ? overPosition : null}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/menu-id", m.id);
                      e.dataTransfer.effectAllowed = "move";
                      handleDragStart(m.id);
                    }}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleRowDragOver(e, row)}
                    onDrop={(e) => handleRowDrop(e, row)}
                    onToggleVisible={() => handleInlineUpdate(m.id, { isVisible: !m.isVisible })}
                    onToggleActive={() => handleInlineUpdate(m.id, { isActive: !m.isActive })}
                    onMoveUp={() => moveUp(m.id)}
                    onMoveDown={() => moveDown(m.id)}
                    onIndent={() => indent(m.id)}
                    onOutdent={() => outdent(m.id)}
                    onAddChild={() => setCreatingChildOf(m)}
                    onEdit={() => setEditing(m)}
                    onDelete={() => setPendingDelete(m)}
                  />
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
        initial={creatingChildOf ? { ...EMPTY_MENU_FORM, parentId: creatingChildOf.id, menuType: "MENU" } : null}
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
                  <span aria-hidden="true">⚠️</span> เมนูนี้มีเมนูย่อย {childrenMap.get(pendingDelete.id)?.length} รายการ — ต้องลบเมนูย่อยก่อน
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
