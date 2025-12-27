import { Request, Response, NextFunction } from 'express';
import { dataService } from '../services/data.service';
import { notifierService } from '../services/notifier.service';

export class SettingsController {
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await dataService.getSettings();
      res.json({ success: true, data: settings });
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
