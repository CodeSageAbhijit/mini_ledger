import type { Readable } from 'stream';
import { NotFoundError, ValidationError } from '../../common/errors';
import type { FileStorage } from '../../infra/storage/FileStorage';
import type { LoanRepository, ReceiptRecord } from '../loans/LoanRepository';

export interface UploadFileInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

export class ReceiptsService {
  constructor(
    private readonly loanRepo: LoanRepository,
    private readonly storage: FileStorage,
  ) {}

  private validateMagicBytes(buffer: Buffer, mimeType: string): void {
    if (buffer.length < 12) {
      throw new ValidationError('File is corrupted or too small');
    }

    if (mimeType === 'image/jpeg') {
      const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      if (!isJpeg) throw new ValidationError('Invalid JPEG file content');
    } else if (mimeType === 'image/png') {
      const isPng =
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47;
      if (!isPng) throw new ValidationError('Invalid PNG file content');
    } else if (mimeType === 'image/webp') {
      const isRiff = buffer.subarray(0, 4).toString('ascii') === 'RIFF';
      const isWebp = buffer.subarray(8, 12).toString('ascii') === 'WEBP';
      if (!isRiff || !isWebp) throw new ValidationError('Invalid WebP file content');
    } else {
      throw new ValidationError('Unsupported file type. Only JPEG, PNG, and WebP are allowed.');
    }
  }

  async uploadReceipt(
    userId: string,
    loanId: string,
    file: UploadFileInput,
  ): Promise<ReceiptRecord> {
    // 1. Verify loan exists and belongs to user
    const loan = await this.loanRepo.findById(loanId, userId);
    if (!loan) {
      throw new NotFoundError('Loan not found');
    }

    // 2. Validate size (<= 5 MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new ValidationError('Receipt file exceeds 5MB limit');
    }

    // 3. Validate mime type & magic bytes
    this.validateMagicBytes(file.buffer, file.mimeType);

    // 4. Store file
    const stored = await this.storage.save({
      buffer: file.buffer,
      originalName: file.originalName,
      mimeType: file.mimeType,
    });

    // 5. Save receipt record linked to loan
    const receipt = await this.loanRepo.addReceipt(loanId, {
      storageKey: stored.storageKey,
      mimeType: stored.mimeType,
      sizeBytes: stored.sizeBytes,
    });

    return receipt;
  }

  async getReceiptStream(
    userId: string,
    receiptId: string,
  ): Promise<{ stream: Readable; mimeType: string }> {
    const receipt = await this.loanRepo.findReceiptById(receiptId, userId);
    if (!receipt) {
      throw new NotFoundError('Receipt not found');
    }

    const stream = await this.storage.getStream(receipt.storageKey);
    return {
      stream,
      mimeType: receipt.mimeType,
    };
  }
}
