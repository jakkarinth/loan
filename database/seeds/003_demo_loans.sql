SET NAMES utf8mb4;
SET time_zone = '+07:00';

INSERT INTO loan_requests (
  id,
  request_no,
  contract_no,
  borrower_id,
  department_id,
  loan_type_id,
  funding_source_id,
  due_date_rule_id,
  status_code,
  objective,
  project_name,
  project_start_date,
  project_end_date,
  amount,
  submitted_at,
  approved_at,
  paid_at,
  due_date,
  current_balance,
  remark,
  created_by,
  updated_by
) VALUES (
  1,
  'LR256900001',
  'LC256900001',
  (SELECT id FROM users WHERE email = 'borrower@example.local'),
  (SELECT id FROM departments WHERE code = 'ADMIN-OFFICE'),
  (SELECT id FROM loan_types WHERE code = 'department'),
  (SELECT id FROM funding_sources WHERE code = 'advance_fund'),
  (SELECT id FROM due_date_rules WHERE code = 'paid_date_30'),
  'paid',
  'เงินยืมทดลองสำหรับตรวจสอบระบบ',
  'โครงการทดสอบระบบบริหารลูกหนี้เงินยืม',
  '2026-06-01',
  '2026-06-03',
  15000.00,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  '2026-06-10',
  '2026-07-10',
  15000.00,
  'ข้อมูล demo สำหรับ smoke test',
  (SELECT id FROM users WHERE email = 'finance@example.local'),
  (SELECT id FROM users WHERE email = 'finance@example.local')
)
ON DUPLICATE KEY UPDATE
  borrower_id = VALUES(borrower_id),
  department_id = VALUES(department_id),
  loan_type_id = VALUES(loan_type_id),
  funding_source_id = VALUES(funding_source_id),
  due_date_rule_id = VALUES(due_date_rule_id),
  status_code = VALUES(status_code),
  objective = VALUES(objective),
  project_name = VALUES(project_name),
  amount = VALUES(amount),
  paid_at = VALUES(paid_at),
  due_date = VALUES(due_date),
  current_balance = VALUES(current_balance),
  remark = VALUES(remark),
  updated_by = VALUES(updated_by);

INSERT INTO loan_payments (
  loan_request_id,
  payment_method,
  amount,
  paid_date,
  plan_name,
  fund_name,
  payment_detail_no,
  cheque_no,
  note,
  recorded_by
) VALUES (
  1,
  'bank_transfer',
  15000.00,
  '2026-06-10',
  'แผนงานทดสอบระบบ',
  'เงินทดรองจ่าย',
  'PAY256900001',
  NULL,
  'ข้อมูล demo สำหรับ smoke test',
  (SELECT id FROM users WHERE email = 'finance@example.local')
)
ON DUPLICATE KEY UPDATE
  amount = VALUES(amount),
  paid_date = VALUES(paid_date),
  plan_name = VALUES(plan_name),
  fund_name = VALUES(fund_name),
  note = VALUES(note),
  recorded_by = VALUES(recorded_by);

INSERT INTO debt_notice_letters (
  id,
  loan_request_id,
  notice_no,
  government_unit,
  document_date,
  subject,
  details,
  identity_text,
  issued_by
) VALUES (
  1,
  1,
  'DN256900001',
  'มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน วิทยาเขตสุรินทร์',
  '2026-07-15',
  'แจ้งเตือนรายการเงินยืมครบกำหนด',
  'ข้อมูล demo สำหรับตรวจสอบการออกหนังสือทวง',
  'ผู้ยืมเงินตามสัญญาเลขที่ LC256900001',
  (SELECT id FROM users WHERE email = 'finance@example.local')
)
ON DUPLICATE KEY UPDATE
  loan_request_id = VALUES(loan_request_id),
  government_unit = VALUES(government_unit),
  document_date = VALUES(document_date),
  subject = VALUES(subject),
  details = VALUES(details),
  identity_text = VALUES(identity_text),
  issued_by = VALUES(issued_by);
