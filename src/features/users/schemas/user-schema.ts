import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
  .regex(/[A-Z]/, "ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว")
  .regex(/[0-9]/, "ต้องมีตัวเลขอย่างน้อย 1 ตัว");

export const createUserSchema = z
  .object({
    username: z
      .string()
      .min(3, "ชื่อผู้ใช้งานต้องมีอย่างน้อย 3 ตัวอักษร")
      .max(50, "ไม่เกิน 50 ตัวอักษร")
      .regex(/^[a-zA-Z0-9._-]+$/, "ใช้ได้เฉพาะ a-z, 0-9, ., _, -"),
    password: passwordSchema,
    confirmPassword: z.string(),
    firstName: z.string().min(1, "กรุณากรอกชื่อ"),
    lastName: z.string().min(1, "กรุณากรอกนามสกุล"),
    email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
    phone: z
      .string()
      .regex(/^[0-9-]+$/, "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง")
      .min(9, "เบอร์โทรศัพท์ต้องมีอย่างน้อย 9 ตัว")
      .optional()
      .or(z.literal("")),
    departmentId: z.string().optional().or(z.literal("")),
    roleIds: z.array(z.string()).min(1, "กรุณาเลือกอย่างน้อย 1 บทบาท"),
    status: z.enum(["active", "inactive", "pending"]),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "รหัสผ่านยืนยันไม่ตรงกัน",
    path: ["confirmPassword"],
  });

export const updateUserSchema = z.object({
  firstName: z.string().min(1, "กรุณากรอกชื่อ"),
  lastName: z.string().min(1, "กรุณากรอกนามสกุล"),
  email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
  phone: z
    .string()
    .regex(/^[0-9-]+$/, "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง")
    .min(9, "เบอร์โทรศัพท์ต้องมีอย่างน้อย 9 ตัว")
    .optional()
    .or(z.literal("")),
  departmentId: z.string().optional().or(z.literal("")),
  roleIds: z.array(z.string()).min(1, "กรุณาเลือกอย่างน้อย 1 บทบาท"),
  status: z.enum(["active", "inactive", "pending"]),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
