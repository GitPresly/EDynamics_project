import { SubmissionEntity } from '../../../domain/entities/Submission/SubmissionEntity';
import { Response } from '../Response';

export class CreateSubmissionResponse extends Response {
  id: string;
  name: string;
  email: string;
  message: string;
  city: string;    // Added
  country: string; // Added
  status: string;  // Added
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
    this.city = data.city || '';       // Mapping new field
    this.country = data.country || ''; // Mapping new field
    this.status = data.status || 'Open'; // Mapping new field
    this.createdAt = data.createdAt;
  }
}