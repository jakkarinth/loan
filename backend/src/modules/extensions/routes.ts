import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import { z } from "zod";
import { db, queryRows } from "../../lib/db.js";
import { ApiError, asyncHandler, parseId, validateBody } from "../../lib/http.js";

export const extensionsRouter = Router();

const extensionRequestSchema = z.object({
  requested_by: z.number().int().positive(),
  requested_due_date: z.string().date(),
  reason: z.string().trim().min(3)
});

const extensionReviewSchema = z.object({
  status: z.enum(["approved", "rejected", "cancelled"]),
  reviewed_by: z.number().int().positive().nullable().optional(),
  approved_due_date: z.string().date().nullable().optional(),
  review_note: z.string().nullable().optional()
});

extensionsRouter.get(
  "/loan/:loanId",
  asyncHandler(async (req, res) => {
    const loanId = parseId(req.params.loanId);
    const rows = await queryRows<RowDataPacket[]>(
      `SELECT le.*, 
              CONCAT_WS(' ', requester.title_th, requester.first_name_th, requester.last_name_th) AS requested_by_name,
              CONCAT_WS(' ', reviewer.title_th, reviewer.first_name_th, reviewer.last_name_th) AS reviewed_by_name
       FROM loan_extensions le
       JOIN users requester ON requester.id = le.requested_by
       LEFT JOIN users reviewer ON reviewer.id = le.reviewed_by
       WHERE le.loan_request_id = :loanId AND le.deleted_at IS NULL
       ORDER BY le.created_at DESC`,
      { loanId }
    );
    res.json({ data: rows });
  })
);

extensionsRouter.post(
  "/loan/:loanId",
  asyncHandler(async (req, res) => {
    const loanId = parseId(req.params.loanId);
    const body = validateBody(extensionRequestSchema, req.body);
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [[loan]] = await connection.query<RowDataPacket[]>(
        "SELECT due_date, status_code FROM loan_requests WHERE id = :loanId AND deleted_at IS NULL FOR UPDATE",
        { loanId }
      );
      if (!loan) throw new ApiError(404, "Loan request not found");
      if (!loan.due_date) throw new ApiError(422, "Loan request has no due date");
      const [result] = await connection.execute(
        `INSERT INTO loan_extensions (loan_request_id, requested_by, original_due_date, requested_due_date, reason)
         VALUES (:loanId, :requested_by, :original_due_date, :requested_due_date, :reason)`,
        {
          loanId,
          requested_by: body.requested_by,
          original_due_date: loan.due_date,
          requested_due_date: body.requested_due_date,
          reason: body.reason
        }
      );
      await connection.execute(
        "UPDATE loan_requests SET status_code = 'extension_requested' WHERE id = :loanId",
        { loanId }
      );
      await connection.execute(
        `INSERT INTO loan_approvals (loan_request_id, step, from_status_code, to_status_code, action, actor_id, note)
         VALUES (:loanId, 'extension_review', :from_status_code, 'extension_requested', 'submit', :actor_id, :note)`,
        { loanId, from_status_code: loan.status_code, actor_id: body.requested_by, note: body.reason }
      );
      await connection.commit();
      res.status(201).json({ data: { id: Number((result as { insertId: number }).insertId) } });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);

extensionsRouter.post(
  "/:id/review",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const body = validateBody(extensionReviewSchema, req.body);
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [[extension]] = await connection.query<RowDataPacket[]>(
        "SELECT * FROM loan_extensions WHERE id = :id AND deleted_at IS NULL FOR UPDATE",
        { id }
      );
      if (!extension) throw new ApiError(404, "Extension request not found");
      const toStatus = body.status === "approved" ? "extension_approved" : "extension_rejected";
      const approvedDueDate = body.status === "approved" ? (body.approved_due_date ?? extension.requested_due_date) : null;
      await connection.execute(
        `UPDATE loan_extensions
         SET status = :status, reviewed_by = :reviewed_by, approved_due_date = :approved_due_date,
             review_note = :review_note, reviewed_at = CURRENT_TIMESTAMP
         WHERE id = :id`,
        {
          id,
          status: body.status,
          reviewed_by: body.reviewed_by ?? null,
          approved_due_date: approvedDueDate,
          review_note: body.review_note ?? null
        }
      );
      await connection.execute(
        `UPDATE loan_requests
         SET status_code = :toStatus,
             due_date = CASE WHEN :approvedDueDate IS NULL THEN due_date ELSE :approvedDueDate END
         WHERE id = :loanId`,
        { toStatus, approvedDueDate, loanId: extension.loan_request_id }
      );
      await connection.execute(
        `INSERT INTO loan_approvals (loan_request_id, step, from_status_code, to_status_code, action, actor_id, note)
         VALUES (:loanId, 'extension_review', 'extension_requested', :toStatus, :action, :actor_id, :note)`,
        {
          loanId: extension.loan_request_id,
          toStatus,
          action: body.status === "approved" ? "approve" : "reject",
          actor_id: body.reviewed_by ?? null,
          note: body.review_note ?? null
        }
      );
      await connection.commit();
      res.json({ data: { id, status: body.status, loan_status_code: toStatus } });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);

