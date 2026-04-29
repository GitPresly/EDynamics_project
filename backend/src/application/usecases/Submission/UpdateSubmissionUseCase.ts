import { Submission } from '../../../domain/entities/Submission/Submission';
import { UpdateSubmissionResponse } from '../../../presentation/responses/Submission/UpdateSubmissionResponse';
import { ISubmissionRepository } from '../../../infrastructure/fileSystem/fileRepository';

// Defining the interface locally to stop "Module not found" errors
export interface UpdateSubmissionRequest {
  name: string;
  email: string;
  message: string;
  city?: string;
  country?: string;
  status?: string;
}

export class UpdateSubmissionUseCase {
  constructor(private repository: ISubmissionRepository) {}

  async execute(id: string, request: UpdateSubmissionRequest): Promise<UpdateSubmissionResponse> {
    // 1. Get all submissions (including deleted ones)
    const submissions = await this.repository.findAll(true);
    const index = submissions.findIndex(s => s.id === id);

    if (index === -1) {
      throw new Error('Submission not found');
    }

    const existing = submissions[index];

    // 2. Map fields explicitly to ensure they actually save.
    // This is the specific logic that fixes your "status not updating" issue.
    const updated: Submission = {
      ...existing, // Keeps original ID, createdAt, and deletedAt
      name: request.name.trim(),
      email: request.email.trim().toLowerCase(),
      message: request.message.trim(),
      city: (request.city || '').trim(),
      country: (request.country || '').trim(),
      status: (request.status as any) || existing.status || 'Open',
    };

    // 3. Save back to the repository
    submissions[index] = updated;
    await this.repository.saveAll(submissions);

    return new UpdateSubmissionResponse(updated);
  }
}