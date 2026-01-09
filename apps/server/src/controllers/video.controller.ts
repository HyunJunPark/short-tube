import { Request, Response, NextFunction } from 'express';
import { dataService, notificationLogRepository, videoCacheRepository } from '../repositories';
import { youtubeService } from '../services/youtube.service';

export class VideoController {
  private isVideoShort = (title: string, duration: string): boolean => {
    // First check if title contains #shorts
    if (title.includes('#shorts')) {
      return true;
    }

    // Also filter by duration as a fallback (< 1 minute)
    const parts = duration.split(':');

    if (parts.length === 3) {
      // HH:MM:SS format - not a short
      return false;
    }

    if (parts.length === 2) {
      // MM:SS format
      const minutes = parseInt(parts[0], 10);
      return minutes < 1;
    }

    // N/A or unknown - treat as non-short to preserve
    return false;
  };

  async getByChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const { channelId } = req.params;

      // Return cache filtered to exclude shorts
      const cached = await dataService.getVideoCache(channelId);
      const filtered = cached.filter(video => {
        // Check if title contains exact #shorts tag
        if (video.title.match(/#shorts\b/i)) {
          return false;
        }

        // Check if duration is < 1 minute
        const parts = video.duration.split(':');
        if (parts.length === 2) {
          const minutes = parseInt(parts[0], 10);
          if (minutes < 1) {
            return false;
          }
        }

        return true;
      });
      res.json({ success: true, data: filtered, cached: true });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      console.log('Refreshing videos for channel:', req.params.channelId);
      const { channelId } = req.params;
      
      // Fetch 30 days of videos on refresh via API for complete data
      const [allNewVideos, isFromAPI] = await youtubeService.getRecentVideos(channelId, 30);
      
      // Filter out shorts from new videos
      const newVideos = allNewVideos.filter(video => {
        const isShort = video.title.match(/#shorts\b/i) || 
          (video.duration.split(':').length === 2 && parseInt(video.duration.split(':')[0], 10) < 1);
        return !isShort;
      });

      // Get existing cached videos
      const cachedVideos = await dataService.getVideoCache(channelId);

      let finalVideos: typeof newVideos;

      if (isFromAPI) {
        // API success: Merge API data with cached data
        // For videos in both API and cache: use API version (complete metadata)
        // For videos only in cache: enrich with API metadata if available, preserve if not
        const newVideoIds = new Set(newVideos.map(v => v.id));
        const preservedVideos = cachedVideos.filter(cv => !newVideoIds.has(cv.id));
        
        // Track videos that were updated with enriched metadata
        const enrichedVideoIds = new Set<string>();
        
        // Try to enrich preserved videos with API metadata
        const enrichedPreserved: typeof newVideos = [];
        
        for (const cachedVideo of preservedVideos) {
          // Skip shorts (title contains exact #shorts tag or duration < 1 minute)
          const isShort = cachedVideo.title.match(/#shorts\b/i) || 
            (cachedVideo.duration.split(':').length === 2 && parseInt(cachedVideo.duration.split(':')[0], 10) < 1);
          if (isShort) {
            continue;
          }
          
          // Check if this video might be enrichable from API
          // (only if it's from RSS and has incomplete metadata)
          if (cachedVideo.source === 'rss' && cachedVideo.duration === 'N/A') {
            // Try to get metadata from API for this specific video
            try {
              const videoDetails = await youtubeService.getVideoMetadata(cachedVideo.id);
              if (videoDetails) {
                // Found metadata, update the video
                enrichedPreserved.push({
                  ...cachedVideo,
                  ...videoDetails,
                  source: 'api' as const, // Update source since we got API data
                } as typeof newVideos[0]);
                enrichedVideoIds.add(cachedVideo.id);
                continue;
              }
            } catch (error) {
              console.warn(`Could not enrich video ${cachedVideo.id}:`, error);
              // Fall through to preserve as-is
            }
          }
          
          enrichedPreserved.push(cachedVideo);
        }
        
        finalVideos = [...newVideos, ...enrichedPreserved];
        await videoCacheRepository.replaceForChannel(channelId, finalVideos);
        
        // Invalidate summaries for videos that were updated with new metadata
        // This allows MonitorJob to regenerate summaries with updated metadata
        const subscription = await dataService.getSubscriptionById(channelId);
        if (subscription) {
          for (const videoId of enrichedVideoIds) {
            await dataService.deleteSummary(videoId, subscription.tags);
          }
          // Also invalidate summaries for new API videos (from newVideos)
          // to ensure they get fresh summaries with complete metadata
          for (const video of newVideos) {
            await dataService.deleteSummary(video.id, subscription.tags);
          }
        }
      } else {
        // API failed, RSS fallback: Keep existing cache, only add new RSS videos
        finalVideos = [
          ...newVideos.filter(nv => !cachedVideos.some(cv => cv.id === nv.id)),
          ...cachedVideos,
        ];
        await videoCacheRepository.saveForChannel(channelId, finalVideos);
      }

      res.json({ success: true, data: finalVideos });
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
