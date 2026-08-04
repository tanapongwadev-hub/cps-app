import { z } from "zod";

export const materialModelSchema = z.object({
  code: z.string().trim().min(1, "กรุณากรอกรหัส").max(50),
  nameTh: z.string().trim().min(1, "กรุณากรอกชื่อ (ไทย)").max(100),
  nameEn: z.string().trim().max(100).optional().or(z.literal("")),
  description: z.string().trim().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export type MaterialModelFormValues = z.infer<typeof materialModelSchema>;
