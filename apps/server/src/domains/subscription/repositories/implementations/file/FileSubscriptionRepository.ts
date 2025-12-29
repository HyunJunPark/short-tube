import { Subscription, AppData } from '@short-tube/types';
import { FileStorage } from '../../../../../lib/file-storage';
import { ISubscriptionRepository } from '../../interfaces';
import { DEFAULT_NOTIFICATION_TIME, DEFAULT_PLATFORM } from '../../../../../utils/constants';

/**
 * File-based implementation of ISubscriptionRepository
 * Uses FileStorage to persist subscriptions to data.json
 */
export class FileSubscriptionRepository implements ISubscriptionRepository {
  private readonly DATA_FILE = 'data.json';

  constructor(private storage: FileStorage) {}

  async findAll(): Promise<Subscription[]> {
    const data = await this.loadData();
    return data.subscriptions;
  }

  async findById(channelId: string): Promise<Subscription | null> {
    const subscriptions = await this.findAll();
    return subscriptions.find(sub => sub.channel_id === channelId) || null;
  }

  async create(subscription: Subscription): Promise<void> {
    const data = await this.loadData();
    data.subscriptions.push(subscription);
    await this.saveData(data);
  }

  async update(channelId: string, updates: Partial<Subscription>): Promise<void> {
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

  async delete(channelId: string): Promise<void> {
    const data = await this.loadData();
    data.subscriptions = data.subscriptions.filter(
      sub => sub.channel_id !== channelId
    );
    await this.saveData(data);
  }

  async exists(channelId: string): Promise<boolean> {
    const subscription = await this.findById(channelId);
    return subscription !== null;
  }

  async findActive(): Promise<Subscription[]> {
    const subscriptions = await this.findAll();
    return subscriptions.filter(sub => sub.is_active !== false);
  }

  private async loadData(): Promise<AppData> {
    const data = await this.storage.readJSON<AppData>(this.DATA_FILE);
    if (!data) {
      return this.getDefaultData();
    }
    return data;
  }

  private async saveData(data: AppData): Promise<void> {
    await this.storage.writeJSON(this.DATA_FILE, data);
  }

  private getDefaultData(): AppData {
    return {
      user_settings: {
        notification_time: DEFAULT_NOTIFICATION_TIME,
        target_platform: DEFAULT_PLATFORM,
        telegram_token: '',
        telegram_chat_id: '',
        notification_enabled: true,
      },
      subscriptions: [],
    };
  }
}
