import { z } from "zod";

export const organizationSchema = z.object({
  code: z.string().trim().min(1, "กรุณากรอกรหัส").max(50),
  nameTh: z.string().trim().min(1, "กรุณากรอกชื่อ (ไทย)").max(255),
  nameEn: z.string().trim().max(255).optional().or(z.literal("")),
  taxId: z.string().trim().max(20).optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  email: z.string().trim().email("อีเมลไม่ถูกต้อง").max(255).optional().or(z.literal("")),
  website: z.string().trim().max(255).optional().or(z.literal("")),
  logoUrl: z.string().trim().max(500).optional().or(z.literal("")),
  parentId: z.string().regex(/^\d+$/).optional().or(z.literal("")),
  type: z.enum(["headquarters", "branch", "subsidiary", "department"]).default("department"),
  isActive: z.boolean().optional(),
});

export type OrganizationFormValues = z.infer<typeof organizationSchema>;
