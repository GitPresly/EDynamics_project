import { Submission, SubmissionStatus } from '../../../domain/entities/Submission/Submission';
import { Response } from '../Response';

export class UpdateSubmissionResponse extends Response {
  id: string;
  name: string;
  email: string;
  message: string;
  city: string | null;
  country: string | null;
  status: SubmissionStatus;
  createdAt: string;

  constructor(
    submission: Submission,
    success: boolean = true,
    message: string = 'Submission updated successfully'
  ) {
    super(success, submission, message);
    this.id = submission.id;
    this.name = submission.name;
    this.email = submission.email;
    this.message = submission.message;
    this.city = submission.city ?? null;
    this.country = submission.country ?? null;
    this.status = submission.status;
    this.createdAt = submission.createdAt;
  }
}
