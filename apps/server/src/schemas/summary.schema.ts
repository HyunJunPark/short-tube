import { z } from 'zod';

export const generateSummarySchema = z.object({
  body: z.object({
    videoId: z.string().min(1, 'Video ID is required'),
    tags: z.array(z.string()).default([]),
  }),
});

export const getSummariesSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    channelName: z.string().optional(),
    date: z.string().optional(),
    limit: z.string().transform(Number).optional(),
    offset: z.string().transform(Number).optional(),
  }),
});
