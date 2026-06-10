SET NAMES utf8mb4;
SET time_zone = '+07:00';

UPDATE debt_notice_letters
SET
  government_unit = 'มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน วิทยาเขตสุรินทร์',
  subject = 'ขอให้ส่งใช้เงินยืมภายในกำหนด',
  details = 'ตามที่ท่านได้รับเงินยืมตามสัญญาที่อ้างถึง บัดนี้ครบกำหนดส่งใช้เงินยืมแล้ว จึงขอให้ดำเนินการส่งใช้เงินยืมพร้อมเอกสารหลักฐานให้ครบถ้วน',
  identity_text = 'ระบบบริหารลูกหนี้เงินยืม'
WHERE notice_no = 'DN256900001';

UPDATE loan_approvals
SET note = 'ขอขยายอายุสัญญาจากการทดสอบ Phase 4'
WHERE loan_request_id = 1
  AND from_status_code = 'partially_repaid'
  AND to_status_code = 'extension_requested'
  AND note LIKE '%?%';
