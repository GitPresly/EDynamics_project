import { UpdateSubmissionRequest } from '../../../presentation/requests/Submission/UpdateSubmissionRequest';
import { UpdateSubmissionResponse } from '../../../presentation/responses/Submission/UpdateSubmissionResponse';
import { ISubmissionRepository } from '../../../infrastructure/submissions/interfaces/ISubmissionRepository';

export class UpdateSubmissionUseCase {
  constructor(private repository: ISubmissionRepository) { }

  async execute(id: string, request: UpdateSubmissionRequest): Promise<UpdateSubmissionResponse> {
    // Make sure the submission exists (and is not soft-deleted)
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Submission not found');
    }

    // Validate the incoming data
    if (!request.name || request.name.trim().length === 0) {
      throw new Error('Name is required');
    }
    if (!request.email || request.email.trim().length === 0) {
      throw new Error('Email is required');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.email)) {
      throw new Error('Invalid email format');
    }
    if (!request.message || request.message.trim().length === 0) {
      throw new Error('Message is required');
    }

    // Persist only the changed fields, preserving id and createdAt
    const updated = await this.repository.update(id, {
      name: request.name.trim(),
      email: request.email.trim().toLowerCase(),
      message: request.message.trim(),
      city: request.city ? request.city.trim() : null,
      country: request.country ? request.country.trim() : null,
      status: request.status,
    });

    return new UpdateSubmissionResponse(updated);
  }
}
