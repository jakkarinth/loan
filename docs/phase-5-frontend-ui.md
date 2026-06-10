# Phase 5: Frontend UI

## Scope

Phase 5 สร้าง UI ฝั่ง Next.js/React/Tailwind CSS สำหรับใช้งานระบบบริหารลูกหนี้เงินยืม โดยเชื่อมต่อ Backend API จาก Phase 4

## Routes

- `/` - Dashboard ภาพรวมลูกหนี้เงินยืม
- `/login` - เข้าสู่ระบบด้วย API JWT
- `/register` - สมัครสมาชิก
- `/loans` - รายการเงินยืม พร้อมค้นหา
- `/loans/new` - ฟอร์มบันทึกรายการขอยืมเงิน
- `/loans/[id]` - รายละเอียดรายการเงินยืมและ workflow actions
- `/reports` - รายงานสรุป
- `/notices` - รายการหนังสือทวงเงินยืม
- `/users` - รายการสมาชิกระบบ

## Shared UI

- `components/app-shell.tsx` - layout หลัก, sidebar, mobile nav
- `components/status-badge.tsx` - badge แสดงสถานะรายการเงินยืม
- `lib/api.ts` - API client และ response types
- `lib/format.ts` - format เงิน วันที่ และ class utilities
- `types/api.ts` - TypeScript types สำหรับข้อมูลจาก backend

## Implemented Workflow UI

หน้ารายละเอียด `/loans/[id]` รองรับ:

- ส่งคำขอเข้าตรวจสอบ
- อนุมัติรายการ
- บันทึกจ่ายเงิน
- บันทึกส่งใช้เงินยืม
- ขอขยายอายุสัญญา
- ออกหนังสือทวงเงินยืม
- ดูประวัติการเปลี่ยนสถานะ

## Demo Login

หลังรัน seed demo users สามารถเข้าสู่ระบบด้วย:

- Email: `finance@example.local`
- Password: `Password123!`

## Verification

- `npm run typecheck` ผ่านทั้ง frontend/backend
- `npm --prefix frontend run build` ผ่าน
- ตรวจด้วย Browser แล้ว:
  - Dashboard แสดงยอดรวมและตารางสรุป
  - Loan list โหลดรายการ `LR256900001`
  - Loan create form แสดงข้อมูล reference จาก API
  - Loan detail แสดงข้อมูลและ workflow forms
  - Mobile viewport ไม่มี horizontal overflow บนหน้ารายละเอียด
  - ไม่มี console errors จากหน้าที่ตรวจ

## Notes for Next Phase

- เพิ่ม NextAuth.js integration เต็มรูปแบบหากต้องการ session ฝั่ง server
- เพิ่ม role guard สำหรับซ่อน/แสดง action ตามสิทธิ์จริง
- เพิ่ม export PDF/Word สำหรับสัญญา หนังสือขยายอายุ หนังสือทวง และรายงาน
- เพิ่ม form validation เชิงลึกและ toast notification

