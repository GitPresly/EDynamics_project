export type SubmissionStatus = 'Open' | 'In Review' | 'Approved' | 'Declined';

export interface Submission {
  id: string;
  name: string;
  email: string;
  message: string;
  city?: string | null;
  country?: string | null;
  status: SubmissionStatus;
  createdAt: string;
}
