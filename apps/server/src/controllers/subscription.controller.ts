import { Request, Response, NextFunction } from 'express';
import { dataService } from '../repositories';
import { youtubeService } from '../services/youtube.service';
import { geminiService } from '../services/gemini.service';

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

      // Get channel info (including description and topic categories)
      const channelInfo = await youtubeService.getChannelInfo(channelInput);

      // AI category recommendation (with fallback to empty array)
      let recommendedCategories: string[] = [];
      try {
        recommendedCategories = await geminiService.recommendCategories(
          channelInfo.channel_name,
          channelInfo.description || '',
          channelInfo.topicCategories || []
        );
        console.log(`AI recommended categories for ${channelInfo.channel_name}:`, recommendedCategories);
      } catch (error) {
        console.warn('Failed to get AI category recommendations:', error);
        // Continue with empty categories
      }

      // Create subscription with AI-recommended categories
      const subscription = {
        channel_id: channelInfo.channel_id,
        channel_name: channelInfo.channel_name,
        tags: [], // 요약 키워드 (사용자가 나중에 설정)
        categories: recommendedCategories, // AI 추천 카테고리
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
