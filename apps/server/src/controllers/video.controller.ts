import { Request, Response, NextFunction } from 'express';
import { dataService } from '../services/data.service';
import { youtubeService } from '../services/youtube.service';

export class VideoController {
  async getByChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const { channelId } = req.params;
      const { days = '7' } = req.query;

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
      const { days = '7' } = req.query;

      const videos = await youtubeService.getRecentVideos(channelId, Number(days));

      await dataService.saveVideoCache(channelId, videos);

      res.json({ success: true, data: videos });
    } catch (error) {
      next(error);
    }
  }
}

export const videoController = new VideoController();
