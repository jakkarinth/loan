SET NAMES utf8mb4;
SET time_zone = '+07:00';

INSERT INTO roles (code, name_th, description) VALUES
  ('borrower', 'บุคลากรทั่วไป / ผู้ยืม', 'ผู้ใช้งานที่สามารถยื่นคำขอยืมเงินและติดตามรายการของตนเอง'),
  ('department_checker', 'เจ้าหน้าที่ตรวจสอบส่วนงาน', 'ตรวจสอบรายการขอยืมจากส่วนงานและกำหนดประเภทการยืม'),
  ('budget_officer', 'เจ้าหน้าที่งบประมาณ', 'ตรวจสอบรายการด้านงบประมาณ'),
  ('finance_officer', 'เจ้าหน้าที่การเงิน', 'ตรวจสอบการเงิน บันทึกจ่ายเงิน ส่งใช้เงินยืม และหนังสือทวง'),
  ('approver', 'ผู้บริหาร / ผู้อนุมัติ', 'อนุมัติรายการและดูรายงานผู้บริหาร'),
  ('admin', 'ผู้ดูแลระบบ', 'จัดการผู้ใช้ สิทธิ์ ข้อมูลตั้งต้น และระบบ')
ON DUPLICATE KEY UPDATE
  name_th = VALUES(name_th),
  description = VALUES(description);

INSERT INTO permissions (code, name_th, description) VALUES
  ('auth.login', 'เข้าสู่ระบบ', 'เข้าสู่ระบบและใช้งานบัญชี'),
  ('users.manage', 'จัดการผู้ใช้', 'เพิ่ม แก้ไข ระงับ และกำหนดสิทธิ์ผู้ใช้'),
  ('departments.manage', 'จัดการหน่วยงาน', 'เพิ่ม แก้ไข และจัดโครงสร้างหน่วยงาน'),
  ('loans.create', 'สร้างคำขอยืม', 'สร้างและส่งคำขอยืมเงิน'),
  ('loans.read_own', 'ดูคำขอของตนเอง', 'ดูรายการเงินยืมของผู้ใช้เอง'),
  ('loans.read_scoped', 'ดูคำขอในหน่วยงาน', 'ดูรายการเงินยืมตามขอบเขตหน่วยงาน'),
  ('loans.read_all', 'ดูคำขอทั้งหมด', 'ดูรายการเงินยืมทั้งหมดในระบบ'),
  ('loans.department_review', 'ตรวจสอบส่วนงาน', 'ตรวจสอบและส่งต่อรายการในระดับส่วนงาน'),
  ('loans.budget_review', 'ตรวจสอบงบประมาณ', 'ตรวจสอบรายการด้านงบประมาณ'),
  ('loans.finance_review', 'ตรวจสอบการเงิน', 'ตรวจสอบรายการด้านการเงิน'),
  ('loans.approve', 'อนุมัติรายการ', 'อนุมัติหรือไม่อนุมัติรายการเงินยืม'),
  ('payments.manage', 'บันทึกจ่ายเงิน', 'บันทึกวิธีจ่ายและวันที่จ่ายเงิน'),
  ('repayments.manage', 'บันทึกส่งใช้เงินยืม', 'บันทึกรายการส่งใช้เงินยืม'),
  ('extensions.request', 'ขอขยายอายุสัญญา', 'ยื่นคำขอขยายอายุสัญญาเงินยืม'),
  ('extensions.review', 'อนุมัติขยายอายุ', 'ตรวจสอบและอนุมัติคำขอขยายอายุ'),
  ('notices.manage', 'จัดการหนังสือทวง', 'สร้างและพิมพ์หนังสือทวงเงินยืม'),
  ('reports.view', 'ดูรายงาน', 'ดูรายงานปฏิบัติงานและรายงานสรุป'),
  ('reports.executive', 'ดูรายงานผู้บริหาร', 'ดู Dashboard และรายงานเชิงบริหาร'),
  ('settings.manage', 'จัดการตั้งค่าระบบ', 'จัดการข้อมูลตั้งต้นและค่าระบบ'),
  ('audit.view', 'ดูประวัติระบบ', 'ดู Audit Log และกิจกรรมสำคัญ')
ON DUPLICATE KEY UPDATE
  name_th = VALUES(name_th),
  description = VALUES(description);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('auth.login', 'loans.create', 'loans.read_own', 'extensions.request')
WHERE r.code = 'borrower'
ON DUPLICATE KEY UPDATE role_id = role_id;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('auth.login', 'loans.create', 'loans.read_own', 'loans.read_scoped', 'loans.department_review', 'extensions.request', 'reports.view')
WHERE r.code = 'department_checker'
ON DUPLICATE KEY UPDATE role_id = role_id;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('auth.login', 'loans.read_scoped', 'loans.budget_review', 'reports.view')
WHERE r.code = 'budget_officer'
ON DUPLICATE KEY UPDATE role_id = role_id;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('auth.login', 'loans.read_all', 'loans.finance_review', 'loans.approve', 'payments.manage', 'repayments.manage', 'extensions.review', 'notices.manage', 'reports.view')
WHERE r.code = 'finance_officer'
ON DUPLICATE KEY UPDATE role_id = role_id;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('auth.login', 'loans.read_all', 'loans.approve', 'reports.view', 'reports.executive')
WHERE r.code = 'approver'
ON DUPLICATE KEY UPDATE role_id = role_id;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'admin'
ON DUPLICATE KEY UPDATE role_id = role_id;

INSERT INTO departments (parent_id, code, name_th, name_en, phone, email) VALUES
  (NULL, 'RMUTI-SURIN', 'มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน วิทยาเขตสุรินทร์', 'Rajamangala University of Technology Isan Surin Campus', NULL, NULL),
  ((SELECT id FROM (SELECT id FROM departments WHERE code = 'RMUTI-SURIN') AS d), 'FINANCE', 'งานการเงิน', 'Finance Office', NULL, NULL),
  ((SELECT id FROM (SELECT id FROM departments WHERE code = 'RMUTI-SURIN') AS d), 'BUDGET', 'งานงบประมาณ', 'Budget Office', NULL, NULL),
  ((SELECT id FROM (SELECT id FROM departments WHERE code = 'RMUTI-SURIN') AS d), 'ADMIN-OFFICE', 'สำนักงานวิทยาเขตสุรินทร์', 'Surin Campus Office', NULL, NULL)
ON DUPLICATE KEY UPDATE
  parent_id = VALUES(parent_id),
  name_th = VALUES(name_th),
  name_en = VALUES(name_en),
  phone = VALUES(phone),
  email = VALUES(email);

INSERT INTO loan_statuses (code, name_th, description, sort_order, is_terminal) VALUES
  ('draft', 'แบบร่าง', 'ผู้ยืมบันทึกไว้แต่ยังไม่ส่งตรวจสอบ', 10, 0),
  ('pending_department_review', 'รอตรวจสอบ', 'รายการถูกส่งเข้าสู่ขั้นตอนตรวจสอบส่วนงาน', 20, 0),
  ('pending_university_finance_review', 'รอกองคลังตรวจสอบ', 'รายการยืมจากมหาวิทยาลัย รอกองคลังหรือการเงินตรวจสอบ', 30, 0),
  ('pending_department_approval', 'รอส่วนงานอนุมัติ', 'รายการยืมจากส่วนงาน รอผู้มีอำนาจของส่วนงานอนุมัติ', 40, 0),
  ('budget_reviewed', 'ผ่านการตรวจสอบงบประมาณ', 'เจ้าหน้าที่งบประมาณตรวจสอบผ่านแล้ว', 50, 0),
  ('finance_reviewed', 'ผ่านการตรวจสอบการเงิน', 'เจ้าหน้าที่การเงินตรวจสอบผ่านแล้ว', 60, 0),
  ('approved', 'อนุมัติ', 'ผู้มีอำนาจอนุมัติรายการ', 70, 0),
  ('paid', 'จ่ายแล้ว', 'เจ้าหน้าที่บันทึกการจ่ายเงินแล้ว', 80, 0),
  ('partially_repaid', 'ส่งใช้บางส่วน', 'บันทึกส่งใช้เงินยืมบางส่วนแล้ว', 90, 0),
  ('fully_repaid', 'ส่งใช้ครบ', 'ส่งใช้เงินครบตามยอดยืมแล้ว', 100, 1),
  ('overdue', 'เกินกำหนด', 'ยังส่งใช้ไม่ครบและพ้นวันครบกำหนด', 110, 0),
  ('extension_requested', 'ขอขยายอายุ', 'ผู้ยืมยื่นคำขอขยายอายุสัญญา', 120, 0),
  ('extension_approved', 'อนุมัติขยายอายุ', 'เจ้าหน้าที่อนุมัติและปรับวันครบกำหนดใหม่', 130, 0),
  ('extension_rejected', 'ไม่อนุมัติขยายอายุ', 'คำขอขยายอายุไม่ผ่าน', 140, 0),
  ('rejected', 'ไม่อนุมัติ / ตีกลับ', 'รายการไม่ผ่านการตรวจสอบหรืออนุมัติ', 900, 1),
  ('cancelled', 'ยกเลิก', 'รายการถูกยกเลิก', 910, 1)
ON DUPLICATE KEY UPDATE
  name_th = VALUES(name_th),
  description = VALUES(description),
  sort_order = VALUES(sort_order),
  is_terminal = VALUES(is_terminal);

INSERT INTO loan_types (code, name_th, description) VALUES
  ('department', 'ยืมจากส่วนงาน', 'รายการเงินยืมที่ใช้เงินจากส่วนงาน'),
  ('university', 'ยืมจากมหาวิทยาลัย', 'รายการเงินยืมที่ใช้เงินจากมหาวิทยาลัยหรือกองคลัง')
ON DUPLICATE KEY UPDATE
  name_th = VALUES(name_th),
  description = VALUES(description);

INSERT INTO funding_sources (code, name_th, description) VALUES
  ('revolving_fund', 'เงินทุนหมุนเวียน', 'แหล่งเงินทุนหมุนเวียน'),
  ('advance_fund', 'เงินทดรองจ่าย', 'แหล่งเงินทดรองจ่าย'),
  ('other', 'อื่นๆ', 'แหล่งเงินอื่นๆ')
ON DUPLICATE KEY UPDATE
  name_th = VALUES(name_th),
  description = VALUES(description);

INSERT INTO due_date_rules (code, name_th, days_count, count_from, description) VALUES
  ('paid_date_30', 'ครบกำหนดภายใน 30 วันนับจากวันที่จ่ายเงิน', 30, 'paid_date', 'เงื่อนไขมาตรฐานหลังจ่ายเงิน'),
  ('paid_date_60', 'ครบกำหนดภายใน 60 วันนับจากวันที่จ่ายเงิน', 60, 'paid_date', 'เงื่อนไขมาตรฐานหลังจ่ายเงิน'),
  ('project_end_15', 'ครบกำหนดภายใน 15 วันหลังสิ้นสุดโครงการ', 15, 'project_end_date', 'ใช้กับรายการที่ผูกกับโครงการหรือกิจกรรม'),
  ('custom', 'ระบุเงื่อนไขเอง', 1, 'custom_date', 'ให้เจ้าหน้าที่ระบุวันครบกำหนดเองในรายการ')
ON DUPLICATE KEY UPDATE
  name_th = VALUES(name_th),
  days_count = VALUES(days_count),
  count_from = VALUES(count_from),
  description = VALUES(description);

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
  ('campus', JSON_OBJECT('code', 'RMUTI-SURIN', 'name_th', 'มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน วิทยาเขตสุรินทร์'), 'ข้อมูลวิทยาเขต'),
  ('loan_number_format', JSON_OBJECT('request_prefix', 'LR', 'contract_prefix', 'LC', 'year_system', 'buddhist'), 'รูปแบบเลขที่คำขอและเลขที่สัญญาเบื้องต้น'),
  ('currency', JSON_OBJECT('code', 'THB', 'locale', 'th-TH'), 'สกุลเงินและ locale สำหรับแสดงผล')
ON DUPLICATE KEY UPDATE
  setting_value = VALUES(setting_value),
  description = VALUES(description);

