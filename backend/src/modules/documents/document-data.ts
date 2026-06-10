import type { RowDataPacket } from "mysql2";
import { ApiError } from "../../lib/http.js";
import { queryOne, queryRows } from "../../lib/db.js";

export type DocumentSection = {
  title: string;
  rows: Array<[string, string]>;
};

export type DocumentPayload = {
  title: string;
  subtitle: string;
  documentNo?: string;
  date?: string;
  sections: DocumentSection[];
  body?: string[];
  signatureLabels?: string[];
};

export async function getLoanDocumentPayload(loanId: number): Promise<DocumentPayload> {
  const loan = await queryOne<RowDataPacket>(
    `SELECT lr.*, 
            CONCAT_WS(' ', u.title_th, u.first_name_th, u.last_name_th) AS borrower_name,
            u.position_th AS borrower_position,
            d.name_th AS department_name_th,
            lt.name_th AS loan_type_name_th,
            fs.name_th AS funding_source_name_th,
            ls.name_th AS status_name_th
     FROM loan_requests lr
     JOIN users u ON u.id = lr.borrower_id
     LEFT JOIN departments d ON d.id = lr.department_id
     LEFT JOIN loan_types lt ON lt.id = lr.loan_type_id
     LEFT JOIN funding_sources fs ON fs.id = lr.funding_source_id
     JOIN loan_statuses ls ON ls.code = lr.status_code
     WHERE lr.id = :loanId AND lr.deleted_at IS NULL`,
    { loanId }
  );

  if (!loan) {
    throw new ApiError(404, "Loan request not found");
  }

  const payments = await queryRows<RowDataPacket[]>(
    `SELECT payment_method, amount, paid_date, plan_name, fund_name, payment_detail_no, cheque_no
     FROM loan_payments
     WHERE loan_request_id = :loanId AND deleted_at IS NULL
     ORDER BY paid_date DESC, id DESC`,
    { loanId }
  );

  return {
    title: "สัญญายืมเงิน",
    subtitle: "มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน วิทยาเขตสุรินทร์",
    documentNo: String(loan.contract_no ?? loan.request_no),
    date: formatDate(loan.requested_at),
    sections: [
      {
        title: "ข้อมูลผู้ยืม",
        rows: [
          ["ชื่อผู้ยืม", text(loan.borrower_name)],
          ["ตำแหน่ง", text(loan.borrower_position)],
          ["หน่วยงาน", text(loan.department_name_th)]
        ]
      },
      {
        title: "รายละเอียดการยืม",
        rows: [
          ["เลขที่คำขอ", text(loan.request_no)],
          ["เลขที่สัญญา", text(loan.contract_no)],
          ["ประเภทการยืม", text(loan.loan_type_name_th)],
          ["แหล่งเงิน", text(loan.funding_source_name_th)],
          ["วัตถุประสงค์", text(loan.objective)],
          ["ชื่อโครงการ/กิจกรรม", text(loan.project_name)],
          ["จำนวนเงิน", formatMoney(loan.amount)],
          ["ยอดคงค้าง", formatMoney(loan.current_balance)],
          ["วันที่ครบกำหนด", formatDate(loan.due_date)],
          ["สถานะ", text(loan.status_name_th)]
        ]
      },
      {
        title: "ข้อมูลการจ่ายเงินล่าสุด",
        rows: payments[0]
          ? [
              ["วิธีจ่ายเงิน", paymentLabel(String(payments[0].payment_method))],
              ["จำนวนเงินที่จ่าย", formatMoney(payments[0].amount)],
              ["วันที่จ่ายเงิน", formatDate(payments[0].paid_date)],
              ["เลขที่ใบรายละเอียดการจ่าย", text(payments[0].payment_detail_no)],
              ["แผนงาน", text(payments[0].plan_name)],
              ["กองทุน", text(payments[0].fund_name)]
            ]
          : [["ข้อมูลการจ่ายเงิน", "ยังไม่มีการบันทึกจ่ายเงิน"]]
      }
    ],
    body: [
      "ผู้ยืมขอรับเงินยืมตามรายละเอียดข้างต้น และยินยอมส่งใช้เงินยืมตามกำหนดเวลาที่ระบุในระบบ",
      "เอกสารนี้ออกจากระบบบริหารลูกหนี้เงินยืม เพื่อใช้ประกอบการตรวจสอบและดำเนินการภายในหน่วยงาน"
    ],
    signatureLabels: ["ลงชื่อผู้ยืม", "ลงชื่อเจ้าหน้าที่การเงิน", "ลงชื่อผู้อนุมัติ"]
  };
}

export async function getPaymentDocumentPayload(loanId: number): Promise<DocumentPayload> {
  const payment = await queryOne<RowDataPacket>(
    `SELECT lp.*, lr.request_no, lr.contract_no,
            CONCAT_WS(' ', u.title_th, u.first_name_th, u.last_name_th) AS borrower_name,
            d.name_th AS department_name_th
     FROM loan_payments lp
     JOIN loan_requests lr ON lr.id = lp.loan_request_id
     JOIN users u ON u.id = lr.borrower_id
     LEFT JOIN departments d ON d.id = lr.department_id
     WHERE lp.loan_request_id = :loanId AND lp.deleted_at IS NULL
     ORDER BY lp.paid_date DESC, lp.id DESC
     LIMIT 1`,
    { loanId }
  );

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  return {
    title: "ใบรายละเอียดการจ่ายเงิน",
    subtitle: "มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน วิทยาเขตสุรินทร์",
    documentNo: text(payment.payment_detail_no) || text(payment.contract_no),
    date: formatDate(payment.paid_date),
    sections: [
      {
        title: "ข้อมูลรายการ",
        rows: [
          ["เลขที่คำขอ", text(payment.request_no)],
          ["เลขที่สัญญา", text(payment.contract_no)],
          ["ผู้รับเงิน", text(payment.borrower_name)],
          ["หน่วยงาน", text(payment.department_name_th)],
          ["วิธีจ่ายเงิน", paymentLabel(String(payment.payment_method))],
          ["จำนวนเงิน", formatMoney(payment.amount)],
          ["วันที่จ่ายเงิน", formatDate(payment.paid_date)],
          ["แผนงาน", text(payment.plan_name)],
          ["กองทุน", text(payment.fund_name)],
          ["เลขที่เช็ค", text(payment.cheque_no)]
        ]
      }
    ],
    signatureLabels: ["ผู้รับเงิน", "ผู้จ่ายเงิน", "ผู้ตรวจสอบ"]
  };
}

export async function getExtensionDocumentPayload(extensionId: number): Promise<DocumentPayload> {
  const extension = await queryOne<RowDataPacket>(
    `SELECT le.*, lr.request_no, lr.contract_no, lr.current_balance,
            CONCAT_WS(' ', u.title_th, u.first_name_th, u.last_name_th) AS borrower_name,
            d.name_th AS department_name_th
     FROM loan_extensions le
     JOIN loan_requests lr ON lr.id = le.loan_request_id
     JOIN users u ON u.id = le.requested_by
     LEFT JOIN departments d ON d.id = lr.department_id
     WHERE le.id = :extensionId AND le.deleted_at IS NULL`,
    { extensionId }
  );

  if (!extension) {
    throw new ApiError(404, "Extension request not found");
  }

  return {
    title: "บันทึกข้อความขอขยายอายุสัญญาเงินยืม",
    subtitle: "มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน วิทยาเขตสุรินทร์",
    documentNo: text(extension.contract_no) || text(extension.request_no),
    date: formatDate(extension.requested_at),
    sections: [
      {
        title: "รายละเอียดการขอขยายอายุ",
        rows: [
          ["ผู้ขอขยายอายุ", text(extension.borrower_name)],
          ["หน่วยงาน", text(extension.department_name_th)],
          ["เลขที่คำขอ", text(extension.request_no)],
          ["เลขที่สัญญา", text(extension.contract_no)],
          ["ยอดคงค้าง", formatMoney(extension.current_balance)],
          ["วันครบกำหนดเดิม", formatDate(extension.original_due_date)],
          ["วันที่ขอขยายถึง", formatDate(extension.requested_due_date)],
          ["วันที่อนุมัติให้ขยายถึง", formatDate(extension.approved_due_date)],
          ["สถานะคำขอ", extensionStatusLabel(String(extension.status))]
        ]
      }
    ],
    body: [text(extension.reason), text(extension.review_note)].filter(Boolean),
    signatureLabels: ["ผู้ขอขยายอายุ", "เจ้าหน้าที่การเงิน", "ผู้อนุมัติ"]
  };
}

export async function getNoticeDocumentPayload(noticeId: number): Promise<DocumentPayload> {
  const notice = await queryOne<RowDataPacket>(
    `SELECT dnl.*, lr.request_no, lr.contract_no, lr.due_date, lr.current_balance,
            CONCAT_WS(' ', u.title_th, u.first_name_th, u.last_name_th) AS borrower_name,
            d.name_th AS department_name_th
     FROM debt_notice_letters dnl
     JOIN loan_requests lr ON lr.id = dnl.loan_request_id
     JOIN users u ON u.id = lr.borrower_id
     LEFT JOIN departments d ON d.id = lr.department_id
     WHERE dnl.id = :noticeId AND dnl.deleted_at IS NULL`,
    { noticeId }
  );

  if (!notice) {
    throw new ApiError(404, "Debt notice not found");
  }

  return {
    title: text(notice.subject) || "บันทึกข้อความทวงเงินยืม",
    subtitle: text(notice.government_unit),
    documentNo: text(notice.notice_no),
    date: formatDate(notice.document_date),
    sections: [
      {
        title: "ข้อมูลลูกหนี้เงินยืม",
        rows: [
          ["ผู้ยืม", text(notice.borrower_name)],
          ["หน่วยงาน", text(notice.department_name_th)],
          ["เลขที่คำขอ", text(notice.request_no)],
          ["เลขที่สัญญา", text(notice.contract_no)],
          ["วันครบกำหนด", formatDate(notice.due_date)],
          ["ยอดคงค้าง", formatMoney(notice.current_balance)]
        ]
      }
    ],
    body: [text(notice.details), text(notice.identity_text)].filter(Boolean),
    signatureLabels: ["เจ้าหน้าที่การเงิน", "หัวหน้างานการเงิน"]
  };
}

export async function getSummaryReportPayload(): Promise<DocumentPayload> {
  const summary = await queryOne<RowDataPacket>(
    `SELECT
       COUNT(1) AS total_loans,
       COALESCE(SUM(amount), 0) AS total_amount,
       COALESCE(SUM(current_balance), 0) AS outstanding_amount,
       SUM(CASE WHEN due_date < CURRENT_DATE AND current_balance > 0 THEN 1 ELSE 0 END) AS overdue_count
     FROM loan_requests
     WHERE deleted_at IS NULL`
  );
  const statuses = await queryRows<RowDataPacket[]>(
    `SELECT ls.name_th, COUNT(lr.id) AS total
     FROM loan_statuses ls
     LEFT JOIN loan_requests lr ON lr.status_code = ls.code AND lr.deleted_at IS NULL
     GROUP BY ls.code, ls.name_th, ls.sort_order
     ORDER BY ls.sort_order`
  );

  return {
    title: "รายงานสรุปลูกหนี้เงินยืม",
    subtitle: "มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน วิทยาเขตสุรินทร์",
    date: formatDate(new Date()),
    sections: [
      {
        title: "ภาพรวม",
        rows: [
          ["จำนวนรายการทั้งหมด", text(summary?.total_loans)],
          ["ยอดเงินยืมรวม", formatMoney(summary?.total_amount)],
          ["ยอดลูกหนี้คงค้าง", formatMoney(summary?.outstanding_amount)],
          ["จำนวนรายการเกินกำหนด", text(summary?.overdue_count)]
        ]
      },
      {
        title: "จำนวนรายการตามสถานะ",
        rows: statuses.map((status) => [text(status.name_th), text(status.total)])
      }
    ],
    signatureLabels: ["ผู้จัดทำรายงาน", "ผู้ตรวจสอบ"]
  };
}

export function formatMoney(value: unknown) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2
  }).format(amount);
}

export function formatDate(value: unknown) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeZone: "Asia/Bangkok"
  }).format(new Date(String(value)));
}

function text(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function paymentLabel(value: string) {
  const labels: Record<string, string> = {
    cash: "เงินสด",
    bank_transfer: "โอนเงิน",
    cheque: "เช็ค",
    other: "อื่นๆ"
  };
  return labels[value] ?? value;
}

function extensionStatusLabel(value: string) {
  const labels: Record<string, string> = {
    requested: "รอตรวจสอบ",
    approved: "อนุมัติ",
    rejected: "ไม่อนุมัติ",
    cancelled: "ยกเลิก"
  };
  return labels[value] ?? value;
}

