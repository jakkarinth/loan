SET NAMES utf8mb4;
SET time_zone = '+07:00';

-- Demo password for all users: Password123!
INSERT INTO users (
  department_id,
  employee_code,
  email,
  password_hash,
  title_th,
  first_name_th,
  last_name_th,
  position_th,
  status,
  email_verified_at
) VALUES
  ((SELECT id FROM departments WHERE code = 'ADMIN-OFFICE'), 'DEMO-BORROWER', 'borrower@example.local', '$2a$12$5qx7pNjwb73Y4UHlGHUTr.vsQLVYjyrvD8cq.sb3aPZOP6zKLN4wq', 'นาย', 'ผู้ยืม', 'ตัวอย่าง', 'บุคลากร', 'active', CURRENT_TIMESTAMP),
  ((SELECT id FROM departments WHERE code = 'FINANCE'), 'DEMO-FINANCE', 'finance@example.local', '$2a$12$5qx7pNjwb73Y4UHlGHUTr.vsQLVYjyrvD8cq.sb3aPZOP6zKLN4wq', 'นางสาว', 'การเงิน', 'ตัวอย่าง', 'เจ้าหน้าที่การเงิน', 'active', CURRENT_TIMESTAMP),
  ((SELECT id FROM departments WHERE code = 'BUDGET'), 'DEMO-BUDGET', 'budget@example.local', '$2a$12$5qx7pNjwb73Y4UHlGHUTr.vsQLVYjyrvD8cq.sb3aPZOP6zKLN4wq', 'นาย', 'งบประมาณ', 'ตัวอย่าง', 'เจ้าหน้าที่งบประมาณ', 'active', CURRENT_TIMESTAMP),
  ((SELECT id FROM departments WHERE code = 'ADMIN-OFFICE'), 'DEMO-ADMIN', 'admin@example.local', '$2a$12$5qx7pNjwb73Y4UHlGHUTr.vsQLVYjyrvD8cq.sb3aPZOP6zKLN4wq', 'นาง', 'ผู้ดูแล', 'ระบบ', 'ผู้ดูแลระบบ', 'active', CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE
  department_id = VALUES(department_id),
  password_hash = VALUES(password_hash),
  first_name_th = VALUES(first_name_th),
  last_name_th = VALUES(last_name_th),
  position_th = VALUES(position_th),
  status = VALUES(status);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.code = 'borrower'
WHERE u.employee_code = 'DEMO-BORROWER'
ON DUPLICATE KEY UPDATE user_id = user_id;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.code = 'finance_officer'
WHERE u.employee_code = 'DEMO-FINANCE'
ON DUPLICATE KEY UPDATE user_id = user_id;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.code = 'budget_officer'
WHERE u.employee_code = 'DEMO-BUDGET'
ON DUPLICATE KEY UPDATE user_id = user_id;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.code = 'admin'
WHERE u.employee_code = 'DEMO-ADMIN'
ON DUPLICATE KEY UPDATE user_id = user_id;
