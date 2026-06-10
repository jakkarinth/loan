import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "../config/database.js";
import { ApiError } from "./http.js";

export type DbRecord = Record<string, unknown>;
export { db };

export async function queryRows<T extends RowDataPacket[]>(
  sql: string,
  params: DbRecord | unknown[] = {}
) {
  const [rows] = await db.query<T>(sql, params as never);
  return rows;
}

export async function queryOne<T extends RowDataPacket>(
  sql: string,
  params: DbRecord | unknown[] = {}
) {
  const rows = await queryRows<T[]>(sql, params);
  return rows[0] ?? null;
}

export async function execute(sql: string, params: DbRecord | unknown[] = {}) {
  const [result] = await db.execute<ResultSetHeader>(sql, params as never);
  return result;
}

export function ensureFound<T>(record: T | null, message = "Data not found"): T {
  if (!record) {
    throw new ApiError(404, message);
  }
  return record;
}

export function changedRowsOrNotFound(result: ResultSetHeader) {
  if (result.affectedRows === 0) {
    throw new ApiError(404, "Data not found");
  }
}

export function buildSetClause(data: Record<string, unknown>) {
  const entries = Object.entries(data).filter(([, value]) => value !== undefined);
  if (entries.length === 0) {
    throw new ApiError(400, "No update fields provided");
  }

  return {
    clause: entries.map(([key]) => `${key} = :${key}`).join(", "),
    values: Object.fromEntries(entries)
  };
}

export async function generateDocumentNo(prefix: string, table: string, column: string) {
  const year = new Date().getFullYear() + 543;
  const like = `${prefix}${year}%`;
  const row = await queryOne<RowDataPacket>(
    `SELECT COUNT(1) + 1 AS next_no FROM ${table} WHERE ${column} LIKE :like`,
    { like }
  );
  const nextNo = Number(row?.next_no ?? 1);
  return `${prefix}${year}${String(nextNo).padStart(5, "0")}`;
}
