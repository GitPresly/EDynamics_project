import { runDataQualityJob } from '../../../jobs/dataQualityJob';
import type { JobTriggerOutcome } from './TriggerImportJobUseCase';

export interface TriggerDataQualityJobInput {
  providerId?: string;
  batchSize?: number;
}

export class TriggerDataQualityJobUseCase {
  async execute(input: TriggerDataQualityJobInput = {}): Promise<JobTriggerOutcome> {
    return runDataQualityJob({ providerId: input.providerId, batchSize: input.batchSize });
  }
}