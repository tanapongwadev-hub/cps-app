import { z } from "zod";

export const statusItemSchema = z.object({
  code: z.string().trim().min(1, "กรุณากรอกรหัส").max(50),
  nameTh: z.string().trim().min(1, "กรุณากรอกชื่อ (ไทย)").max(100),
  nameEn: z.string().trim().max(100).optional().or(z.literal("")),
  color: z.enum(["info", "success", "warning", "danger", "muted"]).default("info"),
  module: z.string().trim().min(1, "กรุณากรอกโมดูล").max(50),
  isDefault: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  description: z.string().trim().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export type StatusItemFormValues = z.infer<typeof statusItemSchema>;
