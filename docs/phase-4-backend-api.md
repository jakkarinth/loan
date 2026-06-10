# Phase 4: Backend API

## Scope

Phase 4 เพิ่ม REST API ฝั่ง Node.js/Express สำหรับเชื่อมต่อฐานข้อมูล MySQL จาก Phase 3 และรองรับ workflow หลักของระบบบริหารลูกหนี้เงินยืม

## Shared Backend Layer

- `src/config/database.ts` - MySQL connection pool
- `src/lib/db.ts` - query helpers, execute helpers, document number generator
- `src/lib/http.ts` - async handler, validation helper, pagination, API error
- `src/middlewares/error.ts` - 404 และ error response
- `src/middlewares/auth.ts` - JWT authentication middleware

## API Endpoints

Base URL: `http://localhost:4000/api`

### Health

- `GET /health`
- `GET /api`

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`

### Reference Data

- `GET /api/reference/roles`
- `GET /api/reference/permissions`
- `GET /api/reference/loan-statuses`
- `GET /api/reference/loan-types`
- `GET /api/reference/funding-sources`
- `GET /api/reference/due-date-rules`

### Departments

- `GET /api/departments`
- `GET /api/departments/:id`
- `POST /api/departments`
- `PATCH /api/departments/:id`
- `DELETE /api/departments/:id`

### Users

- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PATCH /api/users/:id`
- `PUT /api/users/:id/roles`
- `DELETE /api/users/:id`

### Loan Requests

- `GET /api/loans`
- `GET /api/loans/:id`
- `POST /api/loans`
- `PATCH /api/loans/:id`
- `POST /api/loans/:id/submit`
- `POST /api/loans/:id/status`
- `DELETE /api/loans/:id`

### Payments

- `GET /api/payments/loan/:loanId`
- `POST /api/payments/loan/:loanId`

### Repayments

- `GET /api/repayments/loan/:loanId`
- `POST /api/repayments/loan/:loanId`

### Extensions

- `GET /api/extensions/loan/:loanId`
- `POST /api/extensions/loan/:loanId`
- `POST /api/extensions/:id/review`

### Debt Notices

- `GET /api/notices`
- `GET /api/notices/:id`
- `POST /api/notices`
- `DELETE /api/notices/:id`

### Reports

- `GET /api/reports/dashboard`
- `GET /api/reports/overdue`
- `GET /api/reports/repayments?from=YYYY-MM-DD&to=YYYY-MM-DD`

## Implemented Workflow

1. สร้างคำขอยืมเงินด้วย `POST /api/loans`
2. ส่งคำขอเข้าตรวจสอบด้วย `POST /api/loans/:id/submit`
3. ปรับสถานะ/อนุมัติด้วย `POST /api/loans/:id/status`
4. บันทึกจ่ายเงินด้วย `POST /api/payments/loan/:loanId`
5. บันทึกส่งใช้เงินยืมด้วย `POST /api/repayments/loan/:loanId`
6. ขอขยายอายุด้วย `POST /api/extensions/loan/:loanId`
7. อนุมัติ/ไม่อนุมัติขยายอายุด้วย `POST /api/extensions/:id/review`
8. ออกหนังสือทวงด้วย `POST /api/notices`

## Verification

ตรวจสอบแล้วกับ MySQL container จริง:

- Reference API ตอบข้อมูล roles/statuses
- Departments API ตอบข้อมูลหน่วยงานตั้งต้น
- Demo users seed และ Users API ใช้งานได้
- Auth register/login ได้ JWT
- Loan workflow สร้างคำขอ submit approve pay repay extend notice ได้ครบ
- Reports dashboard อ่านยอดรวมได้
- Backend typecheck ผ่าน

## Notes for Phase 5

- Frontend ควรใช้ `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api`
- Login form เรียก `POST /api/auth/login`
- Dashboard เรียก `GET /api/reports/dashboard`
- Loan list เรียก `GET /api/loans`
- Loan detail เรียก `GET /api/loans/:id`
- Form submit แต่ละ workflow ใช้ endpoint ตามหัวข้อด้านบน

