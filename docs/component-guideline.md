# Component Guidelines

## When to Create a New Component

✅ **สร้างใหม่เมื่อ**:
- ใช้ซ้ำในหลายที่
- มี state / logic ที่ซับซ้อน
- ต้องการ test แยก

❌ **ไม่ต้องสร้างเมื่อ**:
- ใช้ที่เดียวและไม่ซับซ้อน
- คล้าย component ที่มีอยู่แล้ว (ใช้ตัวเดิม + เพิ่ม props)

## Component Categories

### 1. UI Primitives (`src/components/ui/`)

Base components ที่ไม่ขึ้นกับ business logic
- Button, Input, Card, Dialog, Dropdown, Select, ...
- รับ props เป็นหลัก
- ไม่เรียก API
- ไม่มี hardcode data

### 2. Layout Components (`src/components/layout/`)

โครงสร้าง layout
- Sidebar, TopNav, PageHeader, AdminShell
- ใช้ใน root layout เท่านั้น

### 3. Form Components (`src/components/forms/`)

Form-related
- TextField (with validation display)
- ConfirmDialog
- FormSection, FormGrid

### 4. Table Components (`src/components/tables/`)

Data display
- DataTable (TanStack Table wrapper)
- ActionMenu

### 5. Feature Components (`src/features/<f>/components/`)

เฉพาะ feature นั้น
- UserFormDialog, RoleFormDialog
- ไม่ควรใช้ใน feature อื่น

## Component Template

```tsx
"use client"; // เพิ่มเมื่อใช้ hooks

import * as React from "react";
import { cn } from "@/utils/cn";

interface MyComponentProps {
  /** คำอธิบาย prop (จะแสดงใน IDE) */
  title: string;
  /** Optional className */
  className?: string;
  /** Children content */
  children?: React.ReactNode;
}

export const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ title, className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("base-styles", className)} {...props}>
        <h3>{title}</h3>
        {children}
      </div>
    );
  }
);

MyComponent.displayName = "MyComponent";
```

## Props Best Practices

### 1. Optional + Default

```tsx
interface ButtonProps {
  variant?: "default" | "destructive";
  size?: "sm" | "default" | "lg";
}

function Button({ variant = "default", size = "default" }) { ... }
```

### 2. Discriminated Union (สำหรับ variant ที่มี children ต่างกัน)

```tsx
type AlertProps =
  | { variant: "info"; action?: React.ReactNode }
  | { variant: "destructive"; onConfirm?: () => void };
```

### 3. Composition over Configuration

❌ Bad:
```tsx
<Button icon="plus" iconPosition="left" size="sm" />
```

✅ Good:
```tsx
<Button size="sm" leftIcon={<Plus />}>เพิ่ม</Button>
```

### 4. Render Props / Slots

```tsx
interface DialogProps {
  trigger?: React.ReactNode;
  title: string;
  children: React.ReactNode;
}
```

## Refs

ใช้ `forwardRef` เมื่อ component ต้อง expose ref:

```tsx
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (props, ref) => <input ref={ref} {...props} />
);
Input.displayName = "Input";
```

## Composition

```tsx
// ✅ Composable
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

## State Management

- **Local state** → `useState`
- **Derived state** → `useMemo` (ไม่ใช้ useState + useEffect)
- **Form state** → React Hook Form
- **Server state** → TanStack Query
- **Global state** → Zustand

```tsx
// ❌ Bad - เก็บ derived state ใน useState + useEffect
const [fullName, setFullName] = useState("");
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// ✅ Good - ใช้ useMemo
const fullName = useMemo(() => `${firstName} ${lastName}`, [firstName, lastName]);
```

## Event Handlers

```tsx
// ❌ Inline
<Button onClick={() => setOpen(true)}>เปิด</Button>

// ✅ Good (ถ้า logic ซับซ้อน)
const handleOpen = useCallback(() => setOpen(true), []);
<Button onClick={handleOpen}>เปิด</Button>
```

## Loading / Empty / Error States

ทุก component ที่ fetch data ต้องมี 3 states:

```tsx
function MyPage() {
  const { data, isLoading, isError, refetch } = useData();

  if (isLoading) return <Skeleton />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!data?.length) return <EmptyState title="ไม่มีข้อมูล" />;

  return <List data={data} />;
}
```

## Performance

- ใช้ `React.memo` เมื่อ component render หนัก
- ใช้ `useMemo` สำหรับ expensive computation
- ใช้ `useCallback` สำหรับ function ที่ส่งให้ memoized child
- **อย่าใช้ทุกที่** - ใช้เมื่อจำเป็น (วัดก่อน)

## Accessibility Checklist

✅ Semantic HTML
✅ ARIA labels (icon-only buttons)
✅ Keyboard navigation
✅ Focus visible
✅ Color contrast
✅ Form errors associated with fields
✅ Screen reader text for state changes
