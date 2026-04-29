import { Submission } from '../../../domain/entities/Submission/Submission';
import { Response } from '../Response';

export class GetSubmissionsResponse extends Response {
  data: Array<{
    id: string;
    name: string;
    email: string;
    message: string;
    city: string;    // Added
    country: string; // Added
    status: string;  // Added
    createdAt: string;
  }>;
  count: number;

  constructor(submissions: Submission[], success: boolean = true) {
    const mappedData = submissions.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      message: s.message,
      city: s.city || '',         // Mapping new field
      country: s.country || '',   // Mapping new field
      status: s.status || 'Open', // Mapping new field
      createdAt: s.createdAt,
    }));
    super(success, mappedData, 'Submissions retrieved successfully');
    this.data = mappedData;
    this.count = this.data.length;
  }
}