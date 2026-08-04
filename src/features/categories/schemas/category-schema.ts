import { z } from "zod";

export const categorySchema = z.object({
  code: z.string().trim().min(1, "กรุณากรอกรหัส").max(50),
  nameTh: z.string().trim().min(1, "กรุณากรอกชื่อ (ไทย)").max(100),
  nameEn: z.string().trim().max(100).optional().or(z.literal("")),
  parentId: z.string().regex(/^\d+$/, "รหัสพ่อแม่ไม่ถูกต้อง").optional().or(z.literal("")),
  sortOrder: z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().int().min(0).max(9999)).optional(),
  iconColor: z.string().trim().max(20).optional().or(z.literal("")),
  description: z.string().trim().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
