SET NAMES utf8mb4;
SET time_zone = '+07:00';

CREATE TABLE IF NOT EXISTS roles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL,
  name_th VARCHAR(150) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(100) NOT NULL,
  name_th VARCHAR(150) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_permissions_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permissions_role
    FOREIGN KEY (role_id) REFERENCES roles (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_role_permissions_permission
    FOREIGN KEY (permission_id) REFERENCES permissions (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS departments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  parent_id BIGINT UNSIGNED NULL,
  code VARCHAR(50) NOT NULL,
  name_th VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NULL,
  phone VARCHAR(50) NULL,
  email VARCHAR(255) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_departments_code (code),
  KEY idx_departments_parent_id (parent_id),
  CONSTRAINT fk_departments_parent
    FOREIGN KEY (parent_id) REFERENCES departments (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  department_id BIGINT UNSIGNED NULL,
  employee_code VARCHAR(50) NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NULL,
  title_th VARCHAR(50) NULL,
  first_name_th VARCHAR(150) NOT NULL,
  last_name_th VARCHAR(150) NOT NULL,
  position_th VARCHAR(150) NULL,
  phone VARCHAR(50) NULL,
  avatar_url VARCHAR(500) NULL,
  status ENUM('pending', 'active', 'suspended', 'inactive') NOT NULL DEFAULT 'pending',
  email_verified_at TIMESTAMP NULL,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_employee_code (employee_code),
  KEY idx_users_department_id (department_id),
  KEY idx_users_status (status),
  CONSTRAINT fk_users_department
    FOREIGN KEY (department_id) REFERENCES departments (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id BIGINT UNSIGNED NOT NULL,
  role_id BIGINT UNSIGNED NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  assigned_by BIGINT UNSIGNED NULL,
  PRIMARY KEY (user_id, role_id),
  KEY idx_user_roles_role_id (role_id),
  KEY idx_user_roles_assigned_by (assigned_by),
  CONSTRAINT fk_user_roles_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role
    FOREIGN KEY (role_id) REFERENCES roles (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_assigned_by
    FOREIGN KEY (assigned_by) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_password_reset_tokens_token_hash (token_hash),
  KEY idx_password_reset_tokens_user_id (user_id),
  CONSTRAINT fk_password_reset_tokens_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_refresh_tokens_token_hash (token_hash),
  KEY idx_refresh_tokens_user_id (user_id),
  CONSTRAINT fk_refresh_tokens_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS loan_statuses (
  code VARCHAR(50) NOT NULL,
  name_th VARCHAR(150) NOT NULL,
  description TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_terminal TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS loan_types (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL,
  name_th VARCHAR(150) NOT NULL,
  description TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_loan_types_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS funding_sources (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL,
  name_th VARCHAR(150) NOT NULL,
  description TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_funding_sources_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS due_date_rules (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL,
  name_th VARCHAR(150) NOT NULL,
  days_count INT NOT NULL,
  count_from ENUM('request_date', 'approved_date', 'paid_date', 'project_end_date', 'custom_date') NOT NULL DEFAULT 'paid_date',
  description TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_due_date_rules_code (code),
  CONSTRAINT chk_due_date_rules_days_count CHECK (days_count > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS loan_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_no VARCHAR(50) NOT NULL,
  contract_no VARCHAR(50) NULL,
  borrower_id BIGINT UNSIGNED NOT NULL,
  department_id BIGINT UNSIGNED NULL,
  loan_type_id BIGINT UNSIGNED NULL,
  funding_source_id BIGINT UNSIGNED NULL,
  due_date_rule_id BIGINT UNSIGNED NULL,
  status_code VARCHAR(50) NOT NULL DEFAULT 'draft',
  objective TEXT NOT NULL,
  project_name VARCHAR(255) NULL,
  project_start_date DATE NULL,
  project_end_date DATE NULL,
  amount DECIMAL(14,2) NOT NULL,
  requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP NULL,
  approved_at TIMESTAMP NULL,
  paid_at TIMESTAMP NULL,
  due_date DATE NULL,
  repayment_completed_at TIMESTAMP NULL,
  current_balance DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  remark TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_loan_requests_request_no (request_no),
  UNIQUE KEY uq_loan_requests_contract_no (contract_no),
  KEY idx_loan_requests_borrower_id (borrower_id),
  KEY idx_loan_requests_department_id (department_id),
  KEY idx_loan_requests_status_code (status_code),
  KEY idx_loan_requests_due_date (due_date),
  KEY idx_loan_requests_loan_type_id (loan_type_id),
  KEY idx_loan_requests_funding_source_id (funding_source_id),
  FULLTEXT KEY ft_loan_requests_search (request_no, contract_no, project_name, objective),
  CONSTRAINT fk_loan_requests_borrower
    FOREIGN KEY (borrower_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_loan_requests_department
    FOREIGN KEY (department_id) REFERENCES departments (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_loan_requests_loan_type
    FOREIGN KEY (loan_type_id) REFERENCES loan_types (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_loan_requests_funding_source
    FOREIGN KEY (funding_source_id) REFERENCES funding_sources (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_loan_requests_due_date_rule
    FOREIGN KEY (due_date_rule_id) REFERENCES due_date_rules (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_loan_requests_status
    FOREIGN KEY (status_code) REFERENCES loan_statuses (code)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_loan_requests_created_by
    FOREIGN KEY (created_by) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_loan_requests_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_loan_requests_amount CHECK (amount > 0),
  CONSTRAINT chk_loan_requests_current_balance CHECK (current_balance >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS loan_approvals (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  loan_request_id BIGINT UNSIGNED NOT NULL,
  step ENUM('department_review', 'budget_review', 'finance_review', 'approval', 'payment_status', 'extension_review') NOT NULL,
  from_status_code VARCHAR(50) NULL,
  to_status_code VARCHAR(50) NOT NULL,
  action ENUM('submit', 'approve', 'reject', 'return', 'update_status', 'cancel') NOT NULL,
  actor_id BIGINT UNSIGNED NULL,
  note TEXT NULL,
  acted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_loan_approvals_loan_request_id (loan_request_id),
  KEY idx_loan_approvals_actor_id (actor_id),
  KEY idx_loan_approvals_to_status_code (to_status_code),
  CONSTRAINT fk_loan_approvals_loan_request
    FOREIGN KEY (loan_request_id) REFERENCES loan_requests (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_loan_approvals_from_status
    FOREIGN KEY (from_status_code) REFERENCES loan_statuses (code)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_loan_approvals_to_status
    FOREIGN KEY (to_status_code) REFERENCES loan_statuses (code)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_loan_approvals_actor
    FOREIGN KEY (actor_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS loan_payments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  loan_request_id BIGINT UNSIGNED NOT NULL,
  payment_method ENUM('cash', 'bank_transfer', 'cheque', 'other') NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  paid_date DATE NOT NULL,
  plan_name VARCHAR(255) NULL,
  fund_name VARCHAR(255) NULL,
  payment_detail_no VARCHAR(100) NULL,
  cheque_no VARCHAR(100) NULL,
  bank_account_no VARCHAR(100) NULL,
  note TEXT NULL,
  recorded_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  KEY idx_loan_payments_loan_request_id (loan_request_id),
  KEY idx_loan_payments_paid_date (paid_date),
  KEY idx_loan_payments_recorded_by (recorded_by),
  CONSTRAINT fk_loan_payments_loan_request
    FOREIGN KEY (loan_request_id) REFERENCES loan_requests (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_loan_payments_recorded_by
    FOREIGN KEY (recorded_by) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_loan_payments_amount CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS loan_repayments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  loan_request_id BIGINT UNSIGNED NOT NULL,
  repayment_type ENUM('cash', 'cheque', 'voucher', 'bank_transfer', 'other') NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  receipt_no VARCHAR(100) NULL,
  cheque_no VARCHAR(100) NULL,
  voucher_no VARCHAR(100) NULL,
  repayment_date DATE NOT NULL,
  note TEXT NULL,
  recorded_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  KEY idx_loan_repayments_loan_request_id (loan_request_id),
  KEY idx_loan_repayments_repayment_date (repayment_date),
  KEY idx_loan_repayments_recorded_by (recorded_by),
  CONSTRAINT fk_loan_repayments_loan_request
    FOREIGN KEY (loan_request_id) REFERENCES loan_requests (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_loan_repayments_recorded_by
    FOREIGN KEY (recorded_by) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_loan_repayments_amount CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS loan_extensions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  loan_request_id BIGINT UNSIGNED NOT NULL,
  requested_by BIGINT UNSIGNED NOT NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  original_due_date DATE NOT NULL,
  requested_due_date DATE NOT NULL,
  approved_due_date DATE NULL,
  reason TEXT NOT NULL,
  status ENUM('requested', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'requested',
  review_note TEXT NULL,
  requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  KEY idx_loan_extensions_loan_request_id (loan_request_id),
  KEY idx_loan_extensions_requested_by (requested_by),
  KEY idx_loan_extensions_reviewed_by (reviewed_by),
  KEY idx_loan_extensions_status (status),
  CONSTRAINT fk_loan_extensions_loan_request
    FOREIGN KEY (loan_request_id) REFERENCES loan_requests (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_loan_extensions_requested_by
    FOREIGN KEY (requested_by) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_loan_extensions_reviewed_by
    FOREIGN KEY (reviewed_by) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_loan_extensions_requested_due_date CHECK (requested_due_date > original_due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS debt_notice_letters (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  loan_request_id BIGINT UNSIGNED NOT NULL,
  notice_no VARCHAR(100) NOT NULL,
  government_unit VARCHAR(255) NOT NULL,
  document_date DATE NOT NULL,
  subject VARCHAR(255) NOT NULL,
  details TEXT NULL,
  identity_text VARCHAR(255) NULL,
  issued_by BIGINT UNSIGNED NULL,
  issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_debt_notice_letters_notice_no (notice_no),
  KEY idx_debt_notice_letters_loan_request_id (loan_request_id),
  KEY idx_debt_notice_letters_document_date (document_date),
  KEY idx_debt_notice_letters_issued_by (issued_by),
  CONSTRAINT fk_debt_notice_letters_loan_request
    FOREIGN KEY (loan_request_id) REFERENCES loan_requests (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_debt_notice_letters_issued_by
    FOREIGN KEY (issued_by) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS attachments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_type ENUM('loan_request', 'loan_payment', 'loan_repayment', 'loan_extension', 'debt_notice_letter', 'user') NOT NULL,
  owner_id BIGINT UNSIGNED NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(150) NOT NULL,
  file_size BIGINT UNSIGNED NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  uploaded_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  PRIMARY KEY (id),
  KEY idx_attachments_owner (owner_type, owner_id),
  KEY idx_attachments_uploaded_by (uploaded_by),
  CONSTRAINT fk_attachments_uploaded_by
    FOREIGN KEY (uploaded_by) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_attachments_file_size CHECK (file_size > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  loan_request_id BIGINT UNSIGNED NULL,
  type VARCHAR(80) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT NULL,
  data JSON NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_user_id (user_id),
  KEY idx_notifications_loan_request_id (loan_request_id),
  KEY idx_notifications_read_at (read_at),
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_notifications_loan_request
    FOREIGN KEY (loan_request_id) REFERENCES loan_requests (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_id BIGINT UNSIGNED NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id BIGINT UNSIGNED NULL,
  action VARCHAR(80) NOT NULL,
  before_data JSON NULL,
  after_data JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(500) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_activity_logs_actor_id (actor_id),
  KEY idx_activity_logs_entity (entity_type, entity_id),
  KEY idx_activity_logs_action (action),
  KEY idx_activity_logs_created_at (created_at),
  CONSTRAINT fk_activity_logs_actor
    FOREIGN KEY (actor_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS system_settings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  setting_key VARCHAR(100) NOT NULL,
  setting_value JSON NOT NULL,
  description TEXT NULL,
  updated_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_system_settings_key (setting_key),
  CONSTRAINT fk_system_settings_updated_by
    FOREIGN KEY (updated_by) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

