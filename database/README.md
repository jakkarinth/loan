# Database

ฐานข้อมูลหลักใช้ MySQL 8.x พร้อม charset `utf8mb4` และ collation `utf8mb4_unicode_ci`

## Folders

- `migrations/` - SQL สำหรับสร้าง schema และข้อมูลอ้างอิงที่จำเป็นต่อระบบ
- `seeds/` - SQL สำหรับข้อมูลทดลองใช้งานหรือข้อมูล demo

## Migration Order

1. `migrations/001_create_schema.sql`
2. `migrations/002_seed_reference_data.sql`

Docker Compose จะ mount โฟลเดอร์ `migrations/` เข้า `/docker-entrypoint-initdb.d` ดังนั้น migration จะถูกรันอัตโนมัติเมื่อ MySQL container ถูกสร้างฐานข้อมูลครั้งแรก

## Optional Demo Seed

หลังจาก migration สำเร็จแล้ว สามารถรันข้อมูล demo ได้ด้วยไฟล์:

```bash
mysql -h localhost -P 3307 -u loan_user -p rmuti_surin_loan < database/seeds/001_demo_users.sql
```

## Main Tables

- `roles`, `permissions`, `role_permissions`
- `departments`
- `users`, `user_roles`
- `password_reset_tokens`, `refresh_tokens`
- `loan_statuses`, `loan_types`, `funding_sources`, `due_date_rules`
- `loan_requests`
- `loan_approvals`
- `loan_payments`
- `loan_repayments`
- `loan_extensions`
- `debt_notice_letters`
- `attachments`
- `notifications`
- `activity_logs`
- `system_settings`
