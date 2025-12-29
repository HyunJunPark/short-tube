import { Request, Response, NextFunction } from 'express';
import { dataService } from '../repositories';
import { youtubeService } from '../services/youtube.service';

export class VideoController {
  async getByChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const { channelId } = req.params;
      // Default to 30 days for better cache accumulation, can be overridden by query param
      const { days = '30' } = req.query;

      // Check cache first
      const cached = await dataService.getVideoCache(channelId);

      if (cached.length > 0) {
        return res.json({ success: true, data: cached, cached: true });
      }

      // Fetch from YouTube
      const videos = await youtubeService.getRecentVideos(channelId, Number(days));

      // Cache the results
      await dataService.saveVideoCache(channelId, videos);

      res.json({ success: true, data: videos, cached: false });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('Refreshing videos for channel:', req.params.channelId);
      const { channelId } = req.params;
      // Fetch 30 days of videos on refresh (instead of 7 days)
      const videos = await youtubeService.getRecentVideos(channelId, 30);

      // Merge with existing cache
      await dataService.saveVideoCache(channelId, videos);

      res.json({ success: true, data: videos });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const subscriptions = await dataService.getSubscriptions();
      let totalVideos = 0;

      for (const subscription of subscriptions) {
        const videos = await dataService.getVideoCache(subscription.channel_id);
        totalVideos += videos.length;
      }

      res.json({ success: true, data: { total_videos: totalVideos } });
    } catch (error) {
      next(error);
    }
  }
}

export const videoController = new VideoController();
