export type LoanStatus =
  | "draft"
  | "pending_department_review"
  | "pending_university_finance_review"
  | "pending_department_approval"
  | "budget_reviewed"
  | "finance_reviewed"
  | "approved"
  | "paid"
  | "partially_repaid"
  | "fully_repaid"
  | "overdue"
  | "extension_requested"
  | "extension_approved"
  | "extension_rejected"
  | "rejected"
  | "cancelled";

export type UserRole =
  | "borrower"
  | "department_checker"
  | "budget_officer"
  | "finance_officer"
  | "approver"
  | "admin";

