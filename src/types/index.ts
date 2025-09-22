export interface AuthResponse {
  token: string;
}

export interface UserInfo {
  id: string;
  username: string;
  email: string;
}
export interface Folder {
  id: string;
  name: string;
  parentFolderId: string | null;
  createdAt: string;
}
export interface UploadedFile {
  id: string;
  originalFileName: string;
  size: number;
  uploadedAt: string;
  createdAt: string;
  folderId: string | null;
}

export interface SharedFile {
  id: string;
  file: UploadedFile;
  sharedBy: UserInfo;
  sharedWith: UserInfo;
  createdAt: string;
}
