import { Request, Response, NextFunction } from 'express';
import { dataService } from '../services/data.service';
import { youtubeService } from '../services/youtube.service';

export class SubscriptionController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const subscriptions = await dataService.getSubscriptions();
      res.json({ success: true, data: subscriptions });
    } catch (error) {
      next(error);
    }
  }

  async add(req: Request, res: Response, next: NextFunction) {
    try {
      const { channelInput } = req.body;

      // Get channel info
      const channelInfo = await youtubeService.getChannelInfo(channelInput);

      // Create subscription
      const subscription = {
        channel_id: channelInfo.channel_id,
        channel_name: channelInfo.channel_name,
        tags: [],
        last_processed_video: channelInfo.latest_video_id,
        is_active: true,
      };

      await dataService.addSubscription(subscription);

      res.status(201).json({ success: true, data: subscription });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { channelId } = req.params;
      const updates = req.body;

      await dataService.updateSubscription(channelId, updates);

      const updated = await dataService.getSubscriptionById(channelId);

      res.json({ success: true, data: updated });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { channelId } = req.params;

      await dataService.deleteSubscription(channelId);

      res.json({ success: true, message: 'Subscription deleted' });
    } catch (error) {
      next(error);
    }
  }
}

export const subscriptionController = new SubscriptionController();
