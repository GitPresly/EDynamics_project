import { databaseClient } from '../../database/databaseClient';
import { SubmissionEntity } from '../../../domain/entities/Submission/SubmissionEntity';
import { Submission, SubmissionStatus } from '../../../domain/entities/Submission/Submission';
import { ISubmissionRepository } from '../interfaces/ISubmissionRepository';

const SEL = 'id, name, email, message, city, country, status, created_at AS createdAt, deleted_at AS deletedAt';

function toISO(val: any): string {
  return val instanceof Date ? val.toISOString() : new Date(val).toISOString();
}

function rowToSubmission(row: any): Submission {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    message: row.message,
    city: row.city ?? null,
    country: row.country ?? null,
    status: (row.status as SubmissionStatus) ?? 'Open',
    createdAt: toISO(row.createdAt),
    deletedAt: row.deletedAt ? toISO(row.deletedAt) : null,
  };
}

/**
 * Database-backed implementation of ISubmissionRepository.
 * Uses MySQL via databaseClient. Submissions are never physically deleted;
 * they are soft-deleted by setting deleted_at, and all reads filter them out.
 */
export class DatabaseSubmissionRepository implements ISubmissionRepository {
  private readonly t = 'submissions';

  async save(submission: SubmissionEntity): Promise<void> {
    const d = submission.toJSON();
    await databaseClient.query(
      `INSERT INTO ${this.t} (id, name, email, message, city, country, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email), message=VALUES(message),
         city=VALUES(city), country=VALUES(country), status=VALUES(status)`,
      [d.id, d.name, d.email, d.message, d.city, d.country, d.status, new Date(d.createdAt)],
    );
  }

  async findAll(): Promise<Submission[]> {
    const rows = await databaseClient.query<any>(
      `SELECT ${SEL} FROM ${this.t} WHERE deleted_at IS NULL ORDER BY created_at DESC`,
    );
    return rows.map(rowToSubmission);
  }

  async findById(id: string): Promise<Submission | null> {
    const rows = await databaseClient.query<any>(
      `SELECT ${SEL} FROM ${this.t} WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
      [id],
    );
    return rows.length ? rowToSubmission(rows[0]) : null;
  }

  async findByEmail(email: string): Promise<Submission | null> {
    const rows = await databaseClient.query<any>(
      `SELECT ${SEL} FROM ${this.t} WHERE email = ? AND deleted_at IS NULL LIMIT 1`,
      [email.trim().toLowerCase()],
    );
    return rows.length ? rowToSubmission(rows[0]) : null;
  }

  async update(id: string, data: {
    name?: string; email?: string; message?: string;
    city?: string | null; country?: string | null; status?: SubmissionStatus;
  }): Promise<Submission> {
    const sets: string[] = [];
    const vals: any[] = [];

    if (data.name !== undefined)    { sets.push('name=?');    vals.push(data.name); }
    if (data.email !== undefined)   { sets.push('email=?');   vals.push(data.email); }
    if (data.message !== undefined) { sets.push('message=?'); vals.push(data.message); }
    if ('city' in data)             { sets.push('city=?');    vals.push(data.city); }
    if ('country' in data)          { sets.push('country=?'); vals.push(data.country); }
    if (data.status !== undefined)  { sets.push('status=?');  vals.push(data.status); }

    if (sets.length > 0) {
      vals.push(id);
      await databaseClient.query(
        `UPDATE ${this.t} SET ${sets.join(', ')} WHERE id=? AND deleted_at IS NULL`,
        vals,
      );
    }

    const rows = await databaseClient.query<any>(
      `SELECT ${SEL} FROM ${this.t} WHERE id=? LIMIT 1`,
      [id],
    );
    return rowToSubmission(rows[0]);
  }

  async deleteById(id: string): Promise<void> {
    // Soft delete: never remove the row, just stamp deleted_at.
    await databaseClient.query(
      `UPDATE ${this.t} SET deleted_at=? WHERE id=? AND deleted_at IS NULL`,
      [new Date(), id],
    );
  }

  async saveAll(submissions: Submission[]): Promise<void> {
    if (!submissions.length) return;
    const vals: any[] = [];
    const placeholders = submissions.map(s => {
      vals.push(s.id, s.name, s.email, s.message, s.city ?? null, s.country ?? null, s.status ?? 'Open', new Date(s.createdAt));
      return '(?,?,?,?,?,?,?,?)';
    }).join(',');
    await databaseClient.query(
      `INSERT INTO ${this.t} (id,name,email,message,city,country,status,created_at) VALUES ${placeholders}
       ON DUPLICATE KEY UPDATE name=VALUES(name),email=VALUES(email),message=VALUES(message),
         city=VALUES(city),country=VALUES(country),status=VALUES(status)`,
      vals,
    );
  }
}
