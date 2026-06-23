export interface StorageConfig {
  accessKey: string | null;
  secretKey: string | null;
  refreshToken: string | null;
  uploadUrl: string | null;
}

export interface UploadResult {
  url: string;
}

export interface IStorageAdapter {
  upload(file: File | Blob, filename: string): Promise<UploadResult>;
  delete(url: string): Promise<boolean>;
  getToken(): Promise<string | null>;
}
