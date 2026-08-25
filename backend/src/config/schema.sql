-- DevPulse Database Schema (MySQL 8)

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password_hash TEXT,
  avatar_url TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id VARCHAR(36) PRIMARY KEY,
  token VARCHAR(512) NOT NULL UNIQUE,
  user_id VARCHAR(36) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_refresh_tokens_user (user_id),
  INDEX idx_refresh_tokens_token (token),
  CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS workspaces (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  owner_id VARCHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_workspaces_owner (owner_id),
  CONSTRAINT fk_workspaces_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS workspace_members (
  id VARCHAR(36) PRIMARY KEY,
  workspace_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  role ENUM('OWNER', 'ADMIN', 'DEVELOPER', 'VIEWER') NOT NULL DEFAULT 'DEVELOPER',
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_workspace_user (workspace_id, user_id),
  INDEX idx_wm_workspace (workspace_id),
  INDEX idx_wm_user (user_id),
  CONSTRAINT fk_wm_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  CONSTRAINT fk_wm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  project_key VARCHAR(50) NOT NULL,
  status ENUM('ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  workspace_id VARCHAR(36) NOT NULL,
  created_by_id VARCHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_workspace_key (workspace_id, project_key),
  INDEX idx_projects_workspace (workspace_id),
  INDEX idx_projects_creator (created_by_id),
  CONSTRAINT fk_projects_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  CONSTRAINT fk_projects_creator FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS project_members (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  role ENUM('ADMIN', 'DEVELOPER', 'VIEWER') NOT NULL DEFAULT 'DEVELOPER',
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_project_user (project_id, user_id),
  INDEX idx_pm_project (project_id),
  INDEX idx_pm_user (user_id),
  CONSTRAINT fk_pm_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_pm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS issues (
  id VARCHAR(36) PRIMARY KEY,
  number INT NOT NULL,
  title VARCHAR(512) NOT NULL,
  description LONGTEXT,
  status ENUM('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE') NOT NULL DEFAULT 'TODO',
  priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
  project_id VARCHAR(36) NOT NULL,
  reporter_id VARCHAR(36) NOT NULL,
  assignee_id VARCHAR(36),
  due_date DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_project_number (project_id, number),
  INDEX idx_issues_project (project_id),
  INDEX idx_issues_assignee (assignee_id),
  INDEX idx_issues_status (status),
  INDEX idx_issues_priority (priority),
  INDEX idx_issues_created (created_at),
  CONSTRAINT fk_issues_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_issues_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_issues_assignee FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS issue_labels (
  id VARCHAR(36) PRIMARY KEY,
  issue_id VARCHAR(36) NOT NULL,
  label VARCHAR(100) NOT NULL,
  UNIQUE KEY uk_issue_label (issue_id, label),
  INDEX idx_il_issue (issue_id),
  CONSTRAINT fk_il_issue FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS comments (
  id VARCHAR(36) PRIMARY KEY,
  body LONGTEXT NOT NULL,
  issue_id VARCHAR(36) NOT NULL,
  author_id VARCHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_comments_issue (issue_id),
  INDEX idx_comments_author (author_id),
  CONSTRAINT fk_comments_issue FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  metadata JSON,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_user (user_id),
  INDEX idx_notifications_read (is_read),
  INDEX idx_notifications_created (created_at),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS activities (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36),
  workspace_id VARCHAR(36),
  user_id VARCHAR(36),
  type VARCHAR(100) NOT NULL,
  payload JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_activities_project (project_id),
  INDEX idx_activities_workspace (workspace_id),
  INDEX idx_activities_user (user_id),
  INDEX idx_activities_created (created_at),
  CONSTRAINT fk_activities_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT fk_activities_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  CONSTRAINT fk_activities_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id VARCHAR(36),
  metadata JSON,
  ip_address VARCHAR(45),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_logs_user (user_id),
  INDEX idx_audit_logs_resource (resource),
  INDEX idx_audit_logs_created (created_at),
  CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS github_accounts (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL UNIQUE,
  github_id VARCHAR(100) NOT NULL UNIQUE,
  login VARCHAR(100) NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  access_token TEXT NOT NULL,
  token_scope VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_ga_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS github_repositories (
  id VARCHAR(36) PRIMARY KEY,
  github_id INT NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_private TINYINT(1) NOT NULL DEFAULT 0,
  url TEXT NOT NULL,
  clone_url TEXT,
  default_branch VARCHAR(100) NOT NULL DEFAULT 'main',
  project_id VARCHAR(36),
  github_account_id VARCHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_gr_project (project_id),
  INDEX idx_gr_account (github_account_id),
  CONSTRAINT fk_gr_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  CONSTRAINT fk_gr_account FOREIGN KEY (github_account_id) REFERENCES github_accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS github_commits (
  id VARCHAR(36) PRIMARY KEY,
  sha VARCHAR(100) NOT NULL UNIQUE,
  message TEXT NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  author_email VARCHAR(255) NOT NULL,
  authored_at DATETIME NOT NULL,
  url TEXT NOT NULL,
  repository_id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36),
  issue_id VARCHAR(36),
  pushed_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_gc_repo (repository_id),
  INDEX idx_gc_project (project_id),
  INDEX idx_gc_issue (issue_id),
  INDEX idx_gc_pushed (pushed_at),
  CONSTRAINT fk_gc_repo FOREIGN KEY (repository_id) REFERENCES github_repositories(id) ON DELETE CASCADE,
  CONSTRAINT fk_gc_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  CONSTRAINT fk_gc_issue FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS github_pull_requests (
  id VARCHAR(36) PRIMARY KEY,
  github_id INT NOT NULL,
  number INT NOT NULL,
  title VARCHAR(512) NOT NULL,
  state VARCHAR(50) NOT NULL,
  body LONGTEXT,
  url TEXT NOT NULL,
  author_login VARCHAR(100) NOT NULL,
  author_avatar_url TEXT,
  merged TINYINT(1) NOT NULL DEFAULT 0,
  merged_at DATETIME,
  repository_id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36),
  issue_id VARCHAR(36),
  github_created_at DATETIME NOT NULL,
  github_updated_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_repo_pr (repository_id, number),
  INDEX idx_gpr_repo (repository_id),
  INDEX idx_gpr_project (project_id),
  INDEX idx_gpr_issue (issue_id),
  CONSTRAINT fk_gpr_repo FOREIGN KEY (repository_id) REFERENCES github_repositories(id) ON DELETE CASCADE,
  CONSTRAINT fk_gpr_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  CONSTRAINT fk_gpr_issue FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS github_events (
  id VARCHAR(36) PRIMARY KEY,
  delivery_id VARCHAR(255) NOT NULL UNIQUE,
  event VARCHAR(100) NOT NULL,
  action VARCHAR(100),
  repository_id VARCHAR(36),
  payload JSON NOT NULL,
  processed TINYINT(1) NOT NULL DEFAULT 0,
  processed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ge_repo (repository_id),
  INDEX idx_ge_processed (processed),
  CONSTRAINT fk_ge_repo FOREIGN KEY (repository_id) REFERENCES github_repositories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS monitors (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  method VARCHAR(10) NOT NULL DEFAULT 'GET',
  expected_status INT NOT NULL DEFAULT 200,
  interval_minutes INT NOT NULL DEFAULT 5,
  timeout_seconds INT NOT NULL DEFAULT 30,
  active TINYINT(1) NOT NULL DEFAULT 1,
  workspace_id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36),
  created_by_id VARCHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_monitors_workspace (workspace_id),
  INDEX idx_monitors_project (project_id),
  INDEX idx_monitors_active (active),
  CONSTRAINT fk_monitors_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  CONSTRAINT fk_monitors_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS monitor_checks (
  id VARCHAR(36) PRIMARY KEY,
  monitor_id VARCHAR(36) NOT NULL,
  success TINYINT(1) NOT NULL,
  status_code INT,
  response_time_ms INT,
  error TEXT,
  checked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mc_monitor (monitor_id),
  INDEX idx_mc_checked (checked_at),
  INDEX idx_mc_success (success),
  CONSTRAINT fk_mc_monitor FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS incidents (
  id VARCHAR(36) PRIMARY KEY,
  monitor_id VARCHAR(36) NOT NULL,
  status ENUM('OPEN', 'RESOLVED') NOT NULL DEFAULT 'OPEN',
  reason TEXT,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_incidents_monitor (monitor_id),
  INDEX idx_incidents_status (status),
  CONSTRAINT fk_incidents_monitor FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
