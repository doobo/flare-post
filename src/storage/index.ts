import { IStorageAdapter, StorageConfig } from "./interface";
import { ImGeAdapter } from "./imge";
import { S3Adapter } from "./s3";
import { R2Adapter } from "./r2";

export type { IStorageAdapter, StorageConfig, UploadResult, FileRecord } from "./interface";

export function getStorageAdapter(storageType: string, config: StorageConfig): IStorageAdapter {
  switch (storageType) {
    case 'S3':
      return new S3Adapter(config);
    case 'R2':
      return new R2Adapter(config);
    case 'common':
    default:
      return new ImGeAdapter(config);
  }
}
