import { ISubmissionRepository } from '../../../infrastructure/submissions/interfaces/ISubmissionRepository';

export class DeleteSubmissionUseCase {
  constructor(private repository: ISubmissionRepository) { }

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new Error('Submission not found');
    }
    // Soft delete — the repository marks the record as deleted, never removes it.
    await this.repository.deleteById(id);
  }
}
