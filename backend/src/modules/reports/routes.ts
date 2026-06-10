import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import { queryRows } from "../../lib/db.js";
import { asyncHandler } from "../../lib/http.js";

export const reportsRouter = Router();

reportsRouter.get(
  "/dashboard",
  asyncHandler(async (_req, res) => {
    const [summary] = await queryRows<RowDataPacket[]>(
      `SELECT
         COUNT(1) AS total_loans,
         COALESCE(SUM(amount), 0) AS total_amount,
         COALESCE(SUM(current_balance), 0) AS outstanding_amount,
         SUM(CASE WHEN status_code IN ('pending_department_review', 'pending_university_finance_review', 'pending_department_approval', 'budget_reviewed', 'finance_reviewed') THEN 1 ELSE 0 END) AS pending_count,
         SUM(CASE WHEN due_date < CURRENT_DATE AND current_balance > 0 THEN 1 ELSE 0 END) AS overdue_count
       FROM loan_requests
       WHERE deleted_at IS NULL`
    );

    const byDepartment = await queryRows<RowDataPacket[]>(
      `SELECT COALESCE(d.name_th, 'ไม่ระบุหน่วยงาน') AS department_name_th,
              COUNT(1) AS total_loans,
              COALESCE(SUM(lr.amount), 0) AS total_amount,
              COALESCE(SUM(lr.current_balance), 0) AS outstanding_amount
       FROM loan_requests lr
       LEFT JOIN departments d ON d.id = lr.department_id
       WHERE lr.deleted_at IS NULL
       GROUP BY lr.department_id, d.name_th
       ORDER BY outstanding_amount DESC`
    );

    const byStatus = await queryRows<RowDataPacket[]>(
      `SELECT ls.code, ls.name_th, COUNT(lr.id) AS total
       FROM loan_statuses ls
       LEFT JOIN loan_requests lr ON lr.status_code = ls.code AND lr.deleted_at IS NULL
       GROUP BY ls.code, ls.name_th, ls.sort_order
       ORDER BY ls.sort_order`
    );

    res.json({
      data: {
        summary,
        by_department: byDepartment,
        by_status: byStatus
      }
    });
  })
);

reportsRouter.get(
  "/overdue",
  asyncHandler(async (_req, res) => {
    const rows = await queryRows<RowDataPacket[]>(
      `SELECT lr.id, lr.request_no, lr.contract_no, lr.due_date, lr.amount, lr.current_balance,
              DATEDIFF(CURRENT_DATE, lr.due_date) AS overdue_days,
              CONCAT_WS(' ', u.title_th, u.first_name_th, u.last_name_th) AS borrower_name,
              d.name_th AS department_name_th
       FROM loan_requests lr
       JOIN users u ON u.id = lr.borrower_id
       LEFT JOIN departments d ON d.id = lr.department_id
       WHERE lr.deleted_at IS NULL
         AND lr.due_date < CURRENT_DATE
         AND lr.current_balance > 0
       ORDER BY overdue_days DESC`
    );
    res.json({ data: rows });
  })
);

reportsRouter.get(
  "/repayments",
  asyncHandler(async (req, res) => {
    const from = String(req.query.from ?? "1900-01-01");
    const to = String(req.query.to ?? "2999-12-31");
    const rows = await queryRows<RowDataPacket[]>(
      `SELECT lr.request_no, lr.contract_no, rp.repayment_date, rp.repayment_type, rp.amount,
              rp.receipt_no, rp.cheque_no, rp.voucher_no,
              CONCAT_WS(' ', u.title_th, u.first_name_th, u.last_name_th) AS borrower_name
       FROM loan_repayments rp
       JOIN loan_requests lr ON lr.id = rp.loan_request_id
       JOIN users u ON u.id = lr.borrower_id
       WHERE rp.deleted_at IS NULL
         AND rp.repayment_date BETWEEN :from AND :to
       ORDER BY rp.repayment_date DESC, rp.id DESC`,
      { from, to }
    );
    res.json({ data: rows });
  })
);

