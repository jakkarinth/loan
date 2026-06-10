import { Router } from "express";
import { requireAuth, requireRoles } from "../middlewares/auth.js";
import { authRouter } from "../modules/auth/routes.js";
import { departmentsRouter } from "../modules/departments/routes.js";
import { documentsRouter } from "../modules/documents/routes.js";
import { extensionsRouter } from "../modules/extensions/routes.js";
import { loansRouter } from "../modules/loans/routes.js";
import { noticesRouter } from "../modules/notices/routes.js";
import { paymentsRouter } from "../modules/payments/routes.js";
import { referenceRouter } from "../modules/reference/routes.js";
import { repaymentsRouter } from "../modules/repayments/routes.js";
import { reportsRouter } from "../modules/reports/routes.js";
import { usersRouter } from "../modules/users/routes.js";

export const apiRouter = Router();

apiRouter.get("/", (_req, res) => {
  res.json({
    name: "RMUTI Surin Loan Management API",
    version: "0.1.0"
  });
});

apiRouter.use("/reference", referenceRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/departments", departmentsRouter);
apiRouter.use("/users", requireAuth, requireRoles("admin", "finance_officer"), usersRouter);
apiRouter.use("/loans", requireAuth, loansRouter);
apiRouter.use("/payments", requireAuth, requireRoles("admin", "finance_officer"), paymentsRouter);
apiRouter.use("/repayments", requireAuth, requireRoles("admin", "finance_officer"), repaymentsRouter);
apiRouter.use("/extensions", requireAuth, extensionsRouter);
apiRouter.use("/notices", requireAuth, requireRoles("admin", "finance_officer"), noticesRouter);
apiRouter.use("/reports", requireAuth, requireRoles("admin", "finance_officer", "executive"), reportsRouter);
apiRouter.use("/documents", requireAuth, documentsRouter);
