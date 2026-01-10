import { NotificationLog } from '@short-tube/types';
import { SupabaseClient } from '@supabase/supabase-js';
import { INotificationLogRepository } from '../../repositories';

/**
 * Supabase implementation of INotificationLogRepository
 * Uses Supabase client to persist notification logs to notification_logs table
 */
export class SupabaseNotificationLogRepository implements INotificationLogRepository {
  private readonly TABLE_NAME = 'notification_logs';

  constructor(private supabase: SupabaseClient) {}

  async getForChannel(channelId: string): Promise<{
    last_checked_at: string;
    checked_video_ids: string[];
  } | null> {
    const { data, error } = await this.supabase
      .from(this.TABLE_NAME)
      .select('last_checked_at, checked_video_ids')
      .eq('channel_id', channelId)
      .single();

    if (error) {
      // PGRST116 means no rows found
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to fetch notification log for channel ${channelId}: ${error.message}`);
    }

    return {
      last_checked_at: data.last_checked_at,
      checked_video_ids: data.checked_video_ids || [],
    };
  }

  async updateLastCheckedAt(channelId: string, checkedAt: string): Promise<void> {
    // Try to update first
    const { error: updateError } = await this.supabase
      .from(this.TABLE_NAME)
      .update({ last_checked_at: checkedAt })
      .eq('channel_id', channelId);

    if (updateError) {
      // If update fails, try to insert (channel might not exist yet)
      const { error: insertError } = await this.supabase
        .from(this.TABLE_NAME)
        .insert({
          channel_id: channelId,
          last_checked_at: checkedAt,
          checked_video_ids: [],
        });

      if (insertError) {
        // If insert also fails due to unique constraint, ignore (race condition)
        if (insertError.code !== '23505') {
          throw new Error(`Failed to update last checked time for channel ${channelId}: ${insertError.message}`);
        }
      }
    }
  }

  async addCheckedVideos(channelId: string, videoIds: string[]): Promise<void> {
    if (videoIds.length === 0) {
      return;
    }

    // Get current checked video IDs
    const current = await this.getForChannel(channelId);

    if (!current) {
      // Create new entry
      const { error } = await this.supabase
        .from(this.TABLE_NAME)
        .insert({
          channel_id: channelId,
          last_checked_at: new Date().toISOString(),
          checked_video_ids: videoIds,
        });

      if (error && error.code !== '23505') {
        throw new Error(`Failed to add checked videos for channel ${channelId}: ${error.message}`);
      }
      return;
    }

    // Merge with existing IDs (avoid duplicates)
    const existingIds = new Set(current.checked_video_ids);
    for (const id of videoIds) {
      existingIds.add(id);
    }
    const mergedIds = Array.from(existingIds);

    // Update the entry
    const { error } = await this.supabase
      .from(this.TABLE_NAME)
      .update({
        checked_video_ids: mergedIds,
      })
      .eq('channel_id', channelId);

    if (error) {
      throw new Error(`Failed to add checked videos for channel ${channelId}: ${error.message}`);
    }
  }

  async getAll(): Promise<NotificationLog> {
    const { data, error } = await this.supabase
      .from(this.TABLE_NAME)
      .select('channel_id, last_checked_at, checked_video_ids')
      .order('channel_id');

    if (error) {
      throw new Error(`Failed to fetch all notification logs: ${error.message}`);
    }

    // Convert array to object keyed by channel_id
    const logs: NotificationLog = {};
    for (const row of data || []) {
      logs[row.channel_id] = {
        last_checked_at: row.last_checked_at,
        checked_video_ids: row.checked_video_ids || [],
      };
    }

    return logs;
  }

  async initializeIfNotExists(channelId: string): Promise<void> {
    // Check if exists
    const existing = await this.getForChannel(channelId);

    if (!existing) {
      // Insert new entry
      const { error } = await this.supabase
        .from(this.TABLE_NAME)
        .insert({
          channel_id: channelId,
          last_checked_at: new Date().toISOString(),
          checked_video_ids: [],
        });

      // Ignore unique constraint violation (race condition)
      if (error && error.code !== '23505') {
        throw new Error(`Failed to initialize notification log for channel ${channelId}: ${error.message}`);
      }
    }
  }
}
