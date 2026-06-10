export type Department = {
  id: number;
  parent_id: number | null;
  code: string;
  name_th: string;
  name_en: string | null;
  phone: string | null;
  email: string | null;
  is_active: number | boolean;
};

export type ReferenceOption = {
  id: number;
  code: string;
  name_th: string;
  description?: string | null;
};

export type LoanStatusOption = {
  code: string;
  name_th: string;
  description?: string | null;
  sort_order: number;
  is_terminal: number;
};

export type UserSummary = {
  id: number;
  email: string;
  first_name_th: string;
  last_name_th: string;
  title_th?: string | null;
  department_id?: number | null;
  department_name_th?: string | null;
  birth_date?: string | null;
  work_start_date?: string | null;
  roles?: string | Array<{ id: number; code: string; name_th: string }>;
};

export type AuthUser = {
  id: number;
  email: string;
  first_name_th: string;
  last_name_th: string;
  roles: Array<{ id: number; code: string; name_th: string }>;
};

export type LoanRequest = {
  id: number;
  request_no: string;
  contract_no: string | null;
  borrower_id: number;
  borrower_name: string;
  borrower_email: string;
  department_id: number | null;
  department_name_th: string | null;
  loan_type_id: number | null;
  loan_type_name_th: string | null;
  funding_source_id: number | null;
  funding_source_name_th: string | null;
  due_date_rule_id: number | null;
  status_code: string;
  status_name_th: string;
  objective: string;
  project_name: string | null;
  project_start_date: string | null;
  project_end_date: string | null;
  amount: string;
  current_balance: string;
  requested_at: string;
  submitted_at: string | null;
  approved_at: string | null;
  paid_at: string | null;
  due_date: string | null;
  remark: string | null;
  approvals?: ApprovalHistory[];
};

export type ApprovalHistory = {
  id: number;
  step: string;
  from_status_code: string | null;
  to_status_code: string;
  action: string;
  actor_id: number | null;
  actor_name: string | null;
  note: string | null;
  acted_at: string;
};

export type DashboardData = {
  summary: {
    total_loans: number;
    total_amount: string;
    outstanding_amount: string;
    pending_count: string;
    overdue_count: string;
  };
  by_department: Array<{
    department_name_th: string;
    total_loans: number;
    total_amount: string;
    outstanding_amount: string;
  }>;
  by_status: Array<{
    code: string;
    name_th: string;
    total: number;
  }>;
};
