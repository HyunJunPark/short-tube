import { z } from 'zod';

export const addSubscriptionSchema = z.object({
  body: z.object({
    channelInput: z.string().min(1, 'Channel input is required'),
  }),
});

export const updateSubscriptionSchema = z.object({
  params: z.object({
    channelId: z.string().min(1, 'Channel ID is required'),
  }),
  body: z.object({
    tags: z.array(z.string()).optional(),
    is_active: z.boolean().optional(),
  }),
});

export const deleteSubscriptionSchema = z.object({
  params: z.object({
    channelId: z.string().min(1, 'Channel ID is required'),
  }),
});
