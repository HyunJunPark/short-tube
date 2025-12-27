import { Request, Response, NextFunction } from 'express';
import { dataService } from '../services/data.service';
import { geminiService } from '../services/gemini.service';

export class BriefingController {
  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { date } = req.params;

      const briefing = await dataService.getBriefing(date);

      if (briefing) {
        res.json({ success: true, data: briefing });
      } else {
        res.status(404).json({ success: false, message: 'Briefing not found' });
      }
    } catch (error) {
      next(error);
    }
  }

  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const { date } = req.body;
      const targetDate = date || new Date().toISOString().split('T')[0];

      // Get all summaries for the date
      const summaries = await dataService.getSummariesForDate(targetDate);

      if (summaries.length === 0) {
        return res.json({
          success: true,
          data: { content: '오늘은 새로운 영상 요약이 없습니다.' },
        });
      }

      // Get all unique tags
      const allTags = Array.from(
        new Set(summaries.flatMap(s => s.tags))
      );

      // Generate briefing
      const briefingContent = await geminiService.generateBriefing(summaries, allTags);

      // Save briefing
      await dataService.saveSummary(
        `BRIEFING_${targetDate}`,
        ['briefing'],
        briefingContent,
        `${targetDate} 데일리 브리핑`,
        'System'
      );

      res.json({ success: true, data: { content: briefingContent } });
    } catch (error) {
      next(error);
    }
  }
}

export const briefingController = new BriefingController();
