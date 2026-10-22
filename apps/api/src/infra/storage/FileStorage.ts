import type { Readable } from 'stream';

export interface FilePayload {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

export interface StoredFile {
  storageKey: string;
  sizeBytes: number;
  mimeType: string;
}

export interface FileStorage {
  save(file: FilePayload): Promise<StoredFile>;
  getStream(storageKey: string): Promise<Readable>;
  delete(storageKey: string): Promise<void>;
}
