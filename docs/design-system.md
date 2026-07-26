# Design System

## Principles

1. **เรียบง่าย สะอาด เป็นมืออาชีพ** - ไม่หรูหรา ไม่ฉูดฉาด
2. **เน้นข้อมูลเป็นหลัก** - UI ไม่บดบัง content
3. **Consistent spacing** - ใช้ spacing scale เดียวกันทั้งระบบ
4. **Subtle colors** - ใช้สีจำกัด ไม่หลายสีจนรก
5. **ไม่ใช้ Gradient หนัก** - เน้น flat design
6. **ไม่ใช้ Card ทุกที่** - ใช้เฉพาะจุดที่ต้องการ grouping

## Design Tokens

### Colors

**Light Mode (default):**
```
Primary:        hsl(222 84% 45%)   /* Blue */
Secondary:      hsl(215 16% 92%)   /* Light gray */
Success:        hsl(142 71% 35%)   /* Green */
Warning:        hsl(38 92% 45%)    /* Orange */
Danger:         hsl(0 72% 50%)     /* Red */
Info:           hsl(199 89% 41%)   /* Cyan */

Background:     hsl(0 0% 100%)     /* White */
Surface:        hsl(0 0% 100%)
Border:         hsl(215 20% 88%)
Text Primary:   hsl(222 47% 11%)
Text Secondary: hsl(215 16% 35%)
Text Disabled:  hsl(215 16% 65%)
```

**Dark Mode:**
ใช้ variable เดียวกัน แต่ override ใน `.dark` class

ใช้ผ่าน Tailwind utilities:
```tsx
<div className="bg-background text-foreground" />
<button className="bg-primary text-primary-foreground" />
<span className="text-muted-foreground" />
```

### Spacing

ใช้ Tailwind default scale:
- `p-1` = 4px
- `p-2` = 8px
- `p-3` = 12px
- `p-4` = 16px (default)
- `p-5` = 20px
- `p-6` = 24px
- `p-8` = 32px

### Radius

- `rounded-sm` = 6px
- `rounded` / `rounded-md` = 8px (default)
- `rounded-lg` = 12px
- `rounded-xl` = 16px
- `rounded-full` = 9999px (avatars, badges)

### Typography

ใช้ฟอนต์ Noto Sans Thai + IBM Plex Sans Thai + Inter

```
text-xs    = 12px  (labels, metadata)
text-sm    = 14px  (body, default)
text-base  = 16px  (large body)
text-lg    = 18px  (subheadings)
text-xl    = 20px  (page titles)
text-2xl   = 24px  (large titles)
text-3xl   = 30px  (hero)
```

## Component Specifications

### Button

```tsx
// Primary action
<Button variant="default">บันทึก</Button>

// Secondary action
<Button variant="outline">ยกเลิก</Button>

// Destructive
<Button variant="destructive">ลบ</Button>

// Sizes
<Button size="sm">...</Button>
<Button size="default">...</Button>
<Button size="lg">...</Button>

// Loading state
<Button loading>กำลังบันทึก...</Button>

// With icon
<Button leftIcon={<Plus />}>เพิ่ม</Button>
```

### Input

```tsx
<TextField
  label="อีเมล"
  type="email"
  required
  error="อีเมลไม่ถูกต้อง"
  description="ใช้สำหรับเข้าสู่ระบบ"
  leftIcon={<Mail />}
/>
```

### Card

```tsx
<Card>
  <CardHeader>
    <CardTitle>หัวข้อ</CardTitle>
    <CardDescription>คำอธิบาย</CardDescription>
  </CardHeader>
  <CardContent>
    เนื้อหา
  </CardContent>
  <CardFooter>
    <Button>ตกลง</Button>
  </CardFooter>
</Card>
```

### Badge

```tsx
<Badge variant="success">ใช้งาน</Badge>
<Badge variant="warning">รอ</Badge>
<Badge variant="danger">ผิดพลาด</Badge>
<Badge variant="info">ข้อมูล</Badge>
<Badge variant="muted">ระงับ</Badge>
```

### Dialog / Drawer

```tsx
// For confirmations
<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  title="ยืนยันการลบ"
  description="การลบไม่สามารถกู้คืนได้"
  variant="danger"
  onConfirm={handleDelete}
/>

// For forms
<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>เพิ่มผู้ใช้งาน</SheetTitle>
    </SheetHeader>
    {/* form */}
  </SheetContent>
</Sheet>
```

### Toast

```ts
import { showToast } from "@/lib/toast";

showToast.success("บันทึกสำเร็จ");
showToast.error("เกิดข้อผิดพลาด", "ลองใหม่อีกครั้ง");
showToast.warning("คำเตือน");
showToast.info("ข้อมูล");
```

## Layout Guidelines

### Page Layout

```tsx
<>
  <PageContainer>
    <PageHeader
      title="หัวข้อหน้า"
      description="คำอธิบายสั้นๆ"
      breadcrumbs={[...]}
      primaryAction={<Button>...</Button>}
    />
    {/* content */}
  </PageContainer>
  <PageFooter />
</>
```

### Content Spacing

- ใช้ `space-y-5` หรือ `space-y-6` ระหว่าง sections
- ใช้ `gap-4` ใน grid
- ใช้ `p-5` หรือ `p-6` ใน Card content

### Responsive Breakpoints

```
sm:  640px   (Tablet portrait)
md:  768px   (Tablet landscape)
lg:  1024px  (Desktop)
xl:  1280px  (Large desktop)
2xl: 1536px  (Extra large)
```

ใช้ Mobile-first:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
```

## Accessibility (a11y)

✅ **Semantic HTML** - ใช้ `<button>`, `<nav>`, `<main>` แทน `<div>`
✅ **ARIA labels** - `aria-label` สำหรับ icon-only buttons
✅ **Focus management** - `:focus-visible` ring
✅ **Keyboard nav** - Tab, Enter, Escape
✅ **Color contrast** - WCAG AA minimum
✅ **Screen reader** - SR-only labels
✅ **Form errors** - `aria-invalid`, `aria-describedby`

## Animation

ใช้ Tailwind animate utilities:
- `animate-in fade-in-0` - Fade in
- `animate-pulse` - Loading
- `animate-spin` - Spinner

หรือใช้ transitions:
- `transition-colors` - สี
- `transition-opacity` - ความโปร่งใส
- `duration-300` - ความเร็ว

**ลด motion** เมื่อ user prefers:
```css
@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0.01ms !important; }
}
```

## Best Practices

✅ DO:
- ใช้ design tokens ผ่าน Tailwind classes
- ใช้ shared components เสมอ
- ทดสอบบน Mobile / Tablet / Desktop
- ใส่ Loading / Empty / Error state ครบ
- ใช้ semantic HTML

❌ DON'T:
- Hardcode สี (#fff, #000)
- ใช้ inline style
- สร้าง component ใหม่ทั้งที่มีอยู่แล้ว
- ใช้ card ทุกที่
- ลืม dark mode
