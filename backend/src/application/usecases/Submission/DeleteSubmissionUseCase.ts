import { ISubmissionRepository } from '../../../infrastructure/fileSystem/fileRepository';

export class DeleteSubmissionUseCase {
  constructor(private repository: ISubmissionRepository) {}

  async execute(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}