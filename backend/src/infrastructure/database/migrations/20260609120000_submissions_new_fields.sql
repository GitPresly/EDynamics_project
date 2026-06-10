-- Up migration: submissions_new_fields
-- Adds the city, country and status fields plus soft-delete support to submissions.
--   status:     workflow state of the submission.
--   deleted_at: NULL = active; a timestamp = soft-deleted (rows are never physically removed).

ALTER TABLE submissions
  ADD COLUMN city       VARCHAR(255) NULL DEFAULT NULL AFTER message,
  ADD COLUMN country    VARCHAR(255) NULL DEFAULT NULL AFTER city,
  ADD COLUMN status     ENUM('Open','In Review','Approved','Declined') NOT NULL DEFAULT 'Open' AFTER country,
  ADD COLUMN deleted_at DATETIME(6) NULL DEFAULT NULL AFTER created_at,
  ADD KEY idx_submissions_status (status),
  ADD KEY idx_submissions_deleted_at (deleted_at);
