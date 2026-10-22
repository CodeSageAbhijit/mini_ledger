import { createReadStream, promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type { Readable } from 'stream';
import { NotFoundError } from '../../common/errors';
import type { FileStorage, FilePayload, StoredFile } from './FileStorage';

export class LocalDiskStorage implements FileStorage {
  private readonly uploadDir: string;

  constructor(uploadDir = './uploads') {
    this.uploadDir = path.resolve(uploadDir);
  }

  private async ensureDir(): Promise<void> {
    await fs.mkdir(this.uploadDir, { recursive: true });
  }

  async save(file: FilePayload): Promise<StoredFile> {
    await this.ensureDir();
    const ext = path.extname(file.originalName) || '.bin';
    const storageKey = `${randomUUID()}${ext}`;
    const filePath = path.join(this.uploadDir, storageKey);

    await fs.writeFile(filePath, file.buffer);

    return {
      storageKey,
      sizeBytes: file.buffer.length,
      mimeType: file.mimeType,
    };
  }

  async getStream(storageKey: string): Promise<Readable> {
    const filePath = path.join(this.uploadDir, storageKey);
    try {
      await fs.access(filePath);
    } catch {
      throw new NotFoundError('Receipt file not found on disk');
    }
    return createReadStream(filePath);
  }

  async delete(storageKey: string): Promise<void> {
    const filePath = path.join(this.uploadDir, storageKey);
    try {
      await fs.unlink(filePath);
    } catch {
      // Ignored if file does not exist
    }
  }
}
