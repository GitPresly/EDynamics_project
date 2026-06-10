import type { Submission } from '../../../domain/entities/Submission/Submission';
import type { Response } from '../Response';

export type UpdateSubmissionResponse = Response<Submission> & {
  id: string;
  name: string;
  email: string;
  message: string;
  city: string | null;
  country: string | null;
  status: Submission['status'];
  createdAt: string;
};
