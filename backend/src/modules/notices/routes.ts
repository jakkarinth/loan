import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import { z } from "zod";
import { execute, generateDocumentNo, queryOne, queryRows } from "../../lib/db.js";
import { asyncHandler, getPagination, parseId, sendList, validateBody } from "../../lib/http.js";

export const noticesRouter = Router();

const noticeSchema = z.object({
  loan_request_id: z.number().int().positive(),
  notice_no: z.string().trim().max(100).optional(),
  government_unit: z.string().trim().min(2).max(255),
  document_date: z.string().date(),
  subject: z.string().trim().min(2).max(255),
  details: z.string().nullable().optional(),
  identity_text: z.string().max(255).nullable().optional(),
  issued_by: z.number().int().positive().nullable().optional()
});

noticesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, pageSize, offset } = getPagination(req);
    const search = String(req.query.search ?? "").trim();
    const where = ["dnl.deleted_at IS NULL"];
    const params: Record<string, unknown> = { limit: pageSize, offset };

    if (search) {
      where.push("(dnl.notice_no LIKE :search OR lr.contract_no LIKE :search OR lr.request_no LIKE :search OR dnl.subject LIKE :search)");
      params.search = `%${search}%`;
    }

    const whereSql = where.join(" AND ");
    const rows = await queryRows<RowDataPacket[]>(
      `SELECT dnl.*, lr.request_no, lr.contract_no, lr.current_balance,
              CONCAT_WS(' ', u.title_th, u.first_name_th, u.last_name_th) AS borrower_name
       FROM debt_notice_letters dnl
       JOIN loan_requests lr ON lr.id = dnl.loan_request_id
       JOIN users u ON u.id = lr.borrower_id
       WHERE ${whereSql}
       ORDER BY dnl.document_date DESC, dnl.id DESC
       LIMIT :limit OFFSET :offset`,
      params
    );
    const totalRow = await queryOne<RowDataPacket>(
      `SELECT COUNT(1) AS total
       FROM debt_notice_letters dnl
       JOIN loan_requests lr ON lr.id = dnl.loan_request_id
       WHERE ${whereSql}`,
      params
    );
    sendList(res, rows, Number(totalRow?.total ?? 0), page, pageSize);
  })
);

noticesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const row = await queryOne<RowDataPacket>(
      `SELECT dnl.*, lr.request_no, lr.contract_no, lr.current_balance,
              CONCAT_WS(' ', u.title_th, u.first_name_th, u.last_name_th) AS borrower_name,
              d.name_th AS department_name_th
       FROM debt_notice_letters dnl
       JOIN loan_requests lr ON lr.id = dnl.loan_request_id
       JOIN users u ON u.id = lr.borrower_id
       LEFT JOIN departments d ON d.id = lr.department_id
       WHERE dnl.id = :id AND dnl.deleted_at IS NULL`,
      { id }
    );
    if (!row) res.status(404).json({ message: "Debt notice not found" });
    else res.json({ data: row });
  })
);

noticesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = validateBody(noticeSchema, req.body);
    const noticeNo = body.notice_no ?? (await generateDocumentNo("DN", "debt_notice_letters", "notice_no"));
    const result = await execute(
      `INSERT INTO debt_notice_letters (
        loan_request_id, notice_no, government_unit, document_date, subject,
        details, identity_text, issued_by
      ) VALUES (
        :loan_request_id, :notice_no, :government_unit, :document_date, :subject,
        :details, :identity_text, :issued_by
      )`,
      {
        ...body,
        notice_no: noticeNo,
        details: body.details ?? null,
        identity_text: body.identity_text ?? null,
        issued_by: body.issued_by ?? null
      }
    );
    res.status(201).json({ data: { id: result.insertId, notice_no: noticeNo } });
  })
);

noticesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    await execute(
      "UPDATE debt_notice_letters SET deleted_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL",
      { id }
    );
    res.status(204).send();
  })
);

