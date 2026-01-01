import { NotificationLog } from '@short-tube/types';
import { FileStorage } from '../../lib/file-storage';
import { INotificationLogRepository } from './repositories';

export class NotificationLogFileStorage implements INotificationLogRepository {
  private storage: FileStorage;
  private readonly fileName = 'notification_log.json';

  constructor(dataDir?: string) {
    this.storage = new FileStorage(dataDir);
  }

  async getForChannel(channelId: string): Promise<{
    last_checked_at: string;
    checked_video_ids: string[];
  } | null> {
    const logs = await this.getAll();
    return logs[channelId] || null;
  }

  async updateLastCheckedAt(channelId: string, checkedAt: string): Promise<void> {
    const logs = await this.getAll();

    if (!logs[channelId]) {
      logs[channelId] = {
        last_checked_at: checkedAt,
        checked_video_ids: [],
      };
    } else {
      logs[channelId].last_checked_at = checkedAt;
    }

    await this.storage.writeJSON(this.fileName, logs);
  }

  async addCheckedVideos(channelId: string, videoIds: string[]): Promise<void> {
    const logs = await this.getAll();

    if (!logs[channelId]) {
      logs[channelId] = {
        last_checked_at: new Date().toISOString(),
        checked_video_ids: videoIds,
      };
    } else {
      // Add new video IDs, avoiding duplicates
      const existingIds = new Set(logs[channelId].checked_video_ids);
      for (const id of videoIds) {
        existingIds.add(id);
      }
      logs[channelId].checked_video_ids = Array.from(existingIds);
    }

    await this.storage.writeJSON(this.fileName, logs);
  }

  async getAll(): Promise<NotificationLog> {
    try {
      const data = await this.storage.readJSON<NotificationLog>(this.fileName);
      return data || {};
    } catch (error) {
      // File doesn't exist yet, return empty object
      return {};
    }
  }

  async initializeIfNotExists(channelId: string): Promise<void> {
    const logs = await this.getAll();

    if (!logs[channelId]) {
      logs[channelId] = {
        last_checked_at: new Date().toISOString(),
        checked_video_ids: [],
      };
      await this.storage.writeJSON(this.fileName, logs);
    }
  }
}
