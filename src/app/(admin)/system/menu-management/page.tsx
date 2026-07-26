/**
 * Menu management page
 *
 * Features:
 *   - Tree view (from GET /menus/tree)
 *   - Drag-drop reorder (HTML5 DnD, posts to /menus/reorder or PATCHes each)
 *   - Create new menu (modal form)
 *   - Edit menu (modal form)
 *   - Delete with confirm
 *   - Inline toggle: isVisible, isActive
 */
"use client";

import * as React from "react";
import {
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Menu as MenuIcon,
  ExternalLink,
  EyeOff,
  Eye,
  GripVertical,
  Folder,
  FolderOpen,
  Power,
  PowerOff,
  Save,
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
import type { MenuItem, MenuFormData } from "@/types/menu";
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

export default function MenuManagementPage() {
  // Use the LIST endpoint (not /tree) so we can see menus that have been
  // hidden or deactivated — the real /menus/tree endpoint filters out
  // isVisible=false, which would make them impossible to unhide.
  const { data: listData, isLoading, isError, error } = useMenusList();
  const createMenu = useCreateMenu();
  const updateMenu = useUpdateMenu();
  const deleteMenu = useDeleteMenu();
  const reorderMenus = useReorderMenus();

  const flatMenus = React.useMemo<MenuItem[]>(
    () => (listData?.items ?? []) as MenuItem[],
    [listData],
  );

  // Build a tree from the flat list so the UI still shows parent/child
  // hierarchy. The /menus (list) endpoint returns `parentId` as undefined
  // for children — fall back to `parent.id` in that case. Items whose
  // parent isn't in the list (e.g. deleted parent) are treated as roots.
  // Sort each level by sortOrder so the tree matches the backend tree.
  const tree = React.useMemo<MenuItem[]>(() => {
    const sorted = [...flatMenus].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const map = new Map<string, MenuItem>();
    for (const m of sorted) map.set(m.id, { ...m, children: [] });
    const roots: MenuItem[] = [];
    for (const m of sorted) {
      const node = map.get(m.id);
      if (!node) continue;
      const parentId = m.parentId ?? m.parent?.id ?? null;
      if (parentId && map.has(parentId)) {
        map.get(parentId)!.children!.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }, [flatMenus]);

  const [editing, setEditing] = React.useState<MenuItem | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<MenuItem | null>(null);
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set());

  // Auto-expand top-level on first load
  React.useEffect(() => {
    if (tree && tree.length > 0 && expanded.size === 0) {
      setExpanded(new Set(tree.map((m) => m.id)));
    }
  }, [tree, expanded.size]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Flatten the tree for drag-drop tracking
  // (flatMenus is declared above from useMenusList — same data, no need to re-flatten)

  const handleReorder = async (draggedId: string, targetId: string, position: "before" | "after" | "inside") => {
    if (!tree) return;
    const target = findInTree(tree, targetId);
    if (!target) return;
    let newSort = target.sortOrder;
    let newParent: string | null = target.parentId ?? null;
    if (position === "inside") {
      newSort = 0; // first child
      newParent = target.id;
    } else if (position === "before") {
      newSort = target.sortOrder - 1;
    } else {
      newSort = target.sortOrder + 1;
    }
    reorderMenus.mutate([{ id: draggedId, sortOrder: newSort, parentId: newParent }]);
  };

  const handleInlineUpdate = (id: string, patch: Partial<MenuItem>) => {
    updateMenu.mutate({ id, data: patch });
  };

  return (
    <>
      <PageContainer>
        <PageHeader
          title="จัดการเมนู"
          description="จัดการโครงสร้างเมนูในระบบ — ลากเพื่อเรียงลำดับ, คลิกเพื่อแก้ไข"
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

        <Card className="p-2">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : isError ? (
            <div className="m-4 rounded-md border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
              <p className="font-medium">โหลดเมนูไม่สำเร็จ</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {error instanceof Error ? error.message : "Unknown error"}
              </p>
            </div>
          ) : !tree || tree.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              ยังไม่มีเมนูในระบบ
            </div>
          ) : (
            <ul className="space-y-1">
              {tree.map((menu) => (
                <MenuNode
                  key={menu.id}
                  menu={menu}
                  level={0}
                  expanded={expanded}
                  onToggle={toggleExpand}
                  onEdit={setEditing}
                  onDelete={setPendingDelete}
                  onReorder={handleReorder}
                  onInlineUpdate={handleInlineUpdate}
                  allMenus={flatMenus}
                />
              ))}
            </ul>
          )}
        </Card>
      </PageContainer>
      <PageFooter />

      {/* Create dialog */}
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
              {pendingDelete.children && pendingDelete.children.length > 0 && (
                <span className="mt-2 block text-danger">
                  ⚠️ เมนูนี้มีเมนูย่อย {pendingDelete.children.length} รายการ — ต้องลบเมนูย่อยก่อน
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

// ---------- Tree node (recursive) ----------

function MenuNode({
  menu,
  level,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onReorder,
  onInlineUpdate,
  allMenus,
}: {
  menu: MenuItem;
  level: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onEdit: (m: MenuItem) => void;
  onDelete: (m: MenuItem) => void;
  onReorder: (draggedId: string, targetId: string, position: "before" | "after" | "inside") => void;
  onInlineUpdate: (id: string, patch: Partial<MenuItem>) => void;
  allMenus: MenuItem[];
}) {
  const children = menu.children ?? [];
  const hasChildren = children.length > 0;
  const isOpen = expanded.has(menu.id);

  // Drag-drop handlers
  const [dragOver, setDragOver] = React.useState<"before" | "after" | "inside" | null>(null);

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/menu-id", menu.id);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragEnd = () => setDragOver(null);
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    if (offsetY < rect.height * 0.25) setDragOver("before");
    else if (offsetY > rect.height * 0.75) setDragOver("after");
    else setDragOver("inside");
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/menu-id");
    if (!draggedId || draggedId === menu.id || !dragOver) return;
    onReorder(draggedId, menu.id, dragOver);
    setDragOver(null);
  };

  return (
    <>
      <li
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={cn(
          "group flex items-center gap-2 rounded-md px-2 py-2 transition-colors",
          "hover:bg-accent/30",
          !menu.isActive && "opacity-50",
          !menu.isVisible && "opacity-60",
          dragOver === "inside" && "bg-accent/60 ring-2 ring-primary/50",
          dragOver === "before" && "border-t-2 border-primary",
          dragOver === "after" && "border-b-2 border-primary",
        )}
        style={{ marginLeft: level * 24 }}
      >
        <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-muted-foreground/40" />
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(menu.id)}
            className="text-muted-foreground"
          >
            <ChevronRight
              className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-90")}
            />
          </button>
        ) : (
          <span className="w-3.5" />
        )}

        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {hasChildren ? (
            isOpen ? <FolderOpen className="h-3.5 w-3.5" /> : <Folder className="h-3.5 w-3.5" />
          ) : (
            <MenuIcon className="h-3.5 w-3.5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-sm font-medium">{menu.nameTh}</p>
            <code className="text-[10px] text-muted-foreground">{menu.code}</code>
            {menu.nameEn && (
              <span className="text-[10px] text-muted-foreground">· {menu.nameEn}</span>
            )}
            {menu.menuType === "MENU" && (
              <Badge variant="info" className="text-[10px]">
                Sub
              </Badge>
            )}
            {menu.menuType === "BUTTON" && (
              <Badge variant="warning" className="text-[10px]">
                Action
              </Badge>
            )}
            {!menu.isVisible && (
              <Badge variant="muted" className="gap-1 text-[10px]">
                <EyeOff className="h-2.5 w-2.5" />
                ซ่อน
              </Badge>
            )}
            {!menu.isActive && (
              <Badge variant="muted" className="gap-1 text-[10px]">
                <PowerOff className="h-2.5 w-2.5" />
                ระงับ
              </Badge>
            )}
            {menu.openInNewTab && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
          </div>
          {menu.path && (
            <p className="truncate text-xs text-muted-foreground">{menu.path}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title={menu.isVisible ? "ซ่อนจาก Sidebar" : "แสดงใน Sidebar"}
            onClick={(e) => {
              e.stopPropagation();
              onInlineUpdate(menu.id, { isVisible: !menu.isVisible });
            }}
          >
            {menu.isVisible ? (
              <Eye className="h-3.5 w-3.5" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title={menu.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
            onClick={(e) => {
              e.stopPropagation();
              onInlineUpdate(menu.id, { isActive: !menu.isActive });
            }}
          >
            {menu.isActive ? (
              <Power className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <PowerOff className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(menu)}
            title="แก้ไข"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-danger hover:bg-danger/10"
            onClick={() => onDelete(menu)}
            title="ลบ"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </li>
      {isOpen &&
        children.map((c) => (
          <MenuNode
            key={c.id}
            menu={c}
            level={level + 1}
            expanded={expanded}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            onReorder={onReorder}
            onInlineUpdate={onInlineUpdate}
            allMenus={allMenus}
          />
        ))}
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

    // Strip fields the backend rejects for the current mode.
    //   POST /menus   — rejects: isVisible, isActive, openInNewTab, externalUrl,
    //                            description, name
    //   PATCH /menus/:id — rejects: openInNewTab, externalUrl, description, name
    // The form's `openInNewTab / externalUrl / description` are still rendered
    // (so the user can see/edit them) but we never send them — the backend
    // doesn't support these fields yet.
    const payload: Partial<MenuItem> = {
      code: form.code,
      nameTh: form.nameTh,
      nameEn: form.nameEn,
      parentId: form.parentId,
      menuType: form.menuType,
      path: form.path || null,
      icon: form.icon || null,
      sortOrder: form.sortOrder,
    };
    if (mode === "update") {
      // PATCH /menus/:id also accepts the toggle fields
      payload.isVisible = form.isVisible;
      payload.isActive = form.isActive;
    }
    // Note: `openInNewTab`, `externalUrl`, `description` are intentionally
    // omitted — the real NestJS backend returns 400 if we send them.
    onSubmit(payload);
  };

  // Stable IDs for the form fields. Used by the <Label htmlFor> association so
  // tests can `getByLabel("Code *")` and screen readers announce the label.
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
                <SelectTrigger id={menuTypeId}>
                  <SelectValue />
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
                <SelectTrigger id={parentIdField}>
                  <SelectValue />
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
  return {
    code: m.code,
    nameTh: m.nameTh,
    nameEn: m.nameEn,
    parentId: m.parentId ?? null,
    menuType: m.menuType,
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

function flattenTree(tree: MenuItem[]): MenuItem[] {
  const out: MenuItem[] = [];
  const walk = (items: MenuItem[]) => {
    for (const item of items) {
      out.push(item);
      if (item.children?.length) walk(item.children);
    }
  };
  walk(tree);
  return out;
}

function findInTree(tree: MenuItem[], id: string): MenuItem | null {
  for (const item of tree) {
    if (item.id === id) return item;
    if (item.children?.length) {
      const found = findInTree(item.children, id);
      if (found) return found;
    }
  }
  return null;
}
