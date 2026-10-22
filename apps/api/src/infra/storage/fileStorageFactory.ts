import type { Config } from '../../config/env';
import type { FileStorage } from './FileStorage';
import { LocalDiskStorage } from './LocalDiskStorage';
import { S3Storage } from './S3Storage';

export function createFileStorage(config: Config): FileStorage {
  if (config.STORAGE_DRIVER === 's3') {
    return new S3Storage();
  }
  return new LocalDiskStorage(config.UPLOAD_DIR);
}
