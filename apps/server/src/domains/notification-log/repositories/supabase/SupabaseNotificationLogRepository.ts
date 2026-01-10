import { NotificationLog } from '@short-tube/types';
import { SupabaseClient } from '@supabase/supabase-js';
import { INotificationLogRepository } from '../../repositories';

/**
 * Supabase-based implementation of INotificationLogRepository
 * Uses Supabase to persist notification logs to notification_logs table
 */
export class SupabaseNotificationLogRepository implements INotificationLogRepository {
  private readonly TABLE_NAME = 'notification_logs';

  constructor(private supabase: SupabaseClient) {}

  async getForChannel(channelId: string): Promise<{ last_checked_at: string; checked_video_ids: string[] } | null> {
    const { data, error } = await this.supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('channel_id', channelId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch notification log: ${error.message}`);
    }

    return {
      last_checked_at: data.last_checked_at,
      checked_video_ids: data.checked_video_ids || [],
    };
  }

  async updateLastCheckedAt(channelId: string, checkedAt: string): Promise<void> {
    const existing = await this.getForChannel(channelId);

    if (existing) {
      const { error } = await this.supabase
        .from(this.TABLE_NAME)
        .update({ last_checked_at: checkedAt })
        .eq('channel_id', channelId);

      if (error) {
        throw new Error(`Failed to update last_checked_at: ${error.message}`);
      }
    } else {
      const { error } = await this.supabase
        .from(this.TABLE_NAME)
        .insert({
          channel_id: channelId,
          last_checked_at: checkedAt,
          checked_video_ids: [],
        });

      if (error && error.code !== '23505') {
        throw new Error(`Failed to create notification log: ${error.message}`);
      }
    }
  }

  async addCheckedVideos(channelId: string, videoIds: string[]): Promise<void> {
    const existing = await this.getForChannel(channelId);
    const currentIds = new Set(existing?.checked_video_ids || []);

    for (const id of videoIds) {
      currentIds.add(id);
    }

    const mergedIds = Array.from(currentIds);

    if (existing) {
      const { error } = await this.supabase
        .from(this.TABLE_NAME)
        .update({ checked_video_ids: mergedIds })
        .eq('channel_id', channelId);

      if (error) {
        throw new Error(`Failed to add checked videos: ${error.message}`);
      }
    } else {
      const { error } = await this.supabase
        .from(this.TABLE_NAME)
        .insert({
          channel_id: channelId,
          last_checked_at: new Date().toISOString(),
          checked_video_ids: mergedIds,
        });

      if (error && error.code !== '23505') {
        throw new Error(`Failed to create notification log: ${error.message}`);
      }
    }
  }

  async getAll(): Promise<NotificationLog> {
    const { data, error } = await this.supabase
      .from(this.TABLE_NAME)
      .select('*');

    if (error) {
      throw new Error(`Failed to fetch all notification logs: ${error.message}`);
    }

    const result: NotificationLog = {};
    for (const row of data || []) {
      result[row.channel_id] = {
        last_checked_at: row.last_checked_at,
        checked_video_ids: row.checked_video_ids || [],
      };
    }

    return result;
  }

  async initializeIfNotExists(channelId: string): Promise<void> {
    const existing = await this.getForChannel(channelId);
    if (!existing) {
      const { error } = await this.supabase
        .from(this.TABLE_NAME)
        .insert({
          channel_id: channelId,
          last_checked_at: new Date().toISOString(),
          checked_video_ids: [],
        });

      if (error && error.code !== '23505') {
        throw new Error(`Failed to initialize notification log: ${error.message}`);
      }
    }
  }
}
