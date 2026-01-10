import { Video, VideoCache } from '@short-tube/types';
import { FileStorage } from '../../../../../lib/file-storage';
import { IVideoCacheRepository } from '../../interfaces';

/**
 * File-based implementation of IVideoCacheRepository
 * Uses FileStorage to persist video cache to video_cache.json
 */
export class FileVideoCacheRepository implements IVideoCacheRepository {
  private readonly VIDEO_CACHE_FILE = 'video_cache.json';

  constructor(private storage: FileStorage) {}

  async findByChannel(channelId: string): Promise<Video[]> {
    const cache = await this.loadCache();
    return cache[channelId] || [];
  }

  async saveForChannel(channelId: string, videos: Video[]): Promise<void> {
    const cache = await this.loadCache();
    const now = new Date().toISOString();

    // Add cached_at timestamp to all videos
    const videosWithTimestamp = videos.map(video => ({
      ...video,
      cached_at: now,
    }));

    // Merge with existing cache: keep old videos, add/update new ones
    const existingVideos = cache[channelId] || [];
    const existingIdSet = new Set(existingVideos.map(v => v.id));

    // Combine: new videos first, then existing videos that aren't in the new list
    const mergedVideos = [
      ...videosWithTimestamp,
      ...existingVideos.filter(v => !existingIdSet.has(v.id)),
    ];

    cache[channelId] = mergedVideos;
    await this.storage.writeJSON(this.VIDEO_CACHE_FILE, cache);
  }



  async deleteForChannel(channelId: string): Promise<void> {
    const cache = await this.loadCache();
    delete cache[channelId];
    await this.storage.writeJSON(this.VIDEO_CACHE_FILE, cache);
  }

  private async loadCache(): Promise<VideoCache> {
    const cache = await this.storage.readJSON<VideoCache>(this.VIDEO_CACHE_FILE);
    return cache || {};
  }
}
