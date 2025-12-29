import { Request, Response, NextFunction } from 'express';
import { dataService } from '../services/data.service';
import { notifierService } from '../services/notifier.service';

export class SettingsController {
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await dataService.getSettings();
      
      // Merge with environment variables if not set in database
      const mergedSettings = {
        ...settings,
        // Use environment variables as fallback if database values are empty
        telegram_token: settings.telegram_token || process.env.TELEGRAM_BOT_TOKEN || '',
        telegram_chat_id: settings.telegram_chat_id || process.env.TELEGRAM_CHAT_ID || '',
      };
      
      res.json({ success: true, data: mergedSettings });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updates = req.body;

      await dataService.updateSettings(updates);

      const updated = await dataService.getSettings();

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  async testTelegram(req: Request, res: Response, next: NextFunction) {
    try {
      const success = await notifierService.sendTest();

      if (success) {
        res.json({ success: true, message: 'Test message sent' });
      } else {
        res.status(400).json({ success: false, message: 'Failed to send test message' });
      }
    } catch (error) {
      next(error);
    }
  }
}

export const settingsController = new SettingsController();
