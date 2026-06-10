import 'dotenv/config';
import { promises as fs } from 'fs';
import path from 'path';
import { Submission, SubmissionStatus } from '../../../domain/entities/Submission/Submission';
import { SubmissionEntity } from '../../../domain/entities/Submission/SubmissionEntity';
import { ISubmissionRepository } from '../interfaces/ISubmissionRepository';

// Get DATA_FILE_PATH from environment variable, with fallback to default
const getDataFilePath = (): string => {
  const envPath = process.env.DATA_FILE_PATH;
  if (envPath) {
    // If it's an absolute path, use it directly
    if (path.isAbsolute(envPath)) {
      return envPath;
    }
    // If it's a relative path, resolve it relative to the backend directory
    return path.resolve(process.cwd(), envPath);
  }
  // Default fallback
  return path.join(__dirname, '../../../../data/submissions.json');
};

const DATA_FILE_PATH = getDataFilePath();

/**
 * File-backed implementation of ISubmissionRepository.
 * Submissions are never physically removed from the JSON file; deleting a
 * submission writes a `deletedAt` timestamp on its record, and all reads
 * filter out records that have been soft-deleted.
 */
export class FileRepository implements ISubmissionRepository {

  private async ensureDataFile(): Promise<void> {
    try {
      await fs.access(DATA_FILE_PATH);
    } catch {
      // File (or its directory) doesn't exist yet — create both.
      await fs.mkdir(path.dirname(DATA_FILE_PATH), { recursive: true });
      await fs.writeFile(DATA_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  private async readAll(): Promise<Submission[]> {
    await this.ensureDataFile();
    try {
      const data = await fs.readFile(DATA_FILE_PATH, 'utf-8');
      return JSON.parse(data) as Submission[];
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as any).code === 'ENOENT') {
        return [];
      }
      throw new Error(`Failed to read submissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async writeAll(submissions: Submission[]): Promise<void> {
    await this.ensureDataFile();
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(submissions, null, 2), 'utf-8');
  }

  async save(submission: SubmissionEntity): Promise<void> {
    const all = await this.readAll();
    all.push(submission.toJSON());
    await this.writeAll(all);
  }

  async findAll(): Promise<Submission[]> {
    const all = await this.readAll();
    return all.filter(s => !s.deletedAt);
  }

  async findById(id: string): Promise<Submission | null> {
    const all = await this.readAll();
    return all.find(s => s.id === id && !s.deletedAt) ?? null;
  }

  async findByEmail(email: string): Promise<Submission | null> {
    const all = await this.readAll();
    const normalized = email.trim().toLowerCase();
    return all.find(s => s.email === normalized && !s.deletedAt) ?? null;
  }

  async update(id: string, data: {
    name?: string; email?: string; message?: string;
    city?: string | null; country?: string | null; status?: SubmissionStatus;
  }): Promise<Submission> {
    const all = await this.readAll();
    const index = all.findIndex(s => s.id === id && !s.deletedAt);
    if (index === -1) throw new Error('Submission not found');

    const updated: Submission = {
      ...all[index],
      ...(data.name !== undefined    ? { name: data.name }       : {}),
      ...(data.email !== undefined   ? { email: data.email }     : {}),
      ...(data.message !== undefined ? { message: data.message } : {}),
      ...('city' in data             ? { city: data.city }       : {}),
      ...('country' in data          ? { country: data.country } : {}),
      ...(data.status !== undefined  ? { status: data.status }   : {}),
    };

    all[index] = updated;
    await this.writeAll(all);
    return updated;
  }

  async deleteById(id: string): Promise<void> {
    // Soft delete: keep the record, just mark it as deleted in the JSON file.
    const all = await this.readAll();
    const index = all.findIndex(s => s.id === id && !s.deletedAt);
    if (index === -1) return;
    all[index] = { ...all[index], deletedAt: new Date().toISOString() };
    await this.writeAll(all);
  }

  async saveAll(submissions: Submission[]): Promise<void> {
    await this.writeAll(submissions);
  }
}
