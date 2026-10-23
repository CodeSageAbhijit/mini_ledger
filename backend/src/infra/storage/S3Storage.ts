import type { Readable } from 'stream';
import { AppError } from '../../common/errors';
import type { FileStorage, FilePayload, StoredFile } from './FileStorage';

export class S3Storage implements FileStorage {
  async save(_file: FilePayload): Promise<StoredFile> {
    throw new AppError(
      'NOT_IMPLEMENTED',
      501,
      'S3Storage is not configured. Set STORAGE_DRIVER=local or configure AWS S3 SDK.',
    );
  }

  async getStream(_storageKey: string): Promise<Readable> {
    throw new AppError('NOT_IMPLEMENTED', 501, 'S3Storage getStream is not implemented.');
  }

  async delete(_storageKey: string): Promise<void> {
    throw new AppError('NOT_IMPLEMENTED', 501, 'S3Storage delete is not implemented.');
  }
}
