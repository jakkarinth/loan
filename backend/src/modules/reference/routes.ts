import { Router } from "express";
import type { RowDataPacket } from "mysql2";
import { queryRows } from "../../lib/db.js";
import { asyncHandler } from "../../lib/http.js";

export const referenceRouter = Router();

referenceRouter.get(
  "/roles",
  asyncHandler(async (_req, res) => {
    const rows = await queryRows<RowDataPacket[]>(
      "SELECT id, code, name_th, description FROM roles ORDER BY id"
    );
    res.json({ data: rows });
  })
);

referenceRouter.get(
  "/permissions",
  asyncHandler(async (_req, res) => {
    const rows = await queryRows<RowDataPacket[]>(
      "SELECT id, code, name_th, description FROM permissions ORDER BY code"
    );
    res.json({ data: rows });
  })
);

referenceRouter.get(
  "/loan-statuses",
  asyncHandler(async (_req, res) => {
    const rows = await queryRows<RowDataPacket[]>(
      "SELECT code, name_th, description, sort_order, is_terminal FROM loan_statuses ORDER BY sort_order"
    );
    res.json({ data: rows });
  })
);

referenceRouter.get(
  "/loan-types",
  asyncHandler(async (_req, res) => {
    const rows = await queryRows<RowDataPacket[]>(
      "SELECT id, code, name_th, description, is_active FROM loan_types WHERE is_active = 1 ORDER BY id"
    );
    res.json({ data: rows });
  })
);

referenceRouter.get(
  "/funding-sources",
  asyncHandler(async (_req, res) => {
    const rows = await queryRows<RowDataPacket[]>(
      "SELECT id, code, name_th, description, is_active FROM funding_sources WHERE is_active = 1 ORDER BY id"
    );
    res.json({ data: rows });
  })
);

referenceRouter.get(
  "/due-date-rules",
  asyncHandler(async (_req, res) => {
    const rows = await queryRows<RowDataPacket[]>(
      "SELECT id, code, name_th, days_count, count_from, description, is_active FROM due_date_rules WHERE is_active = 1 ORDER BY id"
    );
    res.json({ data: rows });
  })
);

