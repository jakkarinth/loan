import { randomBytes } from "node:crypto";
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import type { RowDataPacket } from "mysql2";
import { z } from "zod";
import { env } from "../../config/env.js";
import { db, execute, queryOne, queryRows } from "../../lib/db.js";
import { ApiError, asyncHandler, validateBody } from "../../lib/http.js";

export const authRouter = Router();

const registerSchema = z.object({
  department_id: z.number().int().positive().nullable().optional(),
  employee_code: z.string().trim().max(50).nullable().optional(),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  title_th: z.string().trim().max(50).nullable().optional(),
  first_name_th: z.string().trim().min(1).max(150),
  last_name_th: z.string().trim().min(1).max(150),
  position_th: z.string().trim().max(150).nullable().optional(),
  phone: z.string().trim().max(50).nullable().optional(),
  birth_date: z.string().date().nullable().optional(),
  work_start_date: z.string().date().nullable().optional()
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1)
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email()
});

function signAccessToken(user: RowDataPacket, roles: RowDataPacket[]) {
  return jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      roles: roles.map((role) => role.code)
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] }
  );
}

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const body = validateBody(registerSchema, req.body);
    const passwordHash = await bcrypt.hash(body.password, 12);
    const borrowerRole = await queryOne<RowDataPacket>(
      "SELECT id FROM roles WHERE code = 'borrower'"
    );
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.execute(
        `INSERT INTO users (
          department_id, employee_code, email, password_hash, title_th,
          first_name_th, last_name_th, position_th, phone, birth_date,
          work_start_date, status
        ) VALUES (
          :department_id, :employee_code, :email, :password_hash, :title_th,
          :first_name_th, :last_name_th, :position_th, :phone, :birth_date,
          :work_start_date, 'active'
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
          work_start_date: body.work_start_date ?? null
        }
      );
      const userId = Number((result as { insertId: number }).insertId);
      if (borrowerRole) {
        await connection.execute(
          "INSERT INTO user_roles (user_id, role_id) VALUES (:user_id, :role_id)",
          { user_id: userId, role_id: borrowerRole.id }
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

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const body = validateBody(loginSchema, req.body);
    const user = await queryOne<RowDataPacket>(
      "SELECT * FROM users WHERE email = :email AND deleted_at IS NULL AND status = 'active'",
      { email: body.email }
    );
    if (!user || !user.password_hash) {
      throw new ApiError(401, "Invalid email or password");
    }
    const isPasswordValid = await bcrypt.compare(body.password, String(user.password_hash));
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid email or password");
    }
    const roles = await queryRows<RowDataPacket[]>(
      `SELECT r.id, r.code, r.name_th
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = :user_id`,
      { user_id: user.id }
    );
    const accessToken = signAccessToken(user, roles);
    await execute("UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = :id", {
      id: user.id
    });
    res.json({
      data: {
        access_token: accessToken,
        token_type: "Bearer",
        user: {
          id: user.id,
          email: user.email,
          first_name_th: user.first_name_th,
          last_name_th: user.last_name_th,
          roles
        }
      }
    });
  })
);

authRouter.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const body = validateBody(forgotPasswordSchema, req.body);
    const user = await queryOne<RowDataPacket>(
      "SELECT id FROM users WHERE email = :email AND deleted_at IS NULL",
      { email: body.email }
    );

    if (user) {
      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = await bcrypt.hash(rawToken, 10);
      await execute(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
         VALUES (:user_id, :token_hash, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 MINUTE))`,
        { user_id: user.id, token_hash: tokenHash }
      );
    }

    res.json({
      message: "If the email exists, password reset instructions will be sent"
    });
  })
);
