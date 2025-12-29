import { UserSettings, AppData } from '@short-tube/types';
import { FileStorage } from '../../../../../lib/file-storage';
import { ISettingsRepository } from '../../interfaces';
import { DEFAULT_NOTIFICATION_TIME, DEFAULT_PLATFORM } from '../../../../../utils/constants';

/**
 * File-based implementation of ISettingsRepository
 * Uses FileStorage to persist settings to data.json
 */
export class FileSettingsRepository implements ISettingsRepository {
  private readonly DATA_FILE = 'data.json';

  constructor(private storage: FileStorage) {}

  async get(): Promise<UserSettings> {
    const data = await this.loadData();
    return data.user_settings;
  }

  async update(settings: Partial<UserSettings>): Promise<void> {
    const data = await this.loadData();
    data.user_settings = {
      ...data.user_settings,
      ...settings,
    };
    await this.saveData(data);
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
