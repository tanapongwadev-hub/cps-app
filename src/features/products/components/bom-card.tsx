"use client";

import * as React from "react";
import { Plus, Star, ToggleLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProductBom } from "@/features/products/api/products-api";

export function BomCard({
  bom,
  label,
  labelClass,
  onEdit,
  onAddItem,
  onRemoveItem,
  onActivate,
  onDeactivate,
  onDelete,
  canEdit,
  canActivate,
  canDeactivate,
  canDelete,
  isUpdating,
}: {
  bom: ProductBom;
  label: string;
  labelClass: "success" | "secondary" | "warning";
  onEdit?: () => void;
  onAddItem?: () => void;
  onRemoveItem?: (bomId: string, itemId: string) => void;
  onActivate?: ((id: string) => void) | null;
  onDeactivate?: ((id: string) => void) | null;
  onDelete?: ((id: string) => void) | null;
  canEdit?: string | boolean;
  canActivate?: string | boolean;
  canDeactivate?: string | boolean;
  canDelete?: string | boolean;
  isUpdating: boolean;
}) {
  const [expanded, setExpanded] = React.useState(true);
  const canAct = (perm: string | boolean | undefined) =>
    perm === true || (typeof perm === "string" && perm.length > 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Badge variant={labelClass as "success" | "secondary" | "warning"}>{label}</Badge>
            <CardTitle className="text-base">{bom.version}</CardTitle>
            {bom.specification && (
              <span className="text-muted-foreground text-sm">{bom.specification}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {canAct(canEdit) && onAddItem && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAddItem}
                disabled={isUpdating}
                className="gap-1.5 text-xs h-7"
              >
                <Plus className="size-3" />
                เพิ่มวัตถุดิบ
              </Button>
            )}
            {canAct(canActivate) && onActivate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onActivate!(bom.id)}
                disabled={isUpdating}
                className="gap-1.5 text-xs h-7 text-success border-success/30 hover:bg-success/10"
              >
                <Star className="size-3" />
                เปิดใช้งาน
              </Button>
            )}
            {canAct(canDeactivate) && onDeactivate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDeactivate!(bom.id)}
                disabled={isUpdating}
                className="gap-1.5 text-xs h-7 text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <ToggleLeft className="size-3" />
                ปิดใช้งาน
              </Button>
            )}
            {canAct(canEdit) && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                disabled={isUpdating}
                className="h-7 text-xs"
              >
                แก้ไข BOM
              </Button>
            )}
            {canAct(canDelete) && onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete!(bom.id)}
                disabled={isUpdating}
                aria-label={`ลบ BOM ${bom.version}`}
                className="text-destructive h-7 w-7"
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((e) => !e)}
              aria-expanded={expanded}
              aria-controls={`bom-items-${bom.id}`}
              className="h-7 px-2 text-xs"
            >
              {expanded ? "ซ่อน" : "แสดง"}
            </Button>
          </div>
        </div>
        {bom.remark && (
          <p className="text-muted-foreground mt-1 text-xs">{bom.remark}</p>
        )}
        {bom.effectiveFrom && (
          <p className="text-muted-foreground text-xs">
            มีผลตั้งแต่: {new Date(bom.effectiveFrom).toLocaleDateString("th-TH")}
            {bom.effectiveTo && ` — ${new Date(bom.effectiveTo).toLocaleDateString("th-TH")}`}
          </p>
        )}
      </CardHeader>

      {expanded && (
        <CardContent id={`bom-items-${bom.id}`}>
          {bom.items.length === 0 ? (
            <p className="text-muted-foreground py-4 text-sm text-center">
              ยังไม่มีวัตถุดิบ — คลิก &quot;เพิ่มวัตถุดิบ&quot; เพื่อเพิ่มรายการ
            </p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 text-left">
                    <th className="p-2 font-medium w-10">#</th>
                    <th className="p-2 font-medium">รหัสวัตถุดิบ</th>
                    <th className="p-2 font-medium">ชื่อวัตถุดิบ</th>
                    <th className="p-2 font-medium text-right">จำนวน</th>
                    <th className="p-2 font-medium">หน่วย</th>
                    <th className="p-2 font-medium text-right">% ของเสีย</th>
                    <th className="p-2 font-medium w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {bom.items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-2 text-muted-foreground">{item.sortOrder}</td>
                      <td className="p-2 font-mono text-xs">{item.materialCode}</td>
                      <td className="p-2">
                        {item.materialName}
                        {item.isScrap && (
                          <Badge variant="warning" className="ml-2 text-[9px]">ของเสีย</Badge>
                        )}
                      </td>
                      <td className="p-2 text-right font-mono">{item.quantity.toFixed(4)}</td>
                      <td className="p-2 text-muted-foreground">{item.unitNameTh}</td>
                      <td className="p-2 text-right text-muted-foreground">
                        {item.wastagePercent != null ? `${item.wastagePercent}%` : "—"}
                      </td>
                      <td className="p-2">
                        {canAct(canEdit) && onRemoveItem && bom.status !== "ACTIVE" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRemoveItem!(bom.id, item.id)}
                            aria-label={`ลบ ${item.materialCode}`}
                            className="text-destructive size-6"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
