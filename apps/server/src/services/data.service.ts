import {
  AppData,
  UserSettings,
  Subscription,
  Summary,
  SummaryCache,
  VideoCache,
  Video,
} from '@short-tube/types';
import { FileStorage } from '../lib/file-storage';
import { DEFAULT_NOTIFICATION_TIME, DEFAULT_PLATFORM } from '../utils/constants';

export class DataService {
  private storage: FileStorage;
  private readonly DATA_FILE = 'data.json';
  private readonly SUMMARIES_FILE = 'summaries.json';
  private readonly VIDEO_CACHE_FILE = 'video_cache.json';

  constructor(storage?: FileStorage) {
    this.storage = storage || new FileStorage();
  }

  // ========================================
  // Data (Settings + Subscriptions)
  // ========================================

  async loadData(): Promise<AppData> {
    const data = await this.storage.readJSON<AppData>(this.DATA_FILE);

    if (!data) {
      return this.getDefaultData();
    }

    return data;
  }

  async saveData(data: AppData): Promise<void> {
    await this.storage.writeJSON(this.DATA_FILE, data);
  }

  private getDefaultData(): AppData {
    return {
      user_settings: {
        notification_time: DEFAULT_NOTIFICATION_TIME,
        target_platform: DEFAULT_PLATFORM,
        telegram_token: '',
        telegram_chat_id: '',
      },
      subscriptions: [],
    };
  }

  // ========================================
  // Subscriptions
  // ========================================

  async getSubscriptions(): Promise<Subscription[]> {
    const data = await this.loadData();
    return data.subscriptions;
  }

  async getSubscriptionById(channelId: string): Promise<Subscription | null> {
    const subscriptions = await this.getSubscriptions();
    return subscriptions.find(sub => sub.channel_id === channelId) || null;
  }

  async addSubscription(subscription: Subscription): Promise<void> {
    const data = await this.loadData();

    // Check if already exists
    const exists = data.subscriptions.some(
      sub => sub.channel_id === subscription.channel_id
    );

    if (exists) {
      throw new Error('Channel already subscribed');
    }

    data.subscriptions.push(subscription);
    await this.saveData(data);
  }

  async updateSubscription(
    channelId: string,
    updates: Partial<Subscription>
  ): Promise<void> {
    const data = await this.loadData();

    const index = data.subscriptions.findIndex(
      sub => sub.channel_id === channelId
    );

    if (index === -1) {
      throw new Error('Subscription not found');
    }

    data.subscriptions[index] = {
      ...data.subscriptions[index],
      ...updates,
    };

    await this.saveData(data);
  }

  async deleteSubscription(channelId: string): Promise<void> {
    const data = await this.loadData();

    data.subscriptions = data.subscriptions.filter(
      sub => sub.channel_id !== channelId
    );

    await this.saveData(data);

    // Also clear video cache for this channel
    await this.deleteVideoCache(channelId);
  }

  // ========================================
  // Settings
  // ========================================

  async getSettings(): Promise<UserSettings> {
    const data = await this.loadData();
    return data.user_settings;
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<void> {
    const data = await this.loadData();

    data.user_settings = {
      ...data.user_settings,
      ...settings,
    };

    await this.saveData(data);
  }

  // ========================================
  // Summaries
  // ========================================

  async loadSummaries(): Promise<SummaryCache> {
    const summaries = await this.storage.readJSON<SummaryCache>(this.SUMMARIES_FILE);
    return summaries || {};
  }

  async saveSummary(
    videoId: string,
    tags: string[],
    content: string,
    title: string = '',
    channelName: string = ''
  ): Promise<void> {
    const summaries = await this.loadSummaries();

    const tagKey = tags.length > 0 ? tags.sort().join(',') : 'none';
    const cacheKey = `${videoId}_${tagKey}`;

    const summary: Summary = {
      content,
      title,
      channel_name: channelName,
      video_id: videoId,
      tags,
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    summaries[cacheKey] = summary;

    await this.storage.writeJSON(this.SUMMARIES_FILE, summaries);
  }

  async getCachedSummary(videoId: string, tags: string[]): Promise<string | null> {
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

  async getSummariesForDate(dateStr: string): Promise<Summary[]> {
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
      if (summary.date && summary.date.startsWith(dateStr)) {
        results.push(summary);
      }
    }

    // Sort by date descending
    results.sort((a, b) => b.date.localeCompare(a.date));

    return results;
  }

  async getAllSummaries(options?: {
    search?: string;
    channelName?: string;
    limit?: number;
    offset?: number;
  }): Promise<Summary[]> {
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

    // Sort by date descending
    results.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    // Apply pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || results.length;

    return results.slice(offset, offset + limit);
  }

  async getBriefing(date: string): Promise<Summary | null> {
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

  // ========================================
  // Video Cache
  // ========================================

  async loadVideoCache(): Promise<VideoCache> {
    const cache = await this.storage.readJSON<VideoCache>(this.VIDEO_CACHE_FILE);
    return cache || {};
  }

  async getVideoCache(channelId: string): Promise<Video[]> {
    const cache = await this.loadVideoCache();
    return cache[channelId] || [];
  }

  async saveVideoCache(channelId: string, videos: Video[]): Promise<void> {
    const cache = await this.loadVideoCache();
    cache[channelId] = videos;
    await this.storage.writeJSON(this.VIDEO_CACHE_FILE, cache);
  }

  async deleteVideoCache(channelId: string): Promise<void> {
    const cache = await this.loadVideoCache();
    delete cache[channelId];
    await this.storage.writeJSON(this.VIDEO_CACHE_FILE, cache);
  }
}

// Singleton instance
export const dataService = new DataService();
