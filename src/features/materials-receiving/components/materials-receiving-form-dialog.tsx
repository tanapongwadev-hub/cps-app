"use client";

/**
 * Materials Receiving Form Dialog - Redesigned
 * 
 * Key improvements:
 * - Two-column layout: Form on left, Live Preview on right
 * - Card-based sections with clear visual hierarchy
 * - Live preview updates as user fills in data
 * - Accordion sections for better organization
 * - Clear action buttons at bottom
 */

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Boxes,
  Calendar,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Factory,
  FileText,
  Info,
  Package,
  QrCode,
  Save,
  Scissors,
  Truck,
  Upload,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/utils/cn";
import type {
  CreateMaterialsReceivingPayload,
  MaterialsReceiving,
  MaterialsReceivingLookups,
  MaterialsReceivingMaterialShape,
  MaterialsReceivingSupplier,
  UpdateMaterialsReceivingPayload,
} from "../api/materials-receiving-api";
import { materialsReceivingApi } from "../api/materials-receiving-api";

// ============================================================================
// Constants
// ============================================================================

const DECIMAL_REGEX = /^\d+(\.\d{1,4})?$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const PO_NO_REGEX = /^[A-Za-z0-9_/ \-]{1,30}$/;

const SHAPES_REQUIRING_RATIO: ReadonlySet<MaterialsReceivingMaterialShape> = new Set([
  "PIPE",
  "SHEET",
  "COIL",
]);

function materialShapeRequiresRatio(shape: MaterialsReceivingMaterialShape | null): boolean {
  if (!shape) return false;
  return SHAPES_REQUIRING_RATIO.has(shape);
}

// ============================================================================
// Helpers
// ============================================================================

function previewInternalLotNo(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `CCI-${yyyy}${mm}${dd}-???`;
}

function previewRunNo(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `MR-${yyyy}${mm}${dd}-????`;
}

function computePackageCount(
  receiveQuantity: string,
  packingQuantity: number | null | undefined,
): number | null {
  if (!packingQuantity || packingQuantity < 1) return null;
  const qty = Number(receiveQuantity);
  if (!Number.isFinite(qty) || qty <= 0) return null;
  return Math.ceil(qty / packingQuantity);
}

function previewPackages(
  receiveQuantity: string,
  packingQuantity: number | null | undefined,
): { packageNo: number; quantity: number }[] | null {
  const count = computePackageCount(receiveQuantity, packingQuantity);
  if (count === null) return null;
  const qty = Number(receiveQuantity);
  const fullQty = packingQuantity as number;
  const packages: { packageNo: number; quantity: number }[] = [];
  let remaining = qty;
  for (let i = 1; i <= count; i += 1) {
    const value = i === count ? remaining : Math.min(fullQty, remaining);
    packages.push({ packageNo: i, quantity: value });
    remaining -= value;
  }
  return packages;
}

function computePiecesQuantity(
  receiveQuantity: string,
  shape: MaterialsReceivingMaterialShape | null,
  ratio: number | null | undefined,
): number | null {
  if (!materialShapeRequiresRatio(shape)) return null;
  if (!ratio || ratio < 1) return null;
  const qty = Number(receiveQuantity);
  if (!Number.isFinite(qty) || qty <= 0) return null;
  return qty * ratio;
}

function formatNumber(value: string | number): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  });
}

/** สร้าง QR Code URL จาก text */
function getQrCodeUrl(text: string, size: number = 100): string {
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&format=png`;
}

/** สร้าง date prefix สำหรับ Lot numbers */
function getDatePrefix(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

/** Preview ชุดที่ 1: Internal Lot Numbers (CCI-YYYYMMDD-NNN) */
function previewLotNumbers(count: number | null): string[] {
  if (!count || count < 1) return [];
  const prefix = getDatePrefix();
  return Array.from({ length: count }, (_, i) =>
    `CCI-${prefix}-${String(i + 1).padStart(3, "0")}`
  );
}

/** Preview ชุดที่ 2: Pieces Lot Numbers (CCI-YYYYMMDD-NNN-NNN) */
function previewPiecesLotNumbers(
  piecesQuantity: number | null,
  ratio: number | null
): { lotNo: string; pkg: number; piece: number }[] {
  if (!piecesQuantity || piecesQuantity < 1 || !ratio || ratio < 1) return [];
  const prefix = getDatePrefix();
  const result: { lotNo: string; pkg: number; piece: number }[] = [];

  for (let p = 1; p <= piecesQuantity; p++) {
    const pkg = Math.ceil(p / ratio);
    const pieceInPkg = p - (pkg - 1) * ratio;
    result.push({
      lotNo: `CCI-${prefix}-${String(pkg).padStart(3, "0")}-${String(pieceInPkg).padStart(3, "0")}`,
      pkg,
      piece: pieceInPkg,
    });
  }
  return result;
}

// ============================================================================
// Schema
// ============================================================================

const formSchema = z
  .object({
    materialId: z.string().min(1, "กรุณาเลือกวัสดุ"),
    materialTypeOverride: z
      .enum(["PCS", "PIPE", "SHEET", "COIL"])
      .optional()
      .nullable(),
    supplierId: z.string().optional(),
    receiveQuantity: z
      .string()
      .min(1, "กรุณากรอกจำนวนรับเข้า")
      .regex(DECIMAL_REGEX, "ต้องเป็นตัวเลขทศนิยมไม่เกิน 4 ตำแหน่ง"),
    poNo: z
      .string()
      .max(30, "เลขที่ PO ยาวเกิน 30 ตัวอักษร")
      .regex(PO_NO_REGEX, "รูปแบบเลขที่ PO ไม่ถูกต้อง")
      .optional()
      .or(z.literal("")),
    supplierProductionDate: z
      .string()
      .min(1, "กรุณาเลือกวันที่ผลิตของ Supplier")
      .regex(ISO_DATE, "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)"),
    receiveDate: z
      .string()
      .min(1, "กรุณาเลือกวันที่รับเข้า")
      .regex(ISO_DATE, "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)"),
    ratioOverride: z
      .string()
      .regex(DECIMAL_REGEX, "ชิ้นต่อเส้นต้องเป็นจำนวนเต็มบวก")
      .optional()
      .or(z.literal("")),
    packingQuantityOverride: z
      .string()
      .regex(DECIMAL_REGEX, "ต้องเป็นจำนวนเต็มบวก")
      .optional()
      .or(z.literal("")),
    remark: z.string().optional(),
    attachmentUrl: z.string().optional(),
    attachmentName: z.string().optional(),
  });

type FormValues = z.infer<typeof formSchema>;

function getDefaultValues(receiving: MaterialsReceiving | null | undefined): FormValues {
  if (receiving) {
    return {
      materialId: receiving.materialId,
      materialTypeOverride: receiving.materialType ?? null,
      supplierId: receiving.supplierId,
      receiveQuantity: receiving.receiveQuantity,
      poNo: receiving.poNo ?? "",
      supplierProductionDate: receiving.supplierProductionDate ?? "",
      receiveDate: receiving.receiveDate,
      ratioOverride: "",
      packingQuantityOverride: "",
      remark: receiving.remark ?? "",
      attachmentUrl: receiving.attachmentUrl ?? "",
      attachmentName: receiving.attachmentName ?? "",
    };
  }
  const today = new Date().toISOString().slice(0, 10);
  return {
    materialId: "",
    materialTypeOverride: null,
    supplierId: "",
    receiveQuantity: "",
    poNo: "",
    supplierProductionDate: today,
    receiveDate: today,
    ratioOverride: "",
    packingQuantityOverride: "",
    remark: "",
    attachmentUrl: "",
    attachmentName: "",
  };
}

// ============================================================================
// Accordion Component
// ============================================================================

interface AccordionSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

function AccordionSection({
  title,
  icon,
  children,
  defaultOpen = true,
  className,
}: AccordionSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className={cn("rounded-lg border bg-card", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <span className="text-primary">{icon}</span>
          <span className="font-medium">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && <div className="p-4 pt-0">{children}</div>}
    </div>
  );
}

// ============================================================================
// Pieces QR Preview Grid Component
// ============================================================================

function PiecesQrPreviewGrid({
  items,
  totalPieces,
}: {
  items: { lotNo: string; pkg: number; piece: number }[];
  totalPieces: number | null;
}) {
  const [showAll, setShowAll] = React.useState(false);
  const INITIAL_SHOW = 20;
  const visible = showAll ? items : items.slice(0, INITIAL_SHOW);
  const hidden = items.length - INITIAL_SHOW;

  if (items.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground italic">
          กรอกจำนวนรับเข้าเพื่อดู QR Codes
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
        {visible.map((item, i) => (
          <div key={i} className="flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getQrCodeUrl(item.lotNo, 50)}
              alt={item.lotNo}
              className="w-12 h-12 rounded border bg-white"
            />
            <span className="font-mono text-[9px] mt-1 text-center truncate w-full">
              {item.lotNo.split("-").slice(-2).join("-")}
            </span>
          </div>
        ))}
      </div>
      {!showAll && hidden > 0 && (
        <button
          type="button"
          className="mt-2 w-full text-xs text-primary hover:underline"
          onClick={() => setShowAll(true)}
        >
          แสดงทั้งหมด ({items.length} รายการ)
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Preview Card Component
// ============================================================================

interface PreviewCardProps {
  children: React.ReactNode;
  className?: string;
}

function PreviewCard({ children, className }: PreviewCardProps) {
  return (
    <div className={cn("rounded-lg border border-dashed border-info/30 bg-info/5 p-4", className)}>
      {children}
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export interface MaterialsReceivingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiving?: MaterialsReceiving | null;
  lookups: MaterialsReceivingLookups;
  onSave: (
    payload: CreateMaterialsReceivingPayload | UpdateMaterialsReceivingPayload,
  ) => Promise<void>;
  savePending?: boolean;
  onUploadAttachment?: (file: File) => Promise<{ url: string; name: string }>;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "ไม่สามารถบันทึกได้ กรุณาลองใหม่อีกครั้ง";
}

export function MaterialsReceivingFormDialog({
  open,
  onOpenChange,
  receiving,
  lookups,
  onSave,
  savePending,
  onUploadAttachment,
}: MaterialsReceivingFormDialogProps) {
  const isEditing = !!receiving;
  const [serverError, setServerError] = React.useState<string | null>(null);

  const [materialSuppliers, setMaterialSuppliers] = React.useState<
    MaterialsReceivingSupplier[]
  >([]);
  const [suppliersLoading, setSuppliersLoading] = React.useState(false);
  const autoSelectedSupplier = React.useRef(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(receiving),
  });

  const editSupplier = isEditing
    ? (lookups.suppliers.find((supplier) => supplier.id === receiving?.supplierId) ??
      receiving?.supplier ??
      null)
    : null;

  // Reset form when dialog opens
  React.useEffect(() => {
    if (!open) return;

    if (isEditing && receiving?.materialId) {
      setMaterialSuppliers(editSupplier ? [editSupplier] : []);
      setSuppliersLoading(true);
    } else {
      setMaterialSuppliers([]);
      setSuppliersLoading(false);
    }

    form.reset(getDefaultValues(receiving));
    setServerError(null);
    autoSelectedSupplier.current = false;
  }, [open, receiving, form, isEditing, editSupplier]);

  const watchMaterialId = form.watch("materialId");
  const watchQuantity = form.watch("receiveQuantity");
  const watchRatioOverride = form.watch("ratioOverride");
  const watchPackingOverride = form.watch("packingQuantityOverride");
  const watchProductionDate = form.watch("supplierProductionDate");
  const watchPoNo = form.watch("poNo");

  // Fetch suppliers when material changes
  React.useEffect(() => {
    if (isEditing) return;
    if (!watchMaterialId) {
      setMaterialSuppliers([]);
      setSuppliersLoading(false);
      return;
    }
    let cancelled = false;
    setSuppliersLoading(true);
    materialsReceivingApi
      .getSuppliersByMaterial(watchMaterialId)
      .then((list) => {
        if (cancelled) return;
        const suppliers = list ?? [];
        setMaterialSuppliers(suppliers);
        const only = suppliers[0];
        if (suppliers.length === 1 && only && !autoSelectedSupplier.current) {
          form.setValue("supplierId", only.id, { shouldValidate: false });
          autoSelectedSupplier.current = true;
        }
      })
      .catch(() => {
        if (!cancelled) setMaterialSuppliers([]);
      })
      .finally(() => {
        if (!cancelled) setSuppliersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [watchMaterialId, isEditing, form]);

  // Sync supplierId when a material has no linked suppliers
  React.useEffect(() => {
    if (isEditing || !watchMaterialId) return;
    if (materialSuppliers.length > 0) return;
    const current = form.getValues("supplierId");
    if (current && current !== "") {
      form.setValue("supplierId", "", { shouldValidate: false });
    }
  }, [watchMaterialId, materialSuppliers, isEditing, form]);

  // Computed values for preview
  const selectedMaterial = React.useMemo(
    () => lookups.materials.find((m) => m.id === watchMaterialId) ?? null,
    [lookups.materials, watchMaterialId],
  );

  // Set default Ratio & Packing when material changes
  React.useEffect(() => {
    if (isEditing) return;
    if (!watchMaterialId || !selectedMaterial) {
      form.setValue("ratioOverride", "", { shouldValidate: false });
      form.setValue("packingQuantityOverride", "", { shouldValidate: false });
      return;
    }
    // Set default values from material
    if (selectedMaterial.ratio) {
      form.setValue("ratioOverride", selectedMaterial.ratio.toString(), { shouldValidate: false });
    }
    if (selectedMaterial.packingQuantity) {
      form.setValue("packingQuantityOverride", selectedMaterial.packingQuantity.toString(), { shouldValidate: false });
    }
  }, [watchMaterialId, selectedMaterial, isEditing, form]);

  const selectedSupplier = React.useMemo(
    () =>
      materialSuppliers.find((s) => s.id === form.getValues("supplierId")) ?? null,
    [materialSuppliers, form],
  );

  const effectivePackingQuantity = React.useMemo(() => {
    const override = Number(watchPackingOverride);
    if (Number.isFinite(override) && override >= 1) {
      return Math.floor(override);
    }
    if (selectedMaterial?.packingQuantity && selectedMaterial.packingQuantity >= 1) {
      return selectedMaterial.packingQuantity;
    }
    return null;
  }, [watchPackingOverride, selectedMaterial]);

  const effectiveRatio = React.useMemo(() => {
    const override = Number(watchRatioOverride);
    if (Number.isFinite(override) && override >= 1) {
      return Math.floor(override);
    }
    if (selectedMaterial?.ratio && selectedMaterial.ratio >= 1) {
      return selectedMaterial.ratio;
    }
    return null;
  }, [watchRatioOverride, selectedMaterial]);

  const watchMaterialTypeOverride = form.watch("materialTypeOverride");

  const requiresRatio = materialShapeRequiresRatio(
    watchMaterialTypeOverride ?? selectedMaterial?.materialType ?? null,
  );

  const packages = React.useMemo(
    () => previewPackages(watchQuantity, effectivePackingQuantity),
    [watchQuantity, effectivePackingQuantity],
  );

  const packageCount = computePackageCount(watchQuantity, effectivePackingQuantity);

  // Pieces quantity calculation (must be before piecesLotNumbersPreview)
  const piecesQuantity = React.useMemo(
    () =>
      requiresRatio
        ? computePiecesQuantity(
            watchQuantity,
            watchMaterialTypeOverride ?? selectedMaterial?.materialType ?? null,
            effectiveRatio,
          )
        : null,
    [requiresRatio, watchQuantity, watchMaterialTypeOverride, selectedMaterial, effectiveRatio],
  );

  // Preview lot numbers for QR codes
  const lotNumbersPreview = React.useMemo(
    () => previewLotNumbers(packageCount),
    [packageCount],
  );

  // Preview pieces lot numbers for QR codes (set 2)
  const piecesLotNumbersPreview = React.useMemo(
    () => previewPiecesLotNumbers(piecesQuantity, effectiveRatio),
    [piecesQuantity, effectiveRatio],
  );

  const supplierLotPreview = React.useMemo(() => {
    if (!watchProductionDate || !ISO_DATE.test(watchProductionDate)) return null;
    return `SUP-${watchProductionDate.replace(/-/g, "")}`;
  }, [watchProductionDate]);

  const handleSubmit = async (values: FormValues) => {
    try {
      setServerError(null);

      const basePayload: CreateMaterialsReceivingPayload = {
        materialId: values.materialId,
        receiveQuantity: values.receiveQuantity,
        supplierProductionDate: values.supplierProductionDate,
        receiveDate: values.receiveDate,
        poNo: values.poNo || null,
        remark: values.remark || null,
      };

      if (values.supplierId) {
        basePayload.supplierId = values.supplierId;
      }

      if (values.packingQuantityOverride) {
        const override = Number(values.packingQuantityOverride);
        if (Number.isFinite(override) && override >= 1) {
          basePayload.packingQuantityOverride = Math.floor(override);
        }
      }

      if (values.ratioOverride) {
        const override = Number(values.ratioOverride);
        if (Number.isFinite(override) && override >= 1) {
          basePayload.ratioOverride = Math.floor(override);
        }
      }

      let payload: CreateMaterialsReceivingPayload | UpdateMaterialsReceivingPayload =
        basePayload;

      if (isEditing && receiving) {
        const updatePayload: UpdateMaterialsReceivingPayload = {
          supplierProductionDate: values.supplierProductionDate,
          receiveDate: values.receiveDate,
          poNo: values.poNo || null,
          remark: values.remark || null,
          updatedAt: receiving.updatedAt,
        };
        if (values.supplierId) {
          updatePayload.supplierId = values.supplierId;
        }
        if (values.receiveQuantity) {
          updatePayload.receiveQuantity = values.receiveQuantity;
        }
        if (values.packingQuantityOverride) {
          const override = Number(values.packingQuantityOverride);
          if (Number.isFinite(override) && override >= 1) {
            updatePayload.packingQuantityOverride = Math.floor(override);
          }
        }
        if (values.ratioOverride) {
          const override = Number(values.ratioOverride);
          if (Number.isFinite(override) && override >= 1) {
            updatePayload.ratioOverride = Math.floor(override);
          }
        }
        payload = updatePayload;
      }

      await onSave(payload);
      onOpenChange(false);
    } catch (err) {
      setServerError(errorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto p-0 sm:p-6">
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex h-full flex-col">
          {/* Header */}
          <DialogHeader className="border-b p-4 sm:p-6 pb-4">
            <DialogTitle>
              {isEditing
                ? `แก้ไขการรับเข้า ${receiving?.internalLotNo ?? ""}`
                : "สร้างรายการรับเข้าวัตถุดิบ"}
            </DialogTitle>
          </DialogHeader>

          {/* Body - Two Column Layout */}
          <div className="flex flex-1 flex-col lg:flex-row overflow-y-auto">
            {/* Left Column - Form Fields */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Section 1: ข้อมูลหลัก */}
              <AccordionSection
                title="ข้อมูลหลัก"
                icon={<Package className="h-4 w-4" />}
                defaultOpen={true}
              >
                <div className="space-y-4">
                  {/* Material Selection */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      วัสดุ <span className="text-danger">*</span>
                    </label>
                    <select
                      {...form.register("materialId")}
                      className={cn(
                        "w-full rounded-md border bg-background px-3 py-2 text-sm",
                        form.formState.errors.materialId
                          ? "border-danger"
                          : "border-input",
                      )}
                      disabled={isEditing}
                    >
                      <option value="">เลือกวัสดุ...</option>
                      {lookups.materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.code} — {m.name} ({m.unitId})
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.materialId && (
                      <p className="text-xs text-danger">
                        {form.formState.errors.materialId.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      รหัส ชื่อ และหน่วยคือข้อมูลหลักสำหรับค้นหาและตรวจรับ
                    </p>
                  </div>

                  {/* Material Type Override */}
                  {watchMaterialId && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">
                        ลักษณะการรับเข้า
                      </label>
                      <select
                        {...form.register("materialTypeOverride")}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">— ค่าจากวัสดุ —</option>
                        <option value="PCS">PCS (ชิ้นเดี่ยว)</option>
                        <option value="PIPE">PIPE (เหล็กเส้น)</option>
                        <option value="SHEET">SHEET (แผ่น)</option>
                        <option value="COIL">COIL (ม้วน)</option>
                      </select>
                      <p className="text-xs text-muted-foreground">
                        เลือก PIPE/SHEET/COIL เพื่อกรอกจำนวนชิ้นต่อเส้น
                      </p>
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      จำนวนรับเข้า <span className="text-danger">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        {...form.register("receiveQuantity")}
                        type="text"
                        inputMode="decimal"
                        placeholder="0.0000"
                        className={cn(
                          "flex-1 rounded-md border bg-background px-3 py-2 text-sm",
                          form.formState.errors.receiveQuantity
                            ? "border-danger"
                            : "border-input",
                        )}
                      />
                      <span className="flex items-center text-sm text-muted-foreground">
                        {selectedMaterial?.unitId
                          ? lookups.units.find((u) => u.id === selectedMaterial?.unitId)
                              ?.code ?? ""
                          : ""}
                      </span>
                    </div>
                    {form.formState.errors.receiveQuantity && (
                      <p className="text-xs text-danger">
                        {form.formState.errors.receiveQuantity.message}
                      </p>
                    )}
                  </div>

                  {/* Supplier - แสดงเมื่อเลือก material แล้ว */}
                  {watchMaterialId && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">
                        ผู้จัดจำหน่าย <span className="text-danger">*</span>
                      </label>
                      {materialSuppliers.length === 0 && !suppliersLoading ? (
                        <p className="text-xs text-danger">
                          ⚠️ วัสดุนี้ยังไม่ได้ลิงก์กับ Supplier กรุณาไปเพิ่มใน Material Master ก่อน
                        </p>
                      ) : (
                        <div className="flex items-center gap-2">
                          <select
                            {...form.register("supplierId")}
                            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            {suppliersLoading && <option value="">กำลังโหลด...</option>}
                            {materialSuppliers.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.code} — {s.nameTh}
                              </option>
                            ))}
                          </select>
                          {!suppliersLoading && materialSuppliers.length === 1 && (
                            <Badge variant="outline" className="text-xs">Auto</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </AccordionSection>

              {/* Section 2: ข้อมูลวันที่ */}
              <AccordionSection
                title="ข้อมูลวันที่"
                icon={<Calendar className="h-4 w-4" />}
                defaultOpen={true}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Receive Date */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      วันที่รับเข้า <span className="text-danger">*</span>
                    </label>
                    <input
                      {...form.register("receiveDate")}
                      type="date"
                      className={cn(
                        "w-full rounded-md border bg-background px-3 py-2 text-sm",
                        form.formState.errors.receiveDate
                          ? "border-danger"
                          : "border-input",
                      )}
                    />
                    {form.formState.errors.receiveDate && (
                      <p className="text-xs text-danger">
                        {form.formState.errors.receiveDate.message}
                      </p>
                    )}
                  </div>

                  {/* Production Date */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      วันที่ Supplier ผลิต <span className="text-danger">*</span>
                    </label>
                    <input
                      {...form.register("supplierProductionDate")}
                      type="date"
                      className={cn(
                        "w-full rounded-md border bg-background px-3 py-2 text-sm",
                        form.formState.errors.supplierProductionDate
                          ? "border-danger"
                          : "border-input",
                      )}
                    />
                    {form.formState.errors.supplierProductionDate && (
                      <p className="text-xs text-danger">
                        {form.formState.errors.supplierProductionDate.message}
                      </p>
                    )}
                  </div>
                </div>
              </AccordionSection>

              {/* Section 3: ข้อมูลเพิ่มเติม */}
              <AccordionSection
                title="ข้อมูลเพิ่มเติม"
                icon={<FileText className="h-4 w-4" />}
                defaultOpen={false}
              >
                <div className="space-y-4">
                  {/* PO Number */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      เลขที่ PO{" "}
                      <span className="text-xs text-muted-foreground">(ไม่บังคับ)</span>
                    </label>
                    <input
                      {...form.register("poNo")}
                      type="text"
                      placeholder="เช่น PO-2026-0001"
                      className={cn(
                        "w-full rounded-md border bg-background px-3 py-2 text-sm",
                        form.formState.errors.poNo ? "border-danger" : "border-input",
                      )}
                    />
                    {form.formState.errors.poNo && (
                      <p className="text-xs text-danger">
                        {form.formState.errors.poNo.message}
                      </p>
                    )}
                  </div>

                  {/* Remark */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      หมายเหตุ{" "}
                      <span className="text-xs text-muted-foreground">(ไม่บังคับ)</span>
                    </label>
                    <textarea
                      {...form.register("remark")}
                      rows={3}
                      placeholder="ระบุหมายเหตุเพิ่มเติม..."
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </AccordionSection>

              {/* Section 4: การคำนวณพิเศษ (สำหรับ PIPE/SHEET/COIL) */}
              {requiresRatio && selectedMaterial && (
                <AccordionSection
                  title="จำนวนชิ้นต่อเส้น (Ratio)"
                  icon={<Boxes className="h-4 w-4" />}
                  defaultOpen={true}
                >
                  <div className="space-y-4">
                    {/* Ratio & Packing Quantity - Editable */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium flex items-center gap-2">
                          จำนวนชิ้นต่อเส้น (Ratio)
                          {selectedMaterial.ratio && (
                            <Badge variant="outline" className="text-xs">ค่าเดิม: {selectedMaterial.ratio}</Badge>
                          )}
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          {...form.register("ratioOverride")}
                          placeholder="เช่น 6"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          ถ้าเป็นเหล็กเส้น/แผ่น/ม้วน ต้องระบุจำนวนชิ้นต่อเส้น
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium flex items-center gap-2">
                          จำนวนต่อหีบห่อ
                          {selectedMaterial.packingQuantity && (
                            <Badge variant="outline" className="text-xs">ค่าเดิม: {selectedMaterial.packingQuantity}</Badge>
                          )}
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          {...form.register("packingQuantityOverride")}
                          placeholder="เช่น 200"
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    {/* Pieces Quantity Result */}
                    {piecesQuantity !== null && (
                      <div className="rounded-lg bg-primary/10 border border-primary/20 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Boxes className="h-5 w-5 text-primary" />
                            <span className="font-medium">จำนวนชิ้นที่ใช้ได้</span>
                          </div>
                          <div className="text-right">
                            <span className="text-3xl font-bold text-primary">
                              {formatNumber(piecesQuantity)}
                            </span>
                            <span className="text-sm text-muted-foreground ml-1">ชิ้น</span>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground text-center">
                          = จำนวนรับ × ชิ้นต่อเส้น ({effectiveRatio ?? selectedMaterial.ratio})
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionSection>
              )}

              {/* Section 5: ไฟล์แนบ (ถ้าต้องการ) */}
              <AccordionSection
                title="ไฟล์แนบ"
                icon={<Upload className="h-4 w-4" />}
                defaultOpen={false}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Info className="h-4 w-4" />
                    <span>รองรับไฟล์ JPEG, PNG, WebP, PDF (ไม่เกิน 10 MB)</span>
                  </div>
                  <Button type="button" variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    เลือกไฟล์
                  </Button>
                </div>
              </AccordionSection>

              {/* Server Error */}
              {serverError && (
                <div className="rounded-md bg-danger/10 p-3 text-sm text-danger">
                  {serverError}
                </div>
              )}
            </div>

            {/* Right Column - Live Preview - Hidden on mobile */}
            <div className="hidden lg:block border-t lg:border-t-0 lg:border-l lg:w-72 xl:w-80 bg-muted/20 overflow-y-auto lg:max-h-[calc(90vh-180px)]">
              <div className="sticky top-0 p-4 sm:p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                  <QrCode className="h-4 w-4" />
                  <span className="hidden sm:inline">Live Preview</span>
                  <span className="sm:hidden">Preview</span>
                </h3>

                {/* QR Code Preview */}
                <PreviewCard>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 font-medium">
                      <QrCode className="h-4 w-4" />
                      QR Code หลัก
                    </div>

                    {/* Main QR Preview */}
                    <div className="flex flex-col items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getQrCodeUrl(previewInternalLotNo(), 100)}
                        alt="Main QR Code"
                        className="w-24 h-24 rounded border-2 border-dashed bg-white"
                      />
                      <span className="font-mono text-xs mt-2 font-semibold text-primary">
                        {previewInternalLotNo()}
                      </span>
                    </div>

                    {/* Lot Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Run No:</span>
                        <span className="font-mono">
                          {previewRunNo()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Supplier Lot:</span>
                        <span className="font-mono">
                          {supplierLotPreview ?? "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </PreviewCard>

                {/* QR Set 1: ตามจำนวนรับเข้า (บรรจุภัณฑ์) */}
                <PreviewCard>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium text-sm">
                        <QrCode className="h-4 w-4" />
                        QR ชุดที่ 1: จำนวนรับเข้า
                      </div>
                      {packageCount && (
                        <Badge variant="outline" className="text-xs">
                          {packageCount} ชุด
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      รูปแบบ: CCI-YYYYMMDD-NNN
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {lotNumbersPreview.length > 0 ? (
                        lotNumbersPreview.map((lot, i) => (
                          <div key={i} className="flex flex-col items-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getQrCodeUrl(lot, 60)}
                              alt={lot}
                              className="w-14 h-14 rounded border bg-white"
                            />
                            <span className="font-mono text-[10px] mt-1 text-center">{lot.split('-').pop()}</span>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full text-center py-4">
                          <p className="text-xs text-muted-foreground italic">
                            กรอกจำนวนรับเข้าเพื่อดู QR Codes
                          </p>
                        </div>
                      )}
                    </div>
                    {packageCount && packageCount > 10 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{packageCount - 10} ชุดอื่นๆ
                      </p>
                    )}
                  </div>
                </PreviewCard>

                {/* QR Set 2: จำนวนชิ้นที่ใช้ได้ (เฉพาะ PIPE/SHEET/COIL) */}
                {requiresRatio && (
                  <PreviewCard>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-medium text-sm">
                          <Scissors className="h-4 w-4 text-primary" />
                          QR ชุดที่ 2: จำนวนชิ้นที่ใช้ได้
                        </div>
                        {piecesQuantity && (
                          <Badge variant="default" className="text-xs">
                            {formatNumber(piecesQuantity)} ชิ้น
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        รูปแบบ: CCI-YYYYMMDD-NNN-NNN
                      </p>
                      <PiecesQrPreviewGrid
                        items={piecesLotNumbersPreview}
                        totalPieces={piecesQuantity}
                      />
                    </div>
                  </PreviewCard>
                )}

                {/* Package Preview */}
                <PreviewCard>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 font-medium">
                      <Package className="h-4 w-4" />
                      การคำนวณบรรจุภัณฑ์
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">
                          จำนวนรับเข้า
                        </label>
                        <div className="font-mono font-semibold">
                          {watchQuantity ? formatNumber(watchQuantity) : "—"}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">
                          จำนวนต่อหีบ
                        </label>
                        <div className="font-mono font-semibold">
                          {effectivePackingQuantity !== null
                            ? formatNumber(effectivePackingQuantity)
                            : selectedMaterial?.packingQuantity
                              ? formatNumber(selectedMaterial.packingQuantity)
                              : "—"}
                        </div>
                      </div>
                    </div>

                    {packageCount !== null ? (
                      <div className="rounded-md bg-primary/10 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">จำนวนบรรจุภัณฑ์</span>
                          <Badge variant="default">{packageCount} ใบ</Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground text-center">
                        กรอกจำนวนรับเข้าเพื่อดูการคำนวณ
                      </div>
                    )}
                  </div>
                </PreviewCard>

                {/* Package Breakdown */}
                {packages && packages.length > 0 && (
                  <PreviewCard>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 font-medium">
                        <Boxes className="h-4 w-4" />
                        รายละเอียดบรรจุภัณฑ์
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {packages.map((pkg) => (
                          <div
                            key={pkg.packageNo}
                            className="flex items-center justify-between rounded bg-white px-3 py-2 text-sm border"
                          >
                            <span className="text-muted-foreground">
                              หีบที่ {pkg.packageNo}
                            </span>
                            <span className="font-mono font-semibold">
                              {formatNumber(pkg.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PreviewCard>
                )}

                {/* Material Info */}
                {selectedMaterial && (
                  <PreviewCard>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 font-medium">
                        <Factory className="h-4 w-4" />
                        ข้อมูลวัสดุ
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">รหัส:</span>
                          <span className="font-mono font-semibold">
                            {selectedMaterial.code}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ชื่อ:</span>
                          <span className="truncate max-w-[150px]">
                            {selectedMaterial.name}
                          </span>
                        </div>
                        {selectedMaterial.materialType && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">ประเภท:</span>
                            <Badge variant="outline">{selectedMaterial.materialType}</Badge>
                          </div>
                        )}
                        {selectedSupplier && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Supplier:</span>
                            <span className="truncate max-w-[150px] text-xs">
                              {selectedSupplier.nameTh}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </PreviewCard>
                )}

                {/* PO Preview */}
                {watchPoNo && (
                  <PreviewCard>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 font-medium">
                        <ClipboardList className="h-4 w-4" />
                        เลขที่ PO
                      </div>
                      <div className="font-mono text-sm bg-white px-3 py-2 rounded border">
                        {watchPoNo}
                      </div>
                    </div>
                  </PreviewCard>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="border-t p-4 sm:p-6 pt-4">
            <div className="flex w-full items-center justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={savePending}>
                {savePending ? (
                  "กำลังบันทึก..."
                ) : isEditing ? (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    บันทึกการแก้ไข
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    สร้างรายการรับเข้า
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
