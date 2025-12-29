import { Request, Response, NextFunction } from 'express';
import { dataService } from '../services/data.service';
import { geminiService } from '../services/gemini.service';

export class SummaryController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, channelName, year, month, day, limit, offset } = req.query;

      const summaries = await dataService.getAllSummaries({
        search: search as string,
        channelName: channelName as string,
        year: year ? Number(year) : undefined,
        month: month ? Number(month) : undefined,
        day: day ? Number(day) : undefined,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });

      res.json({ success: true, data: summaries });
    } catch (error) {
      next(error);
    }
  }

  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const { videoId, tags } = req.body;
      const requestId = Math.random().toString(36).substring(7);

      console.log(`[SummaryController] 🚀 [${requestId}] Summary generation request received`);
      console.log(`[SummaryController] [${requestId}] Video ID: ${videoId}`);
      console.log(`[SummaryController] [${requestId}] Tags: ${tags.join(', ') || '없음'}`);

      // Check cache first
      console.log(`[SummaryController] [${requestId}] 🔍 Checking cache...`);
      const cached = await dataService.getCachedSummary(videoId, tags);

      if (cached) {
        console.log(`[SummaryController] [${requestId}] ✅ Summary found in cache`);
        console.log(`[SummaryController] [${requestId}] 📦 Cached summary length: ${cached.length} characters`);
        return res.json({ success: true, data: { content: cached, cached: true } });
      }

      console.log(`[SummaryController] [${requestId}] ⚠️ Summary not in cache, generating new one...`);
      const startTime = Date.now();

      // Generate new summary
      const summary = await geminiService.getSummaryWithFallback(videoId, tags);

      const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[SummaryController] [${requestId}] ✅ Summary generated in ${generationTime}s`);

      // Get video details from all video caches
      console.log(`[SummaryController] [${requestId}] 🔎 Looking up video details...`);
      let videoTitle = '';
      let channelName = '';

      const subscriptions = await dataService.getSubscriptions();
      for (const subscription of subscriptions) {
        const videos = await dataService.getVideoCache(subscription.channel_id);
        const video = videos.find(v => v.id === videoId);
        if (video) {
          videoTitle = video.title;
          channelName = subscription.channel_name;
          console.log(`[SummaryController] [${requestId}] 📺 Found: ${channelName} - ${videoTitle}`);
          break;
        }
      }

      console.log(`[SummaryController] [${requestId}] 💾 Saving summary to storage...`);
      await dataService.saveSummary(
        videoId,
        tags,
        summary,
        videoTitle,
        channelName
      );

      console.log(`[SummaryController] [${requestId}] ✅ Summary saved successfully`);
      console.log(`[SummaryController] [${requestId}] �� Summary stats:`);
      console.log(`[SummaryController] [${requestId}]    📝 Length: ${summary.length} characters`);
      console.log(`[SummaryController] [${requestId}]    ⏱️ Total time: ${generationTime}s`);

      res.json({ success: true, data: { content: summary, cached: false } });
    } catch (error) {
      console.error(`[SummaryController] ❌ Summary generation failed:`, error);
      next(error);
    }
  }

  async getByDate(req: Request, res: Response, next: NextFunction) {
    try {
      const { date } = req.params;

      const summaries = await dataService.getSummariesForDate(date);

      res.json({ success: true, data: summaries });
    } catch (error) {
      next(error);
    }
  }

  async getByVideoId(req: Request, res: Response, next: NextFunction) {
    try {
      const { videoId } = req.params;

      const summary = await dataService.getSummaryByVideoId(videoId);

      if (!summary) {
        return res.status(404).json({ success: false, error: 'Summary not found' });
      }

      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }
}

export const summaryController = new SummaryController();
