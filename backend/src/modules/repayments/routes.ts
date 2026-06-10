import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import { z } from "zod";
import { db, queryRows } from "../../lib/db.js";
import { ApiError, asyncHandler, parseId, validateBody } from "../../lib/http.js";

export const repaymentsRouter = Router();

const repaymentSchema = z.object({
  repayment_type: z.enum(["cash", "cheque", "voucher", "bank_transfer", "other"]),
  amount: z.number().positive(),
  receipt_no: z.string().max(100).nullable().optional(),
  cheque_no: z.string().max(100).nullable().optional(),
  voucher_no: z.string().max(100).nullable().optional(),
  repayment_date: z.string().date(),
  note: z.string().nullable().optional(),
  recorded_by: z.number().int().positive().nullable().optional()
});

repaymentsRouter.get(
  "/loan/:loanId",
  asyncHandler(async (req, res) => {
    const loanId = parseId(req.params.loanId);
    const rows = await queryRows<RowDataPacket[]>(
      `SELECT lr.*, CONCAT_WS(' ', u.title_th, u.first_name_th, u.last_name_th) AS recorded_by_name
       FROM loan_repayments lr
       LEFT JOIN users u ON u.id = lr.recorded_by
       WHERE lr.loan_request_id = :loanId AND lr.deleted_at IS NULL
       ORDER BY lr.repayment_date DESC, lr.id DESC`,
      { loanId }
    );
    res.json({ data: rows });
  })
);

repaymentsRouter.post(
  "/loan/:loanId",
  asyncHandler(async (req, res) => {
    const loanId = parseId(req.params.loanId);
    const body = validateBody(repaymentSchema, req.body);
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [[loan]] = await connection.query<RowDataPacket[]>(
        "SELECT id, current_balance, status_code FROM loan_requests WHERE id = :loanId AND deleted_at IS NULL FOR UPDATE",
        { loanId }
      );
      if (!loan) {
        throw new ApiError(404, "Loan request not found");
      }
      const currentBalance = Number(loan.current_balance);
      if (body.amount > currentBalance) {
        throw new ApiError(422, "Repayment amount exceeds current balance");
      }
      const nextBalance = Number((currentBalance - body.amount).toFixed(2));
      const nextStatus = nextBalance === 0 ? "fully_repaid" : "partially_repaid";
      const [result] = await connection.execute(
        `INSERT INTO loan_repayments (
          loan_request_id, repayment_type, amount, receipt_no, cheque_no, voucher_no,
          repayment_date, note, recorded_by
        ) VALUES (
          :loanId, :repayment_type, :amount, :receipt_no, :cheque_no, :voucher_no,
          :repayment_date, :note, :recorded_by
        )`,
        {
          loanId,
          ...body,
          receipt_no: body.receipt_no ?? null,
          cheque_no: body.cheque_no ?? null,
          voucher_no: body.voucher_no ?? null,
          note: body.note ?? null,
          recorded_by: body.recorded_by ?? null
        }
      );
      await connection.execute(
        `UPDATE loan_requests
         SET current_balance = :nextBalance,
             status_code = :nextStatus,
             repayment_completed_at = CASE WHEN :nextBalance = 0 THEN CURRENT_TIMESTAMP ELSE repayment_completed_at END
         WHERE id = :loanId`,
        { loanId, nextBalance, nextStatus }
      );
      await connection.execute(
        `INSERT INTO loan_approvals (loan_request_id, step, from_status_code, to_status_code, action, actor_id, note)
         VALUES (:loanId, 'payment_status', :from_status_code, :to_status_code, 'update_status', :actor_id, :note)`,
        {
          loanId,
          from_status_code: loan.status_code,
          to_status_code: nextStatus,
          actor_id: body.recorded_by ?? null,
          note: body.note ?? null
        }
      );
      await connection.commit();
      res.status(201).json({
        data: {
          id: Number((result as { insertId: number }).insertId),
          current_balance: nextBalance,
          status_code: nextStatus
        }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);

