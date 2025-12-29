import { z } from 'zod';

export const updateSettingsSchema = z.object({
  body: z.object({
    notification_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    target_platform: z.enum(['Telegram', 'Slack', 'Discord']).optional(),
    telegram_token: z.string().optional(),
    telegram_chat_id: z.string().optional(),
    notification_enabled: z.boolean().optional(),
  }),
});
