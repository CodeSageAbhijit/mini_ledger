import type { Request, Response } from 'express';
import { ValidationError } from '../../common/errors';
import type { ReceiptsService } from './receipts.service';

export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  upload = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const loanId = req.params.id;

    if (!req.file) {
      throw new ValidationError('No file uploaded. Please attach an image in the "file" field.');
    }

    const receipt = await this.receiptsService.uploadReceipt(userId, loanId, {
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    res.status(201).json({
      id: receipt.id,
      loanId: receipt.loanId,
      mimeType: receipt.mimeType,
      sizeBytes: receipt.sizeBytes,
      createdAt: receipt.createdAt.toISOString(),
    });
  };

  getFile = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const receiptId = req.params.id;

    const { stream, mimeType } = await this.receiptsService.getReceiptStream(userId, receiptId);
    res.setHeader('Content-Type', mimeType);
    stream.pipe(res);
  };
}
