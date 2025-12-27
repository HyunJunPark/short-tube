import { Request, Response, NextFunction } from 'express';
import { dataService } from '../services/data.service';
import { geminiService } from '../services/gemini.service';
import { youtubeService } from '../services/youtube.service';

export class SummaryController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, channelName, date, limit, offset } = req.query;

      const summaries = await dataService.getAllSummaries({
        search: search as string,
        channelName: channelName as string,
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

      // Check cache first
      const cached = await dataService.getCachedSummary(videoId, tags);

      if (cached) {
        return res.json({ success: true, data: { content: cached, cached: true } });
      }

      // Generate new summary
      const summary = await geminiService.getSummaryWithFallback(videoId, tags);

      // Get video details for title and channel name
      const videos = await youtubeService.getRecentVideos('', 1); // This is a simplified version
      const video = videos.find(v => v.id === videoId);

      await dataService.saveSummary(
        videoId,
        tags,
        summary,
        video?.title || '',
        '' // channel name would need to be passed or looked up
      );

      res.json({ success: true, data: { content: summary, cached: false } });
    } catch (error) {
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
}

export const summaryController = new SummaryController();
