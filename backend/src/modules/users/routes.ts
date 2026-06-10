import { Router } from "express";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";
import { z } from "zod";
import { buildSetClause, changedRowsOrNotFound, db, execute, queryOne, queryRows } from "../../lib/db.js";
import { asyncHandler, getPagination, parseId, sendList, validateBody } from "../../lib/http.js";

export const usersRouter = Router();

const userSchema = z.object({
  department_id: z.number().int().positive().nullable().optional(),
  employee_code: z.string().trim().max(50).nullable().optional(),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128).optional(),
  title_th: z.string().trim().max(50).nullable().optional(),
  first_name_th: z.string().trim().min(1).max(150),
  last_name_th: z.string().trim().min(1).max(150),
  position_th: z.string().trim().max(150).nullable().optional(),
  phone: z.string().trim().max(50).nullable().optional(),
  birth_date: z.string().date().nullable().optional(),
  work_start_date: z.string().date().nullable().optional(),
  status: z.enum(["pending", "active", "suspended", "inactive"]).optional(),
  role_ids: z.array(z.number().int().positive()).optional()
});

const updateUserSchema = userSchema.partial().omit({ password: true, role_ids: true });

usersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, pageSize, offset } = getPagination(req);
    const search = String(req.query.search ?? "").trim();
    const where = ["u.deleted_at IS NULL"];
    const params: Record<string, unknown> = { limit: pageSize, offset };

    if (search) {
      where.push("(u.email LIKE :search OR u.employee_code LIKE :search OR u.first_name_th LIKE :search OR u.last_name_th LIKE :search)");
      params.search = `%${search}%`;
    }

    if (req.query.status) {
      where.push("u.status = :status");
      params.status = String(req.query.status);
    }

    const whereSql = where.join(" AND ");
    const rows = await queryRows<RowDataPacket[]>(
      `SELECT u.id, u.department_id, d.name_th AS department_name_th, u.employee_code, u.email,
              u.title_th, u.first_name_th, u.last_name_th, u.position_th, u.phone, u.status,
              u.birth_date, u.work_start_date, u.created_at, u.updated_at,
              GROUP_CONCAT(r.code ORDER BY r.code) AS roles
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE ${whereSql}
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT :limit OFFSET :offset`,
      params
    );
    const totalRow = await queryOne<RowDataPacket>(
      `SELECT COUNT(1) AS total FROM users u WHERE ${whereSql}`,
      params
    );

    sendList(res, rows, Number(totalRow?.total ?? 0), page, pageSize);
  })
);

usersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const row = await queryOne<RowDataPacket>(
      `SELECT u.id, u.department_id, d.name_th AS department_name_th, u.employee_code, u.email,
              u.title_th, u.first_name_th, u.last_name_th, u.position_th, u.phone, u.status,
              u.birth_date, u.work_start_date, u.email_verified_at, u.last_login_at,
              u.created_at, u.updated_at
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
       WHERE u.id = :id AND u.deleted_at IS NULL`,
      { id }
    );
    if (!row) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const roles = await queryRows<RowDataPacket[]>(
      `SELECT r.id, r.code, r.name_th
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = :id
       ORDER BY r.code`,
      { id }
    );
    res.json({ data: { ...row, roles } });
  })
);

usersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = validateBody(userSchema, req.body);
    const passwordHash = body.password ? await bcrypt.hash(body.password, 12) : null;

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.execute(
        `INSERT INTO users (
          department_id, employee_code, email, password_hash, title_th, first_name_th,
          last_name_th, position_th, phone, birth_date, work_start_date, status,
          email_verified_at
        ) VALUES (
          :department_id, :employee_code, :email, :password_hash, :title_th, :first_name_th,
          :last_name_th, :position_th, :phone, :birth_date, :work_start_date, :status,
          :email_verified_at
        )`,
        {
          department_id: body.department_id ?? null,
          employee_code: body.employee_code ?? null,
          email: body.email,
          password_hash: passwordHash,
          title_th: body.title_th ?? null,
          first_name_th: body.first_name_th,
          last_name_th: body.last_name_th,
          position_th: body.position_th ?? null,
          phone: body.phone ?? null,
          birth_date: body.birth_date ?? null,
          work_start_date: body.work_start_date ?? null,
          status: body.status ?? "active",
          email_verified_at: body.status === "active" ? new Date() : null
        }
      );
      const userId = Number((result as { insertId: number }).insertId);
      for (const roleId of body.role_ids ?? []) {
        await connection.execute(
          "INSERT INTO user_roles (user_id, role_id) VALUES (:user_id, :role_id)",
          { user_id: userId, role_id: roleId }
        );
      }
      await connection.commit();
      res.status(201).json({ data: { id: userId } });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);

usersRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const body = validateBody(updateUserSchema, req.body);
    const { clause, values } = buildSetClause(body);
    const result = await execute(
      `UPDATE users SET ${clause} WHERE id = :id AND deleted_at IS NULL`,
      { ...values, id }
    );
    changedRowsOrNotFound(result);
    res.json({ data: { id } });
  })
);

usersRouter.put(
  "/:id/roles",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const body = validateBody(z.object({ role_ids: z.array(z.number().int().positive()) }), req.body);
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute("DELETE FROM user_roles WHERE user_id = :id", { id });
      for (const roleId of body.role_ids) {
        await connection.execute(
          "INSERT INTO user_roles (user_id, role_id) VALUES (:user_id, :role_id)",
          { user_id: id, role_id: roleId }
        );
      }
      await connection.commit();
      res.json({ data: { id, role_ids: body.role_ids } });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  })
);

usersRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const result = await execute(
      "UPDATE users SET deleted_at = CURRENT_TIMESTAMP, status = 'inactive' WHERE id = :id AND deleted_at IS NULL",
      { id }
    );
    changedRowsOrNotFound(result);
    res.status(204).send();
  })
);
