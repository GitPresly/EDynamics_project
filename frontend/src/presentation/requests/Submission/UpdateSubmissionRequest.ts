export interface UpdateSubmissionRequest {
  name: string;
  email: string;
  message: string;
  city?: string;
  country?: string;
  status?: string;
}