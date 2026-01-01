import { NotificationLog } from '@short-tube/types';

export interface INotificationLogRepository {
  /**
   * Get notification log for a channel
   */
  getForChannel(channelId: string): Promise<{
    last_checked_at: string;
    checked_video_ids: string[];
  } | null>;

  /**
   * Update last checked time for a channel
   */
  updateLastCheckedAt(channelId: string, checkedAt: string): Promise<void>;

  /**
   * Add video IDs to checked list
   */
  addCheckedVideos(channelId: string, videoIds: string[]): Promise<void>;

  /**
   * Get all notification logs
   */
  getAll(): Promise<NotificationLog>;

  /**
   * Initialize notification log for a channel if not exists
   */
  initializeIfNotExists(channelId: string): Promise<void>;
}
