import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import { z } from "zod";
import { db, generateDocumentNo, queryRows } from "../../lib/db.js";
import { ApiError, asyncHandler, parseId, validateBody } from "../../lib/http.js";

export const paymentsRouter = Router();

const paymentSchema = z.object({
  payment_method: z.enum(["cash", "bank_transfer", "cheque", "other"]),
  amount: z.number().positive(),
  paid_date: z.string().date(),
  plan_name: z.string().max(255).nullable().optional(),
  fund_name: z.string().max(255).nullable().optional(),
  payment_detail_no: z.string().max(100).nullable().optional(),
  cheque_no: z.string().max(100).nullable().optional(),
  bank_account_no: z.string().max(100).nullable().optional(),
  note: z.string().nullable().optional(),
  recorded_by: z.number().int().positive().nullable().optional()
});

paymentsRouter.get(
  "/loan/:loanId",
  asyncHandler(async (req, res) => {
    const loanId = parseId(req.params.loanId);
    const rows = await queryRows<RowDataPacket[]>(
      `SELECT lp.*, CONCAT_WS(' ', u.title_th, u.first_name_th, u.last_name_th) AS recorded_by_name
       FROM loan_payments lp
       LEFT JOIN users u ON u.id = lp.recorded_by
       WHERE lp.loan_request_id = :loanId AND lp.deleted_at IS NULL
       ORDER BY lp.paid_date DESC, lp.id DESC`,
      { loanId }
    );
    res.json({ data: rows });
  })
);

paymentsRouter.post(
  "/loan/:loanId",
  asyncHandler(async (req, res) => {
    const loanId = parseId(req.params.loanId);
    const body = validateBody(paymentSchema, req.body);
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [[loan]] = await connection.query<RowDataPacket[]>(
        "SELECT id, amount, status_code, contract_no FROM loan_requests WHERE id = :loanId AND deleted_at IS NULL FOR UPDATE",
        { loanId }
      );
      if (!loan) {
        throw new ApiError(404, "Loan request not found");
      }
      const contractNo = loan.contract_no ?? (await generateDocumentNo("LC", "loan_requests", "contract_no"));
      const [result] = await connection.execute(
        `INSERT INTO loan_payments (
          loan_request_id, payment_method, amount, paid_date, plan_name, fund_name,
          payment_detail_no, cheque_no, bank_account_no, note, recorded_by
        ) VALUES (
          :loanId, :payment_method, :amount, :paid_date, :plan_name, :fund_name,
          :payment_detail_no, :cheque_no, :bank_account_no, :note, :recorded_by
        )`,
        {
          loanId,
          ...body,
          plan_name: body.plan_name ?? null,
          fund_name: body.fund_name ?? null,
          payment_detail_no: body.payment_detail_no ?? null,
          cheque_no: body.cheque_no ?? null,
          bank_account_no: body.bank_account_no ?? null,
          note: body.note ?? null,
          recorded_by: body.recorded_by ?? null
        }
      );
      await connection.execute(
        `UPDATE loan_requests
         SET status_code = 'paid', paid_at = :paid_at, contract_no = :contract_no, current_balance = amount
         WHERE id = :loanId`,
        { loanId, paid_at: body.paid_date, contract_no: contractNo }
      );
      await connection.execute(
        `INSERT INTO loan_approvals (loan_request_id, step, from_status_code, to_status_code, action, actor_id, note)
         VALUES (:loanId, 'payment_status', :from_status_code, 'paid', 'update_status', :actor_id, :note)`,
        { loanId, from_status_code: loan.status_code, actor_id: body.recorded_by ?? null, note: body.note ?? null }
      );
      await connection.commit();
      res.status(201).json({ data: { id: Number((result as { insertId: number }).insertId), contract_no: contractNo } });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);
