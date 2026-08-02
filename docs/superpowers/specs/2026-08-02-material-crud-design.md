# Material CRUD Design

## เป้าหมาย

เพิ่มระบบ CRUD สำหรับ Material Master กลางของบริษัท โดยรองรับข้อมูล Material ครบตาม schema ปัจจุบัน ความสัมพันธ์กับ Supplier การอัปโหลดรูป สิทธิ์แบบแยก action และการค้นหาแบบ server-side ทั้ง Frontend และ Backend

## ขอบเขตข้อมูล

- Material เป็น Master กลางร่วมทุกแผนก ไม่มี `departmentId`
- `code` ต้องไม่ซ้ำทั้งบริษัทโดยไม่สนตัวพิมพ์เล็ก-ใหญ่
- ข้อมูลประกอบด้วย `code`, `name`, `unitId`, `deliveryTypeId`, `modelId`, `loadingPointId`, `processLineName`, `scale`, `imagePath`, `specification`, `description`, `supplierIds` และ `isActive`
- `code`, `name` และ `unitId` เป็นข้อมูลบังคับ
- Unit, Supplier, Model, Delivery Type และ Loading Point เลือกจาก Master ที่มีอยู่และเปิดใช้งาน
- Suppliers เป็นความสัมพันธ์หลายต่อหลายผ่าน `master.supplier_materials` และห้ามมี Supplier ซ้ำ
- ไม่รวมข้อมูล Stock, Lot, Price, Warehouse หรือ Stock Movement ใน Material Master

## สถาปัตยกรรม

ใช้ Dedicated Material Module ใน Backend เพื่อรวมกติกาธุรกิจและ Transaction ไว้ใน service เดียว Frontend ส่งข้อมูล Material พร้อม `supplierIds` ในคำขอเดียว Backend คำนวณความแตกต่างของ Supplier relations และบันทึกทั้งหมดแบบ atomic

Frontend ประกอบด้วยหน้ารายการ Material, ฟอร์มเพิ่ม/แก้ไข, confirmation dialog สำหรับปิดใช้งาน และการควบคุม UI ตาม permission ส่วน Backend เป็นผู้บังคับ permission ที่ทุก endpoint โดยอ้างอิง Assignment/แผนกปัจจุบันจาก access token

## API Contract

- `GET /materials` — pagination, search, filter และ sort
- `GET /materials/:id` — รายละเอียด Material พร้อม Suppliers
- `POST /materials` — สร้าง Material พร้อม Supplier relations
- `PATCH /materials/:id` — แก้ไข Material พร้อมปรับ Supplier relations
- `DELETE /materials/:id` — soft delete ด้วย `isActive=false`
- `PATCH /materials/:id/restore` — เปิดใช้งาน Material อีกครั้ง
- `POST /materials/images` — อัปโหลดรูปและคืนค่า path/URL
- `GET /materials/lookups` — อ่าน Unit, Supplier, Model, Delivery Type และ Loading Point ที่เปิดใช้งาน

คำขอสร้างและแก้ไขใช้ property ต่อไปนี้:

```json
{
  "code": "MAT-001",
  "name": "Material Name",
  "unitId": "1",
  "deliveryTypeId": "2",
  "modelId": "3",
  "loadingPointId": "4",
  "processLineName": "PC Line 1",
  "scale": "10.50",
  "imagePath": "/uploads/materials/example.webp",
  "specification": "Specification",
  "description": "Description",
  "supplierIds": ["10", "12"],
  "isActive": true
}
```

## Validation และ Transaction

- ตัดช่องว่างหัวท้าย และเปลี่ยน optional string ว่างเป็น `null`
- ตรวจ Foreign Keys และ Suppliers ว่ามีอยู่จริงและเปิดใช้งาน
- ปฏิเสธ `supplierIds` ที่ซ้ำกัน
- สร้าง/แก้ไข Material และปรับ `supplier_materials` ภายใน Transaction เดียว
- ตอนแก้ไขเพิ่มและลบ Supplier relations จากผลต่างของรายการเดิมกับรายการใหม่
- ป้องกัน lost update ด้วย `updatedAt` หรือ optimistic concurrency token และคืน `409` เมื่อข้อมูลล้าสมัย
- การลบเป็น soft delete เท่านั้น ความสัมพันธ์เดิมต้องยังอยู่ และสามารถ restore ได้
- รูปถูกตรวจชนิดและขนาดทั้ง Frontend และ Backend บันทึกเฉพาะ path/URL ไม่เก็บ binary หรือ Base64 ในฐานข้อมูล
- อัปโหลดรูปเข้าพื้นที่ชั่วคราวก่อน และย้ายเป็นไฟล์ใช้งานเมื่อการบันทึกสำเร็จ หากล้มเหลวต้องลบไฟล์ชั่วคราว

## หน้าจอ

### รายการ Material

- ตารางแสดงรูป, รหัส, ชื่อ, Unit, Model, Delivery Type, Suppliers และสถานะ
- ค้นหารหัสหรือชื่อ
- กรอง Unit, Model, Delivery Type, Loading Point, Supplier และสถานะ
- รองรับ server-side sorting และ pagination
- แสดงปุ่มเพิ่ม แก้ไข ปิดใช้งาน และเปิดใช้งานตาม permission
- นำการ์ด Current Stock, Low Stock และ Out of Stock ออก เนื่องจากอยู่นอกขอบเขต Material Master

### ฟอร์ม Material

- Dropdown ของ Master และ multi-select ของ Suppliers
- อัปโหลดรูปพร้อม preview, เปลี่ยนรูป และลบรูป
- แสดง validation error ใกล้ช่องข้อมูลโดยรักษาค่าที่กรอกไว้
- ป้องกันการออกจากหน้าขณะมีการแก้ไขที่ยังไม่บันทึกด้วย confirmation
- ปิดปุ่มบันทึกระหว่างส่งคำขอเพื่อป้องกันการบันทึกซ้ำ

### การปิดใช้งาน

- แสดง confirmation dialog พร้อมรหัสและชื่อ Material
- แจ้งว่าเป็นการปิดใช้งาน ไม่ใช่การลบถาวร
- Refresh รายการหลังสำเร็จ

## Permission

- `MATERIAL_VIEW`
- `MATERIAL_CREATE`
- `MATERIAL_UPDATE`
- `MATERIAL_DELETE`

Permission ผูกกับ Role ของ Assignment ปัจจุบัน ผู้ใช้แต่ละแผนกอาจได้รับ action ต่างกัน Frontend ใช้ permission เพื่อควบคุมการแสดงผล แต่ Backend ต้องตรวจ permission ทุก endpoint เสมอ

## Error Handling

- `400 Bad Request` — validation, Supplier ซ้ำ หรือรูปไม่ถูกต้อง
- `401 Unauthorized` — access token ไม่มีหรือหมดอายุ
- `403 Forbidden` — Assignment ปัจจุบันไม่มี permission
- `404 Not Found` — ไม่พบ Material หรือ Master ที่อ้างอิง
- `409 Conflict` — code ซ้ำหรือ concurrent update
- ความล้มเหลวใด ๆ ระหว่างบันทึกต้อง rollback การเปลี่ยนแปลงฐานข้อมูลทั้งหมด

Frontend แสดงข้อความที่ผู้ใช้เข้าใจได้ กรณี `401` ใช้ login flow เดิม กรณี `403` refresh access control และกลับไปหน้าที่เข้าถึงได้ กรณี concurrent `409` ให้โหลดข้อมูลล่าสุดก่อนแก้ไขใหม่

## การทดสอบ

- Backend unit/integration tests สำหรับ CRUD, restore, unique code, validation, permissions, filters, supplier diff, soft delete, rollback และ concurrency
- Upload tests สำหรับชนิดไฟล์ ขนาดไฟล์ และ cleanup เมื่อบันทึกล้มเหลว
- Frontend tests สำหรับ query/filter/pagination, form validation, upload preview, confirmation และการแสดง action ตาม permission
- E2E ตั้งแต่ login เลือก Assignment/แผนกจนถึง CRUD Material เพื่อยืนยันว่า permission ใช้บริบทแผนกที่เลือกจริง

