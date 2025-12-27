import { Request, Response, NextFunction } from 'express';
import { scheduler } from '../scheduler';

export class MonitorController {
  /**
   * Manually trigger monitoring
   */
  async trigger(req: Request, res: Response, next: NextFunction) {
    try {
      const { briefing = false } = req.body;

      // Run in background (don't wait for completion)
      scheduler.runNow(briefing).catch(error => {
        console.error('Monitor job failed:', error);
      });

      res.json({
        success: true,
        message: 'Monitoring job triggered',
        briefing,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const monitorController = new MonitorController();
