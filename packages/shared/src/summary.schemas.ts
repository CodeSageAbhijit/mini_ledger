import { z } from 'zod';

export const summarySchema = z.object({
  totalLentPaise: z.number().int(),
  totalRepaidPaise: z.number().int(),
  outstandingPaise: z.number().int(),
  overduePaise: z.number().int(),
  counts: z.object({
    total: z.number().int(),
    pending: z.number().int(),
    repaid: z.number().int(),
    overdue: z.number().int(),
  }),
});

export type SummaryResponse = z.infer<typeof summarySchema>;
