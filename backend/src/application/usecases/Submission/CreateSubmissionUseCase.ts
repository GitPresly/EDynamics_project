import { SubmissionEntity } from '../../../domain/entities/Submission/SubmissionEntity';
import { CreateSubmissionRequest } from '../../../presentation/requests/Submission/CreateSubmissionRequest';
import { CreateSubmissionResponse } from '../../../presentation/responses/Submission/CreateSubmissionResponse';
import { ISubmissionRepository } from '../../../infrastructure/fileSystem/fileRepository';

export class CreateSubmissionUseCase {
  constructor(private repository: ISubmissionRepository) { }

  async execute(request: CreateSubmissionRequest): Promise<CreateSubmissionResponse> {
    // 1. Check if email already exists (non-deleted)
    const existing = await this.repository.findByEmail(request.email);
    if (existing) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }

    // 2. Create entity with validation
    const submission = SubmissionEntity.create(request);

    // 3. Save to repository
    await this.repository.save(submission);

    return new CreateSubmissionResponse(submission);
  }
}