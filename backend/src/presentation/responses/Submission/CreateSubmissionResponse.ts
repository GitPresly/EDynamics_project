import { SubmissionEntity } from '../../../domain/entities/Submission/SubmissionEntity';
import { SubmissionStatus } from '../../../domain/entities/Submission/Submission';
import { Response } from '../Response';

export class CreateSubmissionResponse extends Response {
  id: string;
  name: string;
  email: string;
  message: string;
  city: string | null;
  country: string | null;
  status: SubmissionStatus;
  createdAt: string;

  constructor(
    submission: SubmissionEntity,
    success: boolean = true,
    message: string = 'Submission created successfully'
  ) {
    const data = submission.toJSON();
    super(success, data, message);
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.message = data.message;
    this.city = data.city ?? null;
    this.country = data.country ?? null;
    this.status = data.status;
    this.createdAt = data.createdAt;
  }
}
