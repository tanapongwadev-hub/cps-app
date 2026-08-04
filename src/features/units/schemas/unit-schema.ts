import { z } from "zod";

export const unitSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "กรุณากรอกรหัส")
    .max(20, "รหัสต้องไม่เกิน 20 ตัวอักษร"),
  nameTh: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อ (ไทย)")
    .max(100, "ชื่อต้องไม่เกิน 100 ตัวอักษร"),
  nameEn: z
    .string()
    .trim()
    .max(100, "ชื่อ (EN) ต้องไม่เกิน 100 ตัวอักษร")
    .optional()
    .or(z.literal("")),
  symbol: z
    .string()
    .trim()
    .max(20, "สัญลักษณ์ต้องไม่เกิน 20 ตัวอักษร")
    .optional()
    .or(z.literal("")),
  description: z.string().trim().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export type UnitFormValues = z.infer<typeof unitSchema>;
