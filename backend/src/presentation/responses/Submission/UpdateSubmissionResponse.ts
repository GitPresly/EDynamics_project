import { Submission } from '../../../domain/entities/Submission/Submission';
import { Response } from '../Response';

export class UpdateSubmissionResponse extends Response {
  id: string;
  name: string;
  email: string;
  message: string;
  city: string;    // Added
  country: string; // Added
  status: string;  // Added
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
    this.city = submission.city || '';       // Mapping new field
    this.country = submission.country || ''; // Mapping new field
    this.status = submission.status || 'Open'; // Mapping new field
    this.createdAt = submission.createdAt;
  }
}