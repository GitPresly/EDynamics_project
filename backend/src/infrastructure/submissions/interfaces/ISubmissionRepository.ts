import { Submission, SubmissionStatus } from '../../../domain/entities/Submission/Submission';
import { SubmissionEntity } from '../../../domain/entities/Submission/SubmissionEntity';

export interface ISubmissionRepository {
  save(submission: SubmissionEntity): Promise<void>;
  findAll(): Promise<Submission[]>;
  findById(id: string): Promise<Submission | null>;
  findByEmail(email: string): Promise<Submission | null>;
  update(id: string, data: {
    name?: string;
    email?: string;
    message?: string;
    city?: string | null;
    country?: string | null;
    status?: SubmissionStatus;
  }): Promise<Submission>;
  deleteById(id: string): Promise<void>;
  saveAll(submissions: Submission[]): Promise<void>;
}
