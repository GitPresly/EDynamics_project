import 'dotenv/config';
import { promises as fs } from 'fs';
import path from 'path';
import { Submission } from '../../domain/entities/Submission/Submission';
import { SubmissionEntity } from '../../domain/entities/Submission/SubmissionEntity';

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
  return path.join(__dirname, '../../../data/submissions.json');
};

const DATA_FILE_PATH = getDataFilePath();

export interface ISubmissionRepository {
  save(submission: SubmissionEntity): Promise<void>;
  findAll(includeDeleted?: boolean): Promise<Submission[]>;
  findById(id: string): Promise<Submission | null>;
  saveAll(submissions: Submission[]): Promise<void>;
  delete(id: string): Promise<void>;
  findByEmail(email: string): Promise<Submission | null>;
}

export class FileRepository implements ISubmissionRepository {

  private async ensureDataFile(): Promise<void> {
    try {
      await fs.access(DATA_FILE_PATH);
    } catch {
      await fs.writeFile(DATA_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  async save(submission: SubmissionEntity): Promise<void> {
    await this.ensureDataFile();

    const submissions = await this.findAll();
    submissions.push(submission.toJSON());

    await fs.writeFile(
      DATA_FILE_PATH,
      JSON.stringify(submissions, null, 2),
      'utf-8'
    );
  }

  async delete(id: string): Promise<void> {
    const submissions = await this.findAll(true);
    const index = submissions.findIndex(s => s.id === id);

    if (index !== -1) {
      const entity = SubmissionEntity.fromData(submissions[index]);
      submissions[index] = entity.softDelete().toJSON();

      await this.saveAll(submissions);
    } else {
      throw new Error('Submission not found');
    }
  }

  async findAll(includeDeleted: boolean = false): Promise<Submission[]> {
    await this.ensureDataFile();
    try {
      const data = await fs.readFile(DATA_FILE_PATH, 'utf-8');
      const submissions: Submission[] = JSON.parse(data);

      if (!includeDeleted) {
        return submissions.filter(s => !s.deletedAt);
      }
      return submissions;
    } catch (error) {
      return [];
    }
  }

  async findById(id: string): Promise<Submission | null> {
    const submissions = await this.findAll();
    const submission = submissions.find(s => s.id === id);
    return submission || null;
  }

  async findByEmail(email: string): Promise<Submission | null> {
    const submissions = await this.findAll(); // This already filters out soft-deleted ones
    const submission = submissions.find(s => s.email.toLowerCase() === email.toLowerCase());
    return submission || null;
  }

  async saveAll(submissions: Submission[]): Promise<void> {
    await this.ensureDataFile();

    await fs.writeFile(
      DATA_FILE_PATH,
      JSON.stringify(submissions, null, 2),
      'utf-8'
    );
  }
}
