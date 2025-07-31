export interface AuthResponse {
  token: string;
}

export interface UploadedFile {
  id: string;
  originalFileName: string;
  size: number;
  uploadedAt: string; // ISO string format
  owner: string;
  location: string;
}
