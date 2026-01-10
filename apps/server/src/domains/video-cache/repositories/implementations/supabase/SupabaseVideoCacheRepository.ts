import { Video } from '@short-tube/types';
import { SupabaseClient } from '@supabase/supabase-js';
import { IVideoCacheRepository } from '../../interfaces';
import { isVideoShort } from '../../../../../utils/video.utils';

/**
 * Supabase-based implementation of IVideoCacheRepository
 * Uses Supabase to persist video cache to videos table
 */
export class SupabaseVideoCacheRepository implements IVideoCacheRepository {
  private readonly TABLE_NAME = 'videos';

  constructor(private supabase: SupabaseClient) { }

  async findByChannel(channelId: string): Promise<Video[]> {
    const { data, error } = await this.supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('channel_id', channelId)
      .order('published_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch videos for channel ${channelId}: ${error.message}`);
    }

    return (data || []).map(row => this.mapToVideo(row));
  }

  async saveForChannel(channelId: string, videos: Video[]): Promise<void> {
    if (videos.length === 0) {
      return;
    }

    const now = new Date().toISOString();

    const videosWithTimestamp = videos.map(video => ({
      id: video.id,
      channel_id: channelId,
      title: video.title,
      published_at: video.published_at,
      has_caption: video.has_caption,
      duration: video.duration || 'N/A',
      source: video.source || 'api',
      cached_at: now,
    }));

    const { error } = await this.supabase
      .from(this.TABLE_NAME)
      .upsert(videosWithTimestamp, {
        onConflict: 'id',
        ignoreDuplicates: false,
      });

    if (error) {
      throw new Error(`Failed to save videos for channel ${channelId}: ${error.message}`);
    }
  }

  async deleteForChannel(channelId: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.TABLE_NAME)
      .delete()
      .eq('channel_id', channelId);

    if (error) {
      throw new Error(`Failed to delete videos for channel ${channelId}: ${error.message}`);
    }
  }

  private mapToVideo(row: any): Video {
    const title = row.title;
    const duration = row.duration || 'N/A';

    return {
      id: row.id,
      title,
      published_at: row.published_at,
      has_caption: row.has_caption,
      duration,
      cached_at: row.cached_at,
      source: row.source || 'api',
      is_short: isVideoShort(title, duration),
    };
  }
}
