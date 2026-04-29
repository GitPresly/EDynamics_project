import { SubmissionEntity } from '../../../domain/entities/Submission/SubmissionEntity';
import { Submission } from '../../../domain/entities/Submission/Submission';
import { CreateSubmissionRequest } from '../../../presentation/requests/Submission/CreateSubmissionRequest';
import { UpdateSubmissionResponse } from '../../../presentation/responses/Submission/UpdateSubmissionResponse';
import { ISubmissionRepository } from '../../../infrastructure/fileSystem/fileRepository';

export class UpdateSubmissionUseCase {
  constructor(private repository: ISubmissionRepository) {}

  async execute(id: string, request: CreateSubmissionRequest & { city?: string; country?: string; status?: string }): Promise<UpdateSubmissionResponse> {
    // 1. Validate basic fields by creating a temporary entity (preserves your existing validation logic)
    const validationEntity = SubmissionEntity.create(request);

    // 2. Get all submissions (include deleted to ensure we find the right index)
    const submissions = await this.repository.findAll(true);
    const index = submissions.findIndex(s => s.id === id);

    if (index === -1) {
      throw new Error('Submission not found');
    }

    const existingSubmission = submissions[index];

    // 3. Update only the allowed fields, preserving everything else (ID, createdAt, deletedAt)
    const updated: Submission = {
      ...existingSubmission,
      id: existingSubmission.id,
      name: validationEntity.name,
      email: validationEntity.email,
      message: validationEntity.message,
      city: (request.city || '').trim(),
      country: (request.country || '').trim(),
      status: (request.status as any) || existingSubmission.status || 'Open',
    };

    submissions[index] = updated;
    await this.repository.saveAll(submissions);

    return new UpdateSubmissionResponse(updated);
  }
}