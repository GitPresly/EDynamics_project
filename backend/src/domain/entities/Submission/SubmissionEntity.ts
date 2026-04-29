import { Submission, SubmissionStatus } from './Submission';
import { CreateSubmissionRequest } from '../../../presentation/requests/Submission/CreateSubmissionRequest';

export class SubmissionEntity {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly message: string,
    public readonly city: string,
    public readonly country: string,
    public readonly status: SubmissionStatus,
    public readonly createdAt: string,
    public readonly deletedAt?: string
  ) { }

  static create(request: CreateSubmissionRequest & { city?: string; country?: string }): SubmissionEntity {
    // Validation
    if (!request.name || request.name.trim().length === 0) {
      throw new Error('Name is required');
    }

    if (!request.email || request.email.trim().length === 0) {
      throw new Error('Email is required');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.email)) {
      throw new Error('Invalid email format');
    }

    if (!request.message || request.message.trim().length === 0) {
      throw new Error('Message is required');
    }

    // Generate ID and timestamp
    const id = this.generateId();
    const createdAt = new Date().toISOString();

    return new SubmissionEntity(
      id,
      request.name.trim(),
      request.email.trim().toLowerCase(),
      request.message.trim(),
      (request.city || '').trim(),
      (request.country || '').trim(),
      'Open', // Default status for new submissions
      createdAt
    );
  }

  static fromData(data: Submission): SubmissionEntity {
    return new SubmissionEntity(
      data.id,
      data.name,
      data.email,
      data.message,
      data.city,
      data.country,
      data.status,
      data.createdAt,
      data.deletedAt
    );
  }

  softDelete(): SubmissionEntity {
    return new SubmissionEntity(
      this.id,
      this.name,
      this.email,
      this.message,
      this.city,
      this.country,
      this.status,
      this.createdAt,
      new Date().toISOString() // Set deletion date and hour
    );
  }

  toJSON(): Submission {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      message: this.message,
      city: this.city,
      country: this.country,
      status: this.status,
      createdAt: this.createdAt,
      deletedAt: this.deletedAt,
    };
  }

  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}