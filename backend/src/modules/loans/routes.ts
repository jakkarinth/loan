import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import { z } from "zod";
import { buildSetClause, changedRowsOrNotFound, db, execute, generateDocumentNo, queryOne, queryRows } from "../../lib/db.js";
import { ApiError, asyncHandler, getPagination, parseId, sendList, validateBody } from "../../lib/http.js";

export const loansRouter = Router();

const loanSchema = z.object({
  borrower_id: z.number().int().positive(),
  department_id: z.number().int().positive().nullable().optional(),
  loan_type_id: z.number().int().positive().nullable().optional(),
  funding_source_id: z.number().int().positive().nullable().optional(),
  due_date_rule_id: z.number().int().positive().nullable().optional(),
  objective: z.string().trim().min(3),
  project_name: z.string().trim().max(255).nullable().optional(),
  project_start_date: z.string().date().nullable().optional(),
  project_end_date: z.string().date().nullable().optional(),
  amount: z.number().positive(),
  due_date: z.string().date().nullable().optional(),
  remark: z.string().nullable().optional(),
  created_by: z.number().int().positive().nullable().optional()
});

const updateLoanSchema = loanSchema.partial().omit({ borrower_id: true, created_by: true });

const statusSchema = z.object({
  to_status_code: z.string().trim().min(2).max(50),
  step: z.enum(["department_review", "budget_review", "finance_review", "approval", "payment_status", "extension_review"]),
  action: z.enum(["submit", "approve", "reject", "return", "update_status", "cancel"]).default("update_status"),
  actor_id: z.number().int().positive().nullable().optional(),
  note: z.string().nullable().optional(),
  loan_type_id: z.number().int().positive().nullable().optional(),
  funding_source_id: z.number().int().positive().nullable().optional(),
  due_date_rule_id: z.number().int().positive().nullable().optional(),
  due_date: z.string().date().nullable().optional()
});

function loanSelect() {
  return `SELECT lr.*, 
                 CONCAT_WS(' ', u.title_th, u.first_name_th, u.last_name_th) AS borrower_name,
                 u.email AS borrower_email,
                 d.name_th AS department_name_th,
                 lt.name_th AS loan_type_name_th,
                 fs.name_th AS funding_source_name_th,
                 ls.name_th AS status_name_th
          FROM loan_requests lr
          JOIN users u ON u.id = lr.borrower_id
          LEFT JOIN departments d ON d.id = lr.department_id
          LEFT JOIN loan_types lt ON lt.id = lr.loan_type_id
          LEFT JOIN funding_sources fs ON fs.id = lr.funding_source_id
          JOIN loan_statuses ls ON ls.code = lr.status_code`;
}

loansRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, pageSize, offset } = getPagination(req);
    const where = ["lr.deleted_at IS NULL"];
    const params: Record<string, unknown> = { limit: pageSize, offset };

    const search = String(req.query.search ?? "").trim();
    if (search) {
      where.push("(lr.request_no LIKE :search OR lr.contract_no LIKE :search OR lr.project_name LIKE :search OR u.first_name_th LIKE :search OR u.last_name_th LIKE :search)");
      params.search = `%${search}%`;
    }
    if (req.query.status_code) {
      where.push("lr.status_code = :status_code");
      params.status_code = String(req.query.status_code);
    }
    if (req.query.borrower_id) {
      where.push("lr.borrower_id = :borrower_id");
      params.borrower_id = Number(req.query.borrower_id);
    }
    if (req.query.department_id) {
      where.push("lr.department_id = :department_id");
      params.department_id = Number(req.query.department_id);
    }

    const whereSql = where.join(" AND ");
    const rows = await queryRows<RowDataPacket[]>(
      `${loanSelect()}
       WHERE ${whereSql}
       ORDER BY lr.created_at DESC
       LIMIT :limit OFFSET :offset`,
      params
    );
    const countRow = await queryOne<RowDataPacket>(
      `SELECT COUNT(1) AS total
       FROM loan_requests lr
       JOIN users u ON u.id = lr.borrower_id
       WHERE ${whereSql}`,
      params
    );

    sendList(res, rows, Number(countRow?.total ?? 0), page, pageSize);
  })
);

loansRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const row = await queryOne<RowDataPacket>(
      `${loanSelect()} WHERE lr.id = :id AND lr.deleted_at IS NULL`,
      { id }
    );
    if (!row) {
      res.status(404).json({ message: "Loan request not found" });
      return;
    }
    const approvals = await queryRows<RowDataPacket[]>(
      `SELECT la.*, CONCAT_WS(' ', u.title_th, u.first_name_th, u.last_name_th) AS actor_name
       FROM loan_approvals la
       LEFT JOIN users u ON u.id = la.actor_id
       WHERE la.loan_request_id = :id
       ORDER BY la.acted_at DESC`,
      { id }
    );
    res.json({ data: { ...row, approvals } });
  })
);

loansRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = validateBody(loanSchema, req.body);
    const requestNo = await generateDocumentNo("LR", "loan_requests", "request_no");
    const result = await execute(
      `INSERT INTO loan_requests (
        request_no, borrower_id, department_id, loan_type_id, funding_source_id, due_date_rule_id,
        status_code, objective, project_name, project_start_date, project_end_date, amount,
        due_date, current_balance, remark, created_by
      ) VALUES (
        :request_no, :borrower_id, :department_id, :loan_type_id, :funding_source_id, :due_date_rule_id,
        'draft', :objective, :project_name, :project_start_date, :project_end_date, :amount,
        :due_date, :current_balance, :remark, :created_by
      )`,
      {
        ...body,
        request_no: requestNo,
        department_id: body.department_id ?? null,
        loan_type_id: body.loan_type_id ?? null,
        funding_source_id: body.funding_source_id ?? null,
        due_date_rule_id: body.due_date_rule_id ?? null,
        project_name: body.project_name ?? null,
        project_start_date: body.project_start_date ?? null,
        project_end_date: body.project_end_date ?? null,
        due_date: body.due_date ?? null,
        current_balance: body.amount,
        remark: body.remark ?? null,
        created_by: body.created_by ?? body.borrower_id
      }
    );
    res.status(201).json({ data: { id: result.insertId, request_no: requestNo } });
  })
);

loansRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const body = validateBody(updateLoanSchema, req.body);
    const { clause, values } = buildSetClause(body);
    const result = await execute(
      `UPDATE loan_requests SET ${clause} WHERE id = :id AND deleted_at IS NULL`,
      { ...values, id }
    );
    changedRowsOrNotFound(result);
    res.json({ data: { id } });
  })
);

loansRouter.post(
  "/:id/submit",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const body = validateBody(z.object({ actor_id: z.number().int().positive().nullable().optional(), note: z.string().nullable().optional() }), req.body);
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [[loan]] = await connection.query<RowDataPacket[]>(
        "SELECT status_code FROM loan_requests WHERE id = :id AND deleted_at IS NULL FOR UPDATE",
        { id }
      );
      if (!loan) {
        throw new ApiError(404, "Loan request not found");
      }
      await connection.execute(
        "UPDATE loan_requests SET status_code = 'pending_department_review', submitted_at = CURRENT_TIMESTAMP WHERE id = :id",
        { id }
      );
      await connection.execute(
        `INSERT INTO loan_approvals (loan_request_id, step, from_status_code, to_status_code, action, actor_id, note)
         VALUES (:id, 'department_review', :from_status_code, 'pending_department_review', 'submit', :actor_id, :note)`,
        { id, from_status_code: loan.status_code, actor_id: body.actor_id ?? null, note: body.note ?? null }
      );
      await connection.commit();
      res.json({ data: { id, status_code: "pending_department_review" } });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);

loansRouter.post(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const body = validateBody(statusSchema, req.body);
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [[loan]] = await connection.query<RowDataPacket[]>(
        "SELECT status_code FROM loan_requests WHERE id = :id AND deleted_at IS NULL FOR UPDATE",
        { id }
      );
      if (!loan) {
        throw new ApiError(404, "Loan request not found");
      }
      const updateData: Record<string, unknown> = {
        status_code: body.to_status_code,
        loan_type_id: body.loan_type_id,
        funding_source_id: body.funding_source_id,
        due_date_rule_id: body.due_date_rule_id,
        due_date: body.due_date
      };
      if (body.to_status_code === "approved") updateData.approved_at = new Date();
      const { clause, values } = buildSetClause(updateData);
      await connection.execute(`UPDATE loan_requests SET ${clause} WHERE id = :id`, { ...values, id });
      await connection.execute(
        `INSERT INTO loan_approvals (loan_request_id, step, from_status_code, to_status_code, action, actor_id, note)
         VALUES (:id, :step, :from_status_code, :to_status_code, :action, :actor_id, :note)`,
        {
          id,
          step: body.step,
          from_status_code: loan.status_code,
          to_status_code: body.to_status_code,
          action: body.action ?? "update_status",
          actor_id: body.actor_id ?? null,
          note: body.note ?? null
        }
      );
      await connection.commit();
      res.json({ data: { id, status_code: body.to_status_code } });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);

loansRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const result = await execute(
      "UPDATE loan_requests SET deleted_at = CURRENT_TIMESTAMP, status_code = 'cancelled' WHERE id = :id AND deleted_at IS NULL",
      { id }
    );
    changedRowsOrNotFound(result);
    res.status(204).send();
  })
);
