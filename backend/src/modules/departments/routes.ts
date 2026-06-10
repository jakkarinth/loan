import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import { z } from "zod";
import { buildSetClause, changedRowsOrNotFound, execute, queryOne, queryRows } from "../../lib/db.js";
import { asyncHandler, getPagination, parseId, sendList, validateBody } from "../../lib/http.js";

export const departmentsRouter = Router();

const departmentSchema = z.object({
  parent_id: z.number().int().positive().nullable().optional(),
  code: z.string().trim().min(2).max(50),
  name_th: z.string().trim().min(2).max(255),
  name_en: z.string().trim().max(255).nullable().optional(),
  phone: z.string().trim().max(50).nullable().optional(),
  email: z.string().trim().email().max(255).nullable().optional(),
  is_active: z.boolean().optional()
});

const updateDepartmentSchema = departmentSchema.partial().omit({ code: true });

departmentsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, pageSize, offset } = getPagination(req);
    const search = String(req.query.search ?? "").trim();
    const where = ["deleted_at IS NULL"];
    const params: Record<string, unknown> = { limit: pageSize, offset };

    if (search) {
      where.push("(code LIKE :search OR name_th LIKE :search OR name_en LIKE :search)");
      params.search = `%${search}%`;
    }

    const whereSql = where.join(" AND ");
    const rows = await queryRows<RowDataPacket[]>(
      `SELECT id, parent_id, code, name_th, name_en, phone, email, is_active, created_at, updated_at
       FROM departments
       WHERE ${whereSql}
       ORDER BY code
       LIMIT :limit OFFSET :offset`,
      params
    );
    const totalRow = await queryOne<RowDataPacket>(
      `SELECT COUNT(1) AS total FROM departments WHERE ${whereSql}`,
      params
    );

    sendList(res, rows, Number(totalRow?.total ?? 0), page, pageSize);
  })
);

departmentsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const row = await queryOne<RowDataPacket>(
      `SELECT d.*, p.name_th AS parent_name_th
       FROM departments d
       LEFT JOIN departments p ON p.id = d.parent_id
       WHERE d.id = :id AND d.deleted_at IS NULL`,
      { id }
    );
    if (!row) res.status(404).json({ message: "Department not found" });
    else res.json({ data: row });
  })
);

departmentsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = validateBody(departmentSchema, req.body);
    const result = await execute(
      `INSERT INTO departments (parent_id, code, name_th, name_en, phone, email, is_active)
       VALUES (:parent_id, :code, :name_th, :name_en, :phone, :email, :is_active)`,
      {
        ...body,
        parent_id: body.parent_id ?? null,
        name_en: body.name_en ?? null,
        phone: body.phone ?? null,
        email: body.email ?? null,
        is_active: body.is_active ?? true
      }
    );
    res.status(201).json({ data: { id: result.insertId } });
  })
);

departmentsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const body = validateBody(updateDepartmentSchema, req.body);
    const { clause, values } = buildSetClause(body);
    const result = await execute(
      `UPDATE departments SET ${clause} WHERE id = :id AND deleted_at IS NULL`,
      { ...values, id }
    );
    changedRowsOrNotFound(result);
    res.json({ data: { id } });
  })
);

departmentsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const result = await execute(
      "UPDATE departments SET deleted_at = CURRENT_TIMESTAMP WHERE id = :id AND deleted_at IS NULL",
      { id }
    );
    changedRowsOrNotFound(result);
    res.status(204).send();
  })
);

