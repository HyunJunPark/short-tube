import { Summary, SummaryCache, Video, VideoCache } from '@short-tube/types';
import { FileStorage } from '../../../../../lib/file-storage';
import { ISummaryRepository, SummaryEntity, SummaryQueryOptions } from '../../interfaces';

/**
 * File-based implementation of ISummaryRepository
 * Uses FileStorage to persist summaries to summaries.json
 * Handles both legacy string format and new object format for backward compatibility
 */
export class FileSummaryRepository implements ISummaryRepository {
  private readonly SUMMARIES_FILE = 'summaries.json';
  private readonly VIDEO_CACHE_FILE = 'video_cache.json';

  constructor(private storage: FileStorage) {}

  async findByVideoId(videoId: string, tags: string[]): Promise<string | null> {
    const summaries = await this.loadSummaries();
    const tagKey = tags.length > 0 ? tags.sort().join(',') : 'none';
    const cacheKey = `${videoId}_${tagKey}`;

    const summary = summaries[cacheKey];

    if (!summary) {
      return null;
    }

    // Handle both old string format and new object format
    if (typeof summary === 'string') {
      return summary;
    }

    return summary.content;
  }

  async findByDate(date: string): Promise<Summary[]> {
    const summaries = await this.loadSummaries();
    const results: Summary[] = [];

    for (const [key, value] of Object.entries(summaries)) {
      // Skip BRIEFING_ entries
      if (key.startsWith('BRIEFING_')) {
        continue;
      }

      // Handle both string and object formats
      let summary: Summary;
      if (typeof value === 'string') {
        // Legacy format - skip for date queries
        continue;
      } else {
        summary = value;
      }

      // Check if date matches
      if (summary.date && summary.date.startsWith(date)) {
        results.push(summary);
      }
    }

    // Sort by date descending
    results.sort((a, b) => b.date.localeCompare(a.date));

    return results;
  }

  async findAll(options?: SummaryQueryOptions): Promise<Summary[]> {
    const summaries = await this.loadSummaries();
    let results: Summary[] = [];

    for (const [key, value] of Object.entries(summaries)) {
      // Skip BRIEFING_ entries for general queries
      if (key.startsWith('BRIEFING_')) {
        continue;
      }

      // Handle both string and object formats
      let summary: Summary;
      if (typeof value === 'string') {
        // Legacy format - create minimal Summary object
        const parts = key.split('_');
        summary = {
          content: value,
          title: '',
          channel_name: '',
          video_id: parts[0] || '',
          tags: parts.slice(1) || [],
          date: '',
        };
      } else {
        summary = value;
      }

      results.push(summary);
    }

    // Apply filters
    if (options?.search) {
      const search = options.search.toLowerCase();
      results = results.filter(
        s =>
          s.title.toLowerCase().includes(search) ||
          s.content.toLowerCase().includes(search)
      );
    }

    if (options?.channelName) {
      results = results.filter(s => s.channel_name === options.channelName);
    }

    // Apply date filter based on video published_at
    if (options?.year || options?.month || options?.day) {
      const videoCache = await this.loadVideoCache();

      // Create a flat video lookup map for O(1) access
      const videoLookup = new Map<string, Video>();
      for (const videos of Object.values(videoCache)) {
        for (const video of videos) {
          videoLookup.set(video.id, video);
        }
      }

      results = results.filter(s => {
        const video = videoLookup.get(s.video_id);
        if (!video || !video.published_at) return false;

        const publishedDate = new Date(video.published_at);

        if (options.year && publishedDate.getFullYear() !== options.year) {
          return false;
        }
        if (options.month && publishedDate.getMonth() + 1 !== options.month) {
          return false;
        }
        if (options.day && publishedDate.getDate() !== options.day) {
          return false;
        }

        return true;
      });
    }

    // Sort by date descending
    results.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    // Apply pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || results.length;

    return results.slice(offset, offset + limit);
  }

  async save(entity: SummaryEntity): Promise<void> {
    const summaries = await this.loadSummaries();

    const tagKey = entity.tags.length > 0 ? entity.tags.sort().join(',') : 'none';
    const cacheKey = `${entity.video_id}_${tagKey}`;

    const summary: Summary = {
      content: entity.content,
      title: entity.title,
      channel_name: entity.channel_name,
      video_id: entity.video_id,
      tags: entity.tags,
      date: entity.date,
    };

    summaries[cacheKey] = summary;

    await this.storage.writeJSON(this.SUMMARIES_FILE, summaries);
  }

  async findBriefing(date: string): Promise<Summary | null> {
    const summaries = await this.loadSummaries();
    const briefingKey = `BRIEFING_${date}_briefing`;

    const briefing = summaries[briefingKey];

    if (!briefing) {
      return null;
    }

    if (typeof briefing === 'string') {
      return {
        content: briefing,
        title: `${date} 데일리 브리핑`,
        channel_name: 'System',
        video_id: `BRIEFING_${date}`,
        tags: ['briefing'],
        date: '',
      };
    }

    return briefing;
  }

  async deleteByVideoId(videoId: string, tags: string[]): Promise<void> {
    const summaries = await this.loadSummaries();
    const tagKey = tags.length > 0 ? tags.sort().join(',') : 'none';
    const cacheKey = `${videoId}_${tagKey}`;

    if (cacheKey in summaries) {
      delete summaries[cacheKey];
      await this.storage.writeJSON(this.SUMMARIES_FILE, summaries);
    }
  }

  private async loadSummaries(): Promise<SummaryCache> {
    const summaries = await this.storage.readJSON<SummaryCache>(this.SUMMARIES_FILE);
    return summaries || {};
  }

  private async loadVideoCache(): Promise<VideoCache> {
    const cache = await this.storage.readJSON<VideoCache>(this.VIDEO_CACHE_FILE);
    return cache || {};
  }
}
