import { databaseClient } from '../../../infrastructure/database/databaseClient';

export interface QualityIssueProductRow {
  id: string;
  providerId: string;
  name: string | null;
  price: number | null;
  category: string | null;
  qualityStatus: string;
  qualityIssues: Array<{ rule: string; message: string }>;
  updatedAt: string;
}

export interface ListQualityIssuesInput {
  providerId?: string;
  limit?: number;
}

export class ListQualityIssuesProductsUseCase {
  async execute(input: ListQualityIssuesInput = {}): Promise<QualityIssueProductRow[]> {
    const limit = Math.min(500, Math.max(1, input.limit ?? 200));
    const params: (string | number)[] = [];
    let whereClause = "WHERE p.quality_status = 'issues'";
    if (input.providerId) {
      whereClause += ' AND p.provider_id = ?';
      params.push(input.providerId);
    }
    params.push(limit);

    const rows = await databaseClient.query<any>(
      `SELECT p.id, p.provider_id, p.name, p.price, p.category,
              p.quality_status, p.quality_issues, p.updated_at
       FROM products p
       ${whereClause}
       ORDER BY p.updated_at DESC
       LIMIT ?`,
      params,
    );

    return rows.map((r: any) => ({
      id: r.id,
      providerId: r.provider_id,
      name: r.name ?? null,
      price: r.price !== null ? Number(r.price) : null,
      category: r.category ?? null,
      qualityStatus: r.quality_status,
      qualityIssues: typeof r.quality_issues === 'string'
        ? JSON.parse(r.quality_issues)
        : (r.quality_issues ?? []),
      updatedAt: r.updated_at instanceof Date
        ? r.updated_at.toISOString()
        : new Date(r.updated_at).toISOString(),
    }));
  }
}
