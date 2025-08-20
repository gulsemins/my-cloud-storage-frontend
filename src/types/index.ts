export interface AuthResponse {
  token: string;
}

// UserResponseDto'yu karşılamak için
export interface UserInfo {
  id: string;
  username: string;
  email: string;
}

// UploadedFileResponseDto ile uyumlu hale getirildi
export interface UploadedFile {
  id: string;
  originalFileName: string;
  size: number;
  uploadedAt: string; // ISO string format
  createdAt: string; // ISO string format
}

// SharedFileResponseDto'yu karşılamak için
export interface SharedFile {
  id: string;
  file: UploadedFile;
  sharedBy: UserInfo;
  sharedWith: UserInfo;
  createdAt: string; // ISO string format
}
