import { z } from "zod";

/**
 * Real backend schema for departments.
 *
 *   POST /departments accepts ONLY:  { code, nameTh, nameEn }
 *   PATCH /departments/:id accepts ONLY:  { nameTh, nameEn }
 *
 * Note: the legacy `name` field is REJECTED (returns 400). We use the
 * newer `nameTh` / `nameEn` pair.
 */

const codeSchema = z
  .string()
  .min(2, "รหัสแผนกต้องมีอย่างน้อย 2 ตัวอักษร")
  .max(20, "รหัสแผนกต้องไม่เกิน 20 ตัวอักษร")
  .regex(/^[A-Z0-9_-]+$/, "ใช้ได้เฉพาะ A-Z, 0-9, _, -");

const nameThSchema = z
  .string()
  .min(1, "กรุณากรอกชื่อภาษาไทย")
  .max(100, "ชื่อภาษาไทยต้องไม่เกิน 100 ตัวอักษร");

const nameEnSchema = z
  .string()
  .min(1, "กรุณากรอกชื่อภาษาอังกฤษ")
  .max(100, "ชื่อภาษาอังกฤษต้องไม่เกิน 100 ตัวอักษร");

export const createDepartmentSchema = z.object({
  code: codeSchema,
  nameTh: nameThSchema,
  nameEn: nameEnSchema,
});

export const updateDepartmentSchema = z.object({
  nameTh: nameThSchema,
  nameEn: nameEnSchema,
});

export type CreateDepartmentFormValues = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentFormValues = z.infer<typeof updateDepartmentSchema>;
