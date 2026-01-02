import { Request, Response, NextFunction } from 'express';
import { dataService, notificationLogRepository, videoCacheRepository } from '../repositories';
import { youtubeService } from '../services/youtube.service';

export class VideoController {
  async getByChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const { channelId } = req.params;

      // Return cache only - no API fallback
      const cached = await dataService.getVideoCache(channelId);
      res.json({ success: true, data: cached, cached: true });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('Refreshing videos for channel:', req.params.channelId);
      const { channelId } = req.params;
      // Fetch 30 days of videos on refresh via API for complete data
      const videos = await youtubeService.getRecentVideos(channelId, 30);

      // Replace entire cache with API data
      await videoCacheRepository.replaceForChannel(channelId, videos);

      res.json({ success: true, data: videos });
    } catch (error) {
      next(error);
    }
  }

  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const subscriptions = await dataService.getSubscriptions();
      let totalVideos = 0;
      let todayVideos = 0;

      // Get today's date range (server local timezone)
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      for (const subscription of subscriptions) {
        const videos = await dataService.getVideoCache(subscription.channel_id);
        totalVideos += videos.length;

        // Count videos published today
        for (const video of videos) {
          if (video.published_at) {
            const publishedDate = new Date(video.published_at);
            if (publishedDate >= todayStart && publishedDate <= todayEnd) {
              todayVideos++;
            }
          }
        }
      }

      res.json({
        success: true,
        data: {
          total_videos: totalVideos,
          today_video_count: todayVideos
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async checkNewVideos(_req: Request, res: Response, next: NextFunction) {
    try {
      const subscriptions = await dataService.getSubscriptions();
      const newVideosByChannel: Record<string, number> = {};

      for (const subscription of subscriptions) {
        if (!subscription.is_active) {
          newVideosByChannel[subscription.channel_id] = 0;
          continue;
        }

        try {
          // Initialize notification log for this channel if needed
          await notificationLogRepository.initializeIfNotExists(subscription.channel_id);

          // Get last checked time
          const notificationLog = await notificationLogRepository.getForChannel(subscription.channel_id);
          const checkedVideoIds = new Set(notificationLog?.checked_video_ids || []);

          // Fetch recent videos from RSS (7 days only)
          const recentVideos = await youtubeService.getVideosViaRSS(
            subscription.channel_id,
            7
          );

          // Get cached videos
          const cachedVideos = await dataService.getVideoCache(
            subscription.channel_id
          );
          const cachedVideoIds = new Set(cachedVideos.map(v => v.id));

          // Find new videos (not in cache)
          const newVideos = recentVideos.filter(v => !cachedVideoIds.has(v.id));

          // Count videos that are new and haven't been notified yet
          const notNotifiedVideos = newVideos.filter(v => !checkedVideoIds.has(v.id));

          // If there are new videos, add them to cache (they already have source: 'rss')
          if (newVideos.length > 0) {
            // Merge with existing cache (new videos first)
            const updatedCache = [...newVideos, ...cachedVideos];
            await dataService.saveVideoCache(subscription.channel_id, updatedCache);

            // Add new video IDs to notification log
            await notificationLogRepository.addCheckedVideos(
              subscription.channel_id,
              newVideos.map(v => v.id)
            );
          }

          // Return count of videos that haven't been notified yet
          newVideosByChannel[subscription.channel_id] = notNotifiedVideos.length;
        } catch (error) {
          console.error(
            `Error checking new videos for channel ${subscription.channel_id}:`,
            error
          );
          newVideosByChannel[subscription.channel_id] = 0;
        }
      }

      // Count total new videos
      const totalNewVideos = Object.values(newVideosByChannel).reduce(
        (sum, count) => sum + count,
        0
      );

      res.json({
        success: true,
        data: {
          totalNewVideos,
          byChannel: newVideosByChannel,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async markNotificationsChecked(req: Request, res: Response, next: NextFunction) {
    try {
      const { channelId } = req.params;
      const now = new Date().toISOString();

      // If channelId is '*', mark all channels as checked
      if (channelId === '*') {
        const subscriptions = await dataService.getSubscriptions();
        for (const subscription of subscriptions) {
          await notificationLogRepository.updateLastCheckedAt(
            subscription.channel_id,
            now
          );
        }
      } else {
        // Mark specific channel as checked
        await notificationLogRepository.updateLastCheckedAt(channelId, now);
      }

      res.json({
        success: true,
        data: { message: 'Notifications marked as checked' },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const videoController = new VideoController();
