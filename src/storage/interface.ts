export interface StorageConfig {
  accessKey: string | null;
  secretKey: string | null;
  refreshToken: string | null;
  uploadUrl: string | null;
}

export interface FileRecord {
  original_url: string;
  ext_config?: string | null;
}

export interface UploadResult {
  url: string;
  ext_config?: string;
}

export interface IStorageAdapter {
  upload(file: File | Blob, filename: string): Promise<UploadResult>;
  delete(file: FileRecord): Promise<boolean>;
  getToken(): Promise<string | null>;
}
