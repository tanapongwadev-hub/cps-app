import { z } from "zod";

/**
 * Real backend user schemas — aligned with `API_ENDPOINTS.md` and the
 * NestJS DTOs:
 *
 *  - POST /users
 *      { username, password, firstName, lastName, email,
 *        telephone?, assignments: [{ departmentId, roleId, isPrimary? }] }
 *  - PATCH /users/:id
 *      { firstName, lastName, email, telephone? }
 *      (assignments are managed separately via /users/:id/assignments)
 *  - PATCH /users/:id/status
 *      { isActive: boolean }
 *
 * The UI treats `status` ("active" | "inactive") as a derived field that
 * maps to the backend `isActive` flag in the mutation layer.
 */

const passwordSchema = z
  .string()
  .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
  .regex(/[A-Z]/, "ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว")
  .regex(/[0-9]/, "ต้องมีตัวเลขอย่างน้อย 1 ตัว");

/** A single (department, role) assignment the user is being given. */
export const userAssignmentInputSchema = z.object({
  departmentId: z.string().min(1, "กรุณาเลือกแผนก"),
  roleId: z.string().min(1, "กรุณาเลือกบทบาท"),
  isPrimary: z.boolean().optional(),
});

export const editUserAssignmentSchema = z
  .object({
    id: z.string().optional(),
    departmentId: z.string().min(1, "กรุณาเลือกแผนก").nullable(),
    roleId: z.string().min(1, "กรุณาเลือกบทบาท"),
    roleScopeType: z.enum(["SYSTEM", "DEPARTMENT"]),
  })
  .superRefine((assignment, ctx) => {
    if (
      assignment.roleScopeType === "SYSTEM" &&
      assignment.departmentId !== null
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["departmentId"],
        message: "System Role ต้องใช้ทุกแผนก",
      });
    }
    if (
      assignment.roleScopeType === "DEPARTMENT" &&
      assignment.departmentId === null
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["departmentId"],
        message: "กรุณาเลือกแผนก",
      });
    }
  });

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
    telephone: z
      .string()
      .regex(/^[0-9-]+$/, "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง")
      .min(9, "เบอร์โทรศัพท์ต้องมีอย่างน้อย 9 ตัว")
      .optional()
      .or(z.literal("")),
    /**
     * Required by the backend — at least one (department, role) pair.
     * (See API_ENDPOINTS.md → POST /users → assignments should not be empty)
     */
    assignments: z
      .array(userAssignmentInputSchema)
      .min(1, "ต้องระบุอย่างน้อย 1 แผนก + บทบาท"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "รหัสผ่านยืนยันไม่ตรงกัน",
    path: ["confirmPassword"],
  });

/**
 * PATCH /users/:id — only personal info fields.
 * `isActive` and `assignments` are managed via their own endpoints
 * (PATCH /users/:id/status and POST /users/:id/assignments respectively).
 */
export const updateUserSchema = z
  .object({
    firstName: z.string().min(1, "กรุณากรอกชื่อ"),
    lastName: z.string().min(1, "กรุณากรอกนามสกุล"),
    email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
    telephone: z
      .string()
      .regex(/^[0-9-]+$/, "รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง")
      .min(9, "เบอร์โทรศัพท์ต้องมีอย่างน้อย 9 ตัว")
      .optional()
      .or(z.literal("")),
    assignments: z
      .array(editUserAssignmentSchema)
      .min(1, "ผู้ใช้ต้องมีอย่างน้อย 1 Assignment"),
  })
  .superRefine((values, ctx) => {
    const firstIndexByKey = new Map<string, number>();
    values.assignments.forEach((assignment, index) => {
      const key = `${assignment.departmentId ?? "SYSTEM"}:${assignment.roleId}`;
      const firstIndex = firstIndexByKey.get(key);
      if (firstIndex === undefined) {
        firstIndexByKey.set(key, index);
        return;
      }
      for (const duplicateIndex of [firstIndex, index]) {
        ctx.addIssue({
          code: "custom",
          path: ["assignments", duplicateIndex, "roleId"],
          message: "แผนกและบทบาทนี้ถูกเพิ่มแล้ว",
        });
      }
    });
  });

/** PATCH /users/:id/status payload */
export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

/** POST /users/:id/assignments payload */
export const addUserAssignmentSchema = z.object({
  departmentId: z.string().min(1, "กรุณาเลือกแผนก"),
  roleId: z.string().min(1, "กรุณาเลือกบทบาท"),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
export type UserAssignmentInput = z.infer<typeof userAssignmentInputSchema>;
export type EditUserAssignmentValues = z.infer<
  typeof editUserAssignmentSchema
>;
export type UpdateUserStatusValues = z.infer<typeof updateUserStatusSchema>;
export type AddUserAssignmentValues = z.infer<typeof addUserAssignmentSchema>;
