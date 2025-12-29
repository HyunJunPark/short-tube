import { Video } from '@short-tube/types';

/**
 * Repository interface for VideoCache data access
 * Abstracts the underlying storage mechanism (FileStorage or Database)
 */
export interface IVideoCacheRepository {
  /**
   * Find all cached videos for a specific channel
   */
  findByChannel(channelId: string): Promise<Video[]>;

  /**
   * Save/update video cache for a channel
   * This will merge with existing cache, not replace it
   */
  saveForChannel(channelId: string, videos: Video[]): Promise<void>;

  /**
   * Delete all cached videos for a channel
   */
  deleteForChannel(channelId: string): Promise<void>;
}
