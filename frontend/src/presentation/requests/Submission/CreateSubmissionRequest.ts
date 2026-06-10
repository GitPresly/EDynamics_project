export interface CreateSubmissionRequest {
  name: string;
  email: string;
  message: string;
  city?: string;
  country?: string;
}
