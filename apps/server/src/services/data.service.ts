import {
  Subscription,
  Summary,
  Video,
  UserSettings,
} from '@short-tube/types';
import { ISubscriptionRepository } from '../domains/subscription/repositories';
import { ISettingsRepository } from '../domains/settings/repositories';
import { ISummaryRepository, SummaryEntity, SummaryQueryOptions } from '../domains/summary/repositories';
import { IVideoCacheRepository } from '../domains/video-cache/repositories';

/**
 * DataService - Business logic layer
 *
 * Handles application business rules and coordinates between repositories.
 * Does NOT directly access FileStorage - all data access goes through repositories.
 *
 * This refactored version separates concerns:
 * - Business logic: validation, rules, data coordination
 * - Data access: delegated to repository layer
 */
export class DataService {
  constructor(
    private subscriptionRepo: ISubscriptionRepository,
    private settingsRepo: ISettingsRepository,
    private summaryRepo: ISummaryRepository,
    private videoCacheRepo: IVideoCacheRepository
  ) { }

  // ========================================
  // Subscriptions
  // ========================================

  async getSubscriptions(): Promise<Subscription[]> {
    return this.subscriptionRepo.findAll();
  }

  async getSubscriptionById(channelId: string): Promise<Subscription | null> {
    return this.subscriptionRepo.findById(channelId);
  }

  async addSubscription(subscription: Subscription): Promise<void> {
    // Business rule: Check for duplicates
    const exists = await this.subscriptionRepo.exists(subscription.channel_id);
    if (exists) {
      throw new Error('Channel already subscribed');
    }

    await this.subscriptionRepo.create(subscription);
  }

  async updateSubscription(
    channelId: string,
    updates: Partial<Subscription>
  ): Promise<void> {
    // Business rule: Verify subscription exists before updating
    const exists = await this.subscriptionRepo.exists(channelId);
    if (!exists) {
      throw new Error('Subscription not found');
    }

    await this.subscriptionRepo.update(channelId, updates);
  }

  async deleteSubscription(channelId: string): Promise<void> {
    await this.subscriptionRepo.delete(channelId);

    // Business rule: Clean up related data when subscription is deleted
    await this.videoCacheRepo.deleteForChannel(channelId);
  }

  // ========================================
  // Settings
  // ========================================

  async getSettings(): Promise<UserSettings> {
    return this.settingsRepo.get();
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<void> {
    await this.settingsRepo.update(settings);
  }

  // ========================================
  // Summaries
  // ========================================

  async saveSummary(
    videoId: string,
    tags: string[],
    content: string,
    title: string = '',
    channelName: string = ''
  ): Promise<void> {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const entity: SummaryEntity = {
      content,
      title,
      channel_name: channelName,
      video_id: videoId,
      tags,
      date: now,
    };

    await this.summaryRepo.save(entity);
  }

  async getCachedSummary(videoId: string, tags: string[]): Promise<string | null> {
    return this.summaryRepo.findByVideoId(videoId, tags);
  }

  async getSummariesForDate(dateStr: string): Promise<Summary[]> {
    return this.summaryRepo.findByDate(dateStr);
  }

  async getAllSummaries(options?: SummaryQueryOptions): Promise<Summary[]> {
    return this.summaryRepo.findAll(options);
  }

  async getSummaryByVideoId(videoId: string): Promise<Summary | null> {
    // This method searches across all summaries for a specific video ID
    // Since the repository findByVideoId requires tags, we need to search through all summaries
    const allSummaries = await this.summaryRepo.findAll();
    return allSummaries.find(s => s.video_id === videoId) || null;
  }

  async getBriefing(date: string): Promise<Summary | null> {
    return this.summaryRepo.findBriefing(date);
  }

  async deleteSummary(videoId: string, tags: string[]): Promise<void> {
    return this.summaryRepo.deleteByVideoId(videoId, tags);
  }

  // ========================================
  // Video Cache
  // ========================================

  async getVideoCache(channelId: string): Promise<Video[]> {
    return this.videoCacheRepo.findByChannel(channelId);
  }

  async saveVideoCache(channelId: string, videos: Video[]): Promise<void> {
    // Business logic: Add timestamp and merge with existing cache
    await this.videoCacheRepo.saveForChannel(channelId, videos);
  }

  async deleteVideoCache(channelId: string): Promise<void> {
    await this.videoCacheRepo.deleteForChannel(channelId);
  }
}
