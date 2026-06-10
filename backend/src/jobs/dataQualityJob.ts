import { runJob } from './jobRunner';
import type { JobContext } from './jobRunner';
import { logJob } from '../infrastructure/logging/jobLogger';
import { databaseClient } from '../infrastructure/database/databaseClient';

const DEFAULT_BATCH_SIZE = 100;

export interface RunDataQualityJobOptions {
  providerId?: string;
  batchSize?: number;
}

export interface QualityIssue {
  rule: string;
  message: string;
}

interface ProductRow {
  id: string;
  provider_id: string;
  name: string | null;
  price: string | number | null;
  description: string | null;
  image_url: string | null;
  category: string | null;
  sku: string | null;
  normalized_name: string | null;
  normalized_description: string | null;
  events: string | null;
}

/**
 * 8 validation rules:
 *   Basic fields (5):
 *     1. name must not be empty
 *     2. price must be a positive number
 *     3. description must be at least 20 characters
 *     4. image_url must not be empty
 *     5. category must not be empty
 *   AI attributes (3):
 *     6. product must have a normalized (AI-enriched) record
 *     7. AI-normalized name must not be empty
 *     8. AI-generated gift events must not be empty
 */
function validate(row: ProductRow): QualityIssue[] {
  const issues: QualityIssue[] = [];

  // --- Basic field rules ---
  if (!row.name || row.name.trim().length === 0) {
    issues.push({ rule: 'missing_name', message: 'Product name is missing or empty' });
  }

  const price = row.price !== null && row.price !== undefined ? Number(row.price) : null;
  if (price === null || isNaN(price) || price <= 0) {
    issues.push({ rule: 'invalid_price', message: 'Price is missing or not a positive number' });
  }

  if (!row.description || row.description.trim().length < 20) {
    issues.push({ rule: 'short_description', message: 'Description is missing or too short (minimum 20 characters)' });
  }

  if (!row.image_url || row.image_url.trim().length === 0) {
    issues.push({ rule: 'missing_image_url', message: 'Product image URL is missing' });
  }

  if (!row.category || row.category.trim().length === 0) {
    issues.push({ rule: 'missing_category', message: 'Product category is missing or empty' });
  }

  // --- AI attribute rules ---
  // normalized_name being null means no record in product_normalized exists (LEFT JOIN returned NULL)
  const hasNormalized = row.normalized_name !== undefined;

  if (row.normalized_name === null && row.normalized_description === null && row.events === null) {
    issues.push({ rule: 'no_ai_enrichment', message: 'Product has no AI-enriched record in product_normalized' });
    issues.push({ rule: 'missing_normalized_name', message: 'AI-normalized name is missing (product not enriched)' });
    issues.push({ rule: 'missing_ai_events', message: 'AI-generated gift events are missing (product not enriched)' });
  } else {
    if (!row.normalized_name || row.normalized_name.trim().length === 0) {
      issues.push({ rule: 'missing_normalized_name', message: 'AI-normalized name is empty or missing' });
    }
    if (!row.events || row.events.trim().length === 0) {
      issues.push({ rule: 'missing_ai_events', message: 'AI-generated gift events are empty or missing' });
    }
    if (!row.normalized_description || row.normalized_description.trim().length < 20) {
      issues.push({ rule: 'short_normalized_description', message: 'AI-normalized description is missing or too short' });
    }
  }

  return issues;
}

/**
 * data_quality_job — validates basic fields and AI attributes for each product.
 * Records quality_status ('ok'|'issues') and quality_issues (JSON) on the products row.
 * Safe to re-run: subsequent runs overwrite previous results without side-effects.
 * A failure on one product does not stop the job.
 */
export async function runDataQualityJob(options: RunDataQualityJobOptions = {}): Promise<{
  runId: number;
  status: 'success' | 'failed';
  processedCount: number;
  successCount: number;
  failedCount: number;
  error?: string;
}> {
  const batchSize = Math.min(500, Math.max(1, options.batchSize ?? DEFAULT_BATCH_SIZE));
  const providerId = options.providerId;

  return runJob({
    jobName: 'data_quality',
    providerId: providerId ?? null,
    jobFn: async (ctx: JobContext) => {
      const params: (string | number)[] = [];
      let whereClause = '';
      if (providerId) {
        whereClause = 'WHERE p.provider_id = ?';
        params.push(providerId);
      }
      params.push(batchSize);

      const rows = await databaseClient.query<ProductRow>(
        `SELECT
           p.id, p.provider_id, p.name, p.price, p.description, p.image_url, p.category, p.sku,
           n.normalized_name, n.normalized_description, n.events
         FROM products p
         LEFT JOIN product_normalized n
           ON n.provider_id = p.provider_id AND n.product_id = p.id
         ${whereClause}
         ORDER BY p.updated_at ASC
         LIMIT ?`,
        params,
      );

      let processed = 0;
      let success = 0;
      let failed = 0;

      for (const row of rows) {
        logJob({
          job_name: 'data_quality',
          product_id: row.id,
          provider_id: row.provider_id,
          message: 'quality check started',
        });

        try {
          const issues = validate(row);
          const qualityStatus = issues.length === 0 ? 'ok' : 'issues';

          await databaseClient.query(
            `UPDATE products
             SET quality_status = ?, quality_issues = ?
             WHERE provider_id = ? AND id = ?`,
            [qualityStatus, JSON.stringify(issues), row.provider_id, row.id],
          );

          logJob({
            job_name: 'data_quality',
            product_id: row.id,
            provider_id: row.provider_id,
            message: `quality check done: ${qualityStatus} (${issues.length} issue(s))`,
          });

          success++;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          logJob({
            level: 'warn',
            job_name: 'data_quality',
            product_id: row.id,
            provider_id: row.provider_id,
            message: 'quality check error',
            error: message,
          });
          failed++;
        }

        processed++;
        await ctx.updateCounts(processed, success, failed);
      }

      return { processedCount: processed, successCount: success, failedCount: failed };
    },
  });
}