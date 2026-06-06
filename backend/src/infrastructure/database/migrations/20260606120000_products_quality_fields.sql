-- Migration: add quality_status and quality_issues to products
-- quality_status: NULL = never checked, 'ok' = passed all rules, 'issues' = has violations
-- quality_issues: JSON array of { rule, message } objects

ALTER TABLE products
  ADD COLUMN quality_status VARCHAR(32) NULL DEFAULT NULL AFTER ai_error,
  ADD COLUMN quality_issues JSON NULL DEFAULT NULL AFTER quality_status;

ALTER TABLE products
  ADD KEY idx_products_quality_status (quality_status);